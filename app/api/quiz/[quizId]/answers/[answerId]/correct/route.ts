import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH: Corrigir resposta manualmente
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
    const { is_correct, correction_reason } = body

    // Validar que o motivo é obrigatório quando marcando como incorreta
    if (is_correct === false && (!correction_reason || !correction_reason.trim())) {
      return NextResponse.json(
        { error: "O motivo da correção é obrigatório" },
        { status: 400 }
      )
    }

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

    // Buscar a resposta atual para recalcular pontos se necessário
    const { data: currentAnswer } = await supabase
      .from("quiz_answers")
      .select("is_correct, points_earned, participant_id")
      .eq("id", answerId)
      .single()

    // Atualizar resposta
    const updateData: {
      is_correct: boolean
      is_manually_corrected: boolean
      correction_reason?: string
      corrected_by?: string
      corrected_at?: string
      points_earned?: number
    } = {
      is_correct: is_correct === false ? false : true,
      is_manually_corrected: true,
      correction_reason: correction_reason || null,
      corrected_by: user.id,
      corrected_at: new Date().toISOString()
    }

    // Se está marcando como incorreta, zerar pontos
    if (is_correct === false) {
      updateData.points_earned = 0
    }

    const { error: updateError } = await supabase
      .from("quiz_answers")
      .update(updateData)
      .eq("id", answerId)

    if (updateError) throw updateError

    // Recalcular pontuação do participante se necessário
    if (currentAnswer) {
      const { data: allAnswers } = await supabase
        .from("quiz_answers")
        .select("points_earned")
        .eq("participant_id", currentAnswer.participant_id)

      const newTotalScore = (allAnswers || []).reduce(
        (sum, a) => sum + (a.points_earned || 0),
        0
      )

      const { data: participant } = await supabase
        .from("quiz_participants")
        .select("correct_answers")
        .eq("id", currentAnswer.participant_id)
        .single()

      // Recalcular respostas corretas
      const { data: correctAnswers } = await supabase
        .from("quiz_answers")
        .select("id")
        .eq("participant_id", currentAnswer.participant_id)
        .eq("is_correct", true)

      await supabase
        .from("quiz_participants")
        .update({
          total_score: newTotalScore,
          correct_answers: (correctAnswers || []).length
        })
        .eq("id", currentAnswer.participant_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao corrigir resposta:", error)
    return NextResponse.json(
      { error: "Erro ao corrigir resposta" },
      { status: 500 }
    )
  }
}

