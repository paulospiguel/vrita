import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Obter quiz pelo código de compartilhamento
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar quiz pelo share_code
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        share_code,
        questions_count,
        time_per_question,
        status
      `)
      .eq("share_code", code.toUpperCase())
      .single()

    if (error || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (quiz.status !== "active") {
      return NextResponse.json(
        { error: "Este quiz não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o usuário já tem participação
    const { data: existingParticipant } = await supabase
      .from("quiz_participants")
      .select("id, status, current_question_index")
      .eq("quiz_id", quiz.id)
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      quiz,
      hasParticipation: !!existingParticipant,
      participantStatus: existingParticipant?.status || null
    })
  } catch (error) {
    console.error("Erro ao obter quiz por código:", error)
    return NextResponse.json(
      { error: "Erro ao obter quiz" },
      { status: 500 }
    )
  }
}

