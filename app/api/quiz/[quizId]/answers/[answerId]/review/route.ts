import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH: Marcar resposta como revisada
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string; answerId: string }> }
) {
  try {
    const { quizId, answerId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewed } = body

    // Verificar se o usuário é dono do quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("user_id")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (quiz.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se a resposta pertence ao quiz
    const { data: answer, error: answerError } = await supabase
      .from("quiz_answers")
      .select(`
        id,
        quiz_participants!inner(quiz_id)
      `)
      .eq("id", answerId)
      .eq("quiz_participants.quiz_id", quizId)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 })
    }

    // Atualizar resposta
    const updateData: {
      needs_review: boolean
      reviewed_at?: string | null
      reviewed_by?: string | null
    } = {
      needs_review: !reviewed
    }

    if (reviewed) {
      updateData.reviewed_at = new Date().toISOString()
      updateData.reviewed_by = user.id
    } else {
      updateData.reviewed_at = null
      updateData.reviewed_by = null
    }

    const { error: updateError } = await supabase
      .from("quiz_answers")
      .update(updateData)
      .eq("id", answerId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar revisão:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar revisão" },
      { status: 500 }
    )
  }
}

