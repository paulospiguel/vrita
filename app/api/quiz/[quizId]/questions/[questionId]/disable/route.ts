import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateQuizQuestions } from "@/lib/quiz/generators"

// PATCH: Desabilitar questão e substituir por uma nova
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { replace } = body

    // Verificar se o usuário é dono do quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("user_id, documents_content, questions_count")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (quiz.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se a questão pertence ao quiz
    const { data: question, error: questionError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", questionId)
      .eq("quiz_id", quizId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 })
    }

    // Desabilitar a questão
    const { error: disableError } = await supabase
      .from("quiz_questions")
      .update({ is_disabled: true })
      .eq("id", questionId)

    if (disableError) throw disableError

    // Se replace é true, gerar uma nova questão de reserva
    if (replace) {
      // Buscar questões de reserva disponíveis (desabilitadas)
      const { data: disabledQuestions } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("quiz_id", quizId)
        .eq("is_disabled", true)
        .order("order_index", { ascending: false })
        .limit(1)

      // Se não há questões de reserva, gerar uma nova
      if (!disabledQuestions || disabledQuestions.length === 0) {
        const newQuestions = await generateQuizQuestions(
          quiz.documents_content,
          1
        )

        if (newQuestions.length > 0) {
          const newQuestion = newQuestions[0]
          
          // Buscar o maior order_index para adicionar no final
          const { data: lastQuestion } = await supabase
            .from("quiz_questions")
            .select("order_index")
            .eq("quiz_id", quizId)
            .order("order_index", { ascending: false })
            .limit(1)
            .single()

          const newOrderIndex = lastQuestion ? lastQuestion.order_index + 1 : 0

          await supabase
            .from("quiz_questions")
            .insert({
              quiz_id: quizId,
              question_text: newQuestion.question_text,
              options: newQuestion.options,
              correct_option: newQuestion.correct_option,
              explanation: newQuestion.explanation,
              difficulty: newQuestion.difficulty,
              points: 100,
              order_index: newOrderIndex,
              is_disabled: true // Nova questão como reserva
            })
        }
      } else {
        // Reativar uma questão de reserva existente
        const { error: reactivateError } = await supabase
          .from("quiz_questions")
          .update({ is_disabled: false })
          .eq("id", disabledQuestions[0].id)

        if (reactivateError) throw reactivateError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao desabilitar questão:", error)
    return NextResponse.json(
      { error: "Erro ao desabilitar questão" },
      { status: 500 }
    )
  }
}

