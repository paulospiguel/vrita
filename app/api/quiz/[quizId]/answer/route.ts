import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { calculatePoints, generateCardsHelp, generateAudienceHelp } from "@/lib/quiz/generators"
import { shuffleQuestionsForParticipant, convertShuffledToOriginalIndex } from "@/lib/quiz/question-shuffler"
import type { LifelineType } from "@/lib/quiz/types"

// Função para detectar inconsistências na resposta
function detectInconsistencies({
  time_taken,
  time_per_question,
  is_correct,
  is_skipped,
  selected_option,
  correct_option,
  difficulty
}: {
  time_taken: number
  time_per_question: number
  is_correct: boolean
  is_skipped: boolean
  selected_option: number | null
  correct_option: number
  difficulty: number
}): boolean {
  // Se pulou, não precisa revisar
  if (is_skipped) return false

  // 1. Resposta muito rápida (menos de 2 segundos) - possível acidente ou tentativa de adivinhar
  if (time_taken < 2) return true

  // 2. Resposta muito rápida em questão difícil (menos de 5 segundos para dificuldade 4-5)
  if (difficulty >= 4 && time_taken < 5) return true

  // 3. Resposta correta muito rápida (menos de 3 segundos) - possível cola ou sorte
  if (is_correct && time_taken < 3) return true

  // 4. Resposta incorreta muito rápida (menos de 1 segundo) - possível clique acidental
  if (!is_correct && time_taken < 1) return true

  // 5. Tempo muito próximo do limite (possível uso de ajuda externa)
  // Se respondeu nos últimos 2 segundos e acertou questão difícil
  if (is_correct && difficulty >= 4 && time_taken >= time_per_question - 2) return true

  return false
}

// POST: Submeter resposta
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

    const body = await request.json()
    const { 
      question_id, 
      selected_option, 
      time_taken, 
      is_skipped = false,
      lifeline_used = null 
    } = body

    // Buscar participação
    const { data: participant, error: participantError } = await supabase
      .from("quiz_participants")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: "Participação não encontrada" }, { status: 404 })
    }

    if (participant.status !== "playing") {
      return NextResponse.json({ error: "Quiz já finalizado" }, { status: 400 })
    }

    // Buscar pergunta
    const { data: question, error: questionError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", question_id)
      .eq("quiz_id", quizId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 })
    }

    // Verificar se já respondeu esta pergunta
    const { data: existingAnswer } = await supabase
      .from("quiz_answers")
      .select("id")
      .eq("participant_id", participant.id)
      .eq("question_id", question_id)
      .single()

    if (existingAnswer) {
      return NextResponse.json({ error: "Pergunta já respondida" }, { status: 400 })
    }

    // Converter índice embaralhado para original
    // Recalcular o embaralhamento desta pergunta específica para este participante
    const shuffledQuestions = shuffleQuestionsForParticipant([question], participant.id)
    const shuffledQuestion = shuffledQuestions[0]
    
    // selected_option vem no formato embaralhado, precisamos converter para original
    const originalSelectedOption = !is_skipped && selected_option !== null
      ? convertShuffledToOriginalIndex(
          selected_option,
          question.options,
          shuffledQuestion.shuffled_options
        )
      : null

    // Calcular resultado comparando com o índice original
    const is_correct = !is_skipped && originalSelectedOption !== null && originalSelectedOption === question.correct_option
    
    // Buscar configuração do quiz para o tempo total
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("time_per_question, questions_count")
      .eq("id", quizId)
      .single()

    const points_earned = is_correct 
      ? calculatePoints(question.difficulty, quiz?.time_per_question || 30 - time_taken, quiz?.time_per_question || 30)
      : 0

    // Detectar inconsistências que requerem revisão
    const needs_review = detectInconsistencies({
      time_taken,
      time_per_question: quiz?.time_per_question || 30,
      is_correct,
      is_skipped,
      selected_option: originalSelectedOption,
      correct_option: question.correct_option,
      difficulty: question.difficulty
    })

    // Salvar resposta (usando índice original)
    const { data: answer, error: answerError } = await supabase
      .from("quiz_answers")
      .insert({
        participant_id: participant.id,
        question_id: question_id,
        selected_option: originalSelectedOption,
        is_correct,
        is_skipped,
        time_taken,
        points_earned,
        lifeline_used,
        needs_review
      })
      .select()
      .single()

    if (answerError) throw answerError

    // Atualizar uso de lifelines se necessário
    if (lifeline_used) {
      const updateField = lifeline_used === "skip" ? "skips_used" 
        : lifeline_used === "cards" ? "cards_used" 
        : "audience_used"
      
      await supabase
        .from("quiz_participants")
        .update({ [updateField]: participant[updateField as keyof typeof participant] as number + 1 })
        .eq("id", participant.id)
    }

    // Atualizar contador de perguntas respondidas (não contar skip)
    // Se pulou, não incrementa questions_answered
    const shouldIncrementAnswered = !is_skipped
    
    if (shouldIncrementAnswered) {
      await supabase
        .from("quiz_participants")
        .update({ 
          questions_answered: participant.questions_answered + 1,
          current_question_index: participant.current_question_index + 1
        })
        .eq("id", participant.id)
    } else {
      // Apenas incrementa o índice da pergunta quando pula
      await supabase
        .from("quiz_participants")
        .update({ 
          current_question_index: participant.current_question_index + 1
        })
        .eq("id", participant.id)
    }

    // Verificar se é a última pergunta (baseado no índice, não nas respondidas)
    const newQuestionIndex = participant.current_question_index + 1
    const isLastQuestion = newQuestionIndex >= (quiz?.questions_count || 10)

    if (isLastQuestion) {
      await supabase
        .from("quiz_participants")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", participant.id)
    }

    // Retornar correct_option no formato embaralhado para o cliente
    const shuffledCorrectOption = shuffledQuestion.shuffled_correct_option

    return NextResponse.json({
      answer,
      answer_id: answer.id, // ID da resposta para correção manual
      is_correct,
      correct_option: shuffledCorrectOption, // Retornar no formato embaralhado
      explanation: question.explanation,
      points_earned,
      is_finished: isLastQuestion,
      needs_review: needs_review
    })
  } catch (error) {
    console.error("Erro ao submeter resposta:", error)
    return NextResponse.json(
      { error: "Erro ao submeter resposta" },
      { status: 500 }
    )
  }
}

