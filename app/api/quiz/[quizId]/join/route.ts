import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST: Participante entra no quiz
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o quiz existe e está ativo
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, status, questions_count")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (quiz.status !== "active") {
      return NextResponse.json(
        { error: "Este quiz não está disponível para participação" },
        { status: 400 }
      )
    }

    // Verificar se já existe participação
    const { data: existingParticipant } = await supabase
      .from("quiz_participants")
      .select("id, status, current_question_index")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .single()

    if (existingParticipant) {
      // Retornar participação existente
      return NextResponse.json({
        participant: existingParticipant,
        message: existingParticipant.status === "completed" 
          ? "Você já completou este quiz" 
          : "Continuando quiz"
      })
    }

    // Criar nova participação
    const displayName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split("@")[0] || 
                        "Participante"

    const { data: participant, error } = await supabase
      .from("quiz_participants")
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null,
        status: "playing"
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ participant, message: "Inscrito com sucesso!" })
  } catch (error) {
    console.error("Erro ao entrar no quiz:", error)
    return NextResponse.json(
      { error: "Erro ao entrar no quiz" },
      { status: 500 }
    )
  }
}

