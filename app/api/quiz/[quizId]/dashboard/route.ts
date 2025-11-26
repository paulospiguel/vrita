import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Dashboard do admin com estatísticas do quiz
export async function GET(
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

    // Verificar se o usuário é dono do quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (quiz.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Buscar todos os participantes
    const { data: participants } = await supabase
      .from("quiz_participants")
      .select("*")
      .eq("quiz_id", quizId)
      .order("total_score", { ascending: false })

    // Buscar todas as perguntas ativas com estatísticas
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select(`
        *,
        quiz_question_stats(*)
      `)
      .eq("quiz_id", quizId)
      .eq("is_disabled", false)
      .order("order_index", { ascending: true })

    // Buscar todas as respostas
    const { data: answers } = await supabase
      .from("quiz_answers")
      .select(`
        *,
        quiz_participants!inner(quiz_id, display_name, user_id)
      `)
      .eq("quiz_participants.quiz_id", quizId)

    // Buscar respostas que precisam revisão (inconsistências) OU foram marcadas como incorretas manualmente
    // Incluir explicitamente os campos correction_reason e is_manually_corrected
    const { data: answersNeedingReviewData, error: reviewError } = await supabase
      .from("quiz_answers")
      .select(`
        id,
        question_id,
        selected_option,
        is_correct,
        is_manually_corrected,
        correction_reason,
        time_taken,
        points_earned,
        answered_at,
        needs_review,
        reviewed_at,
        quiz_questions(id, question_text, difficulty, options, correct_option, explanation),
        quiz_participants(display_name, user_id, quiz_id)
      `)
      .or("needs_review.eq.true,is_manually_corrected.eq.true")
      .is("reviewed_at", null)
      .order("answered_at", { ascending: false })

    // Filtrar apenas respostas do quiz atual
    const answersNeedingReview = (answersNeedingReviewData || []).filter((a: any) => {
      const participant = Array.isArray(a.quiz_participants) ? a.quiz_participants[0] : a.quiz_participants
      return participant?.quiz_id === quizId
    })

    // Calcular estatísticas
    const totalParticipants = participants?.length || 0
    const completedParticipants = participants?.filter(p => p.status === "completed").length || 0
    const completionRate = totalParticipants > 0 
      ? (completedParticipants / totalParticipants) * 100 
      : 0

    const averageScore = participants && participants.length > 0
      ? participants.reduce((sum, p) => sum + p.total_score, 0) / participants.length
      : 0

    // Buscar respostas corrigidas manualmente (questionadas como erro)
    const { data: manuallyCorrectedAnswers } = await supabase
      .from("quiz_answers")
      .select("question_id, is_manually_corrected, correction_reason")
      .eq("is_manually_corrected", true)
    
    // Criar um Set com IDs de perguntas que foram questionadas
    const questionedQuestionIds = new Set(
      (manuallyCorrectedAnswers || []).map((a: any) => a.question_id)
    )

    // Calcular perguntas mais erradas e acertadas
    const questionStats = (questions || []).map(q => {
      const questionAnswers = (answers || []).filter(a => a.question_id === q.id)
      const totalAnswers = questionAnswers.length
      const correctAnswers = questionAnswers.filter(a => a.is_correct).length
      const errorRate = totalAnswers > 0 ? ((totalAnswers - correctAnswers) / totalAnswers) * 100 : 0
      const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      
      // Verificar se tem respostas corrigidas manualmente para esta pergunta
      const hasManualCorrections = questionedQuestionIds.has(q.id)

      return {
        question: q,
        totalAnswers,
        correctAnswers,
        errorRate,
        correctRate,
        hasManualCorrections
      }
    })

    const mostMissedQuestions = [...questionStats]
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5)
      .filter(q => q.totalAnswers > 0)

    const mostCorrectQuestions = [...questionStats]
      .sort((a, b) => b.correctRate - a.correctRate)
      .slice(0, 5)
      .filter(q => q.totalAnswers > 0)

    // Buscar emails dos participantes (via user_id)
    // Nota: Isso requer acesso à tabela auth.users ou uma tabela de perfil
    const participantScores = (participants || []).map(p => ({
      participant: {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        total_score: p.total_score,
        correct_answers: p.correct_answers,
        questions_answered: p.questions_answered,
        status: p.status,
        started_at: p.started_at,
        completed_at: p.completed_at
      },
      accuracy: p.questions_answered > 0 
        ? ((p.correct_answers / p.questions_answered) * 100).toFixed(1) 
        : "0"
    }))

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        questions_count: quiz.questions_count,
        share_code: quiz.share_code,
        created_at: quiz.created_at
      },
      stats: {
        totalParticipants,
        completedParticipants,
        completionRate: completionRate.toFixed(1),
        averageScore: averageScore.toFixed(0)
      },
      mostMissedQuestions: mostMissedQuestions.map(q => ({
        question_text: q.question.question_text,
        explanation: q.question.explanation,
        error_rate: q.errorRate.toFixed(1),
        total_answers: q.totalAnswers
      })),
      mostCorrectQuestions: mostCorrectQuestions.map(q => ({
        question_text: q.question.question_text,
        correct_rate: q.correctRate.toFixed(1),
        total_answers: q.totalAnswers
      })),
      participantScores,
      questions: questionStats.map(q => ({
        id: q.question.id,
        question_text: q.question.question_text,
        difficulty: q.question.difficulty,
        error_rate: q.errorRate.toFixed(1),
        correct_rate: q.correctRate.toFixed(1),
        total_answers: q.totalAnswers,
        options: q.question.options,
        correct_option: q.question.correct_option,
        explanation: q.question.explanation,
        order_index: q.question.order_index,
        has_manual_corrections: q.hasManualCorrections
      })),
      answersNeedingReview: answersNeedingReview.map((a: any) => {
        const question = Array.isArray(a.quiz_questions) ? a.quiz_questions[0] : a.quiz_questions
        const participant = Array.isArray(a.quiz_participants) ? a.quiz_participants[0] : a.quiz_participants
        
        return {
          id: a.id,
          question_id: question?.id || "",
          question_text: question?.question_text || "",
          participant_name: participant?.display_name || "",
          selected_option: a.selected_option,
          correct_option: question?.correct_option,
          is_correct: a.is_correct,
          time_taken: a.time_taken,
          points_earned: a.points_earned,
          answered_at: a.answered_at,
          options: question?.options || [],
          difficulty: question?.difficulty || 1,
          explanation: question?.explanation || "",
          correction_reason: a.correction_reason || null,
          is_manually_corrected: a.is_manually_corrected || false
        }
      })
    })
  } catch (error) {
    console.error("Erro ao obter dashboard:", error)
    return NextResponse.json(
      { error: "Erro ao obter dashboard" },
      { status: 500 }
    )
  }
}

