import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateCardsHelp, generateAudienceHelp } from "@/lib/quiz/generators"
import { shuffleQuestionsForParticipant } from "@/lib/quiz/question-shuffler"
import type { LifelineType } from "@/lib/quiz/types"

// POST: Usar lifeline (ajuda)
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
    const { question_id, lifeline_type } = body as { question_id: string; lifeline_type: LifelineType }

    if (!question_id || !lifeline_type) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

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

    // Verificar disponibilidade da lifeline
    const lifelineConfig = {
      skip: { field: "skips_used", max: 3 },
      cards: { field: "cards_used", max: 1 },
      audience: { field: "audience_used", max: 1 }
    }

    const config = lifelineConfig[lifeline_type]
    const used = participant[config.field as keyof typeof participant] as number

    if (used >= config.max) {
      return NextResponse.json(
        { error: `Você já usou todas as ajudas do tipo "${lifeline_type}"` },
        { status: 400 }
      )
    }

    // Buscar pergunta completa
    const { data: question, error: questionError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 })
    }

    // Recalcular embaralhamento para este participante
    const shuffledQuestions = shuffleQuestionsForParticipant([question], participant.id)
    const shuffledQuestion = shuffledQuestions[0]

    let result: { eliminatedOptions?: number[]; percentages?: number[] } = {}

    switch (lifeline_type) {
      case "skip":
        // Pular não precisa de dados adicionais
        break

      case "cards":
        // Eliminar 2 opções incorretas (usando índice original)
        const originalEliminated = generateCardsHelp(question.correct_option)
        // Converter índices originais para embaralhados
        if (originalEliminated.eliminatedOptions) {
          const shuffledEliminated = originalEliminated.eliminatedOptions.map(originalIdx => {
            // Encontrar o texto da opção original
            const optionText = question.options[originalIdx]
            // Encontrar o índice embaralhado correspondente
            return shuffledQuestion.shuffled_options.indexOf(optionText)
          }).filter(idx => idx >= 0) // Filtrar índices válidos
          result = { eliminatedOptions: shuffledEliminated }
        }
        break

      case "audience":
        // Consulta aos universitários
        const { data: stats } = await supabase
          .from("quiz_question_stats")
          .select("*")
          .eq("question_id", question_id)
          .single()

        // Gerar ajuda usando índice original
        const originalAudience = generateAudienceHelp(stats, question.correct_option)
        // Converter percentagens para ordem embaralhada
        if (originalAudience.percentages) {
          // Criar mapeamento: índice original -> índice embaralhado
          const originalToShuffled: number[] = []
          question.options.forEach((optionText: string, originalIdx: number) => {
            const shuffledIdx = shuffledQuestion.shuffled_options.indexOf(optionText)
            if (shuffledIdx >= 0) {
              originalToShuffled[originalIdx] = shuffledIdx
            }
          })
          
          // Reordenar percentagens para ordem embaralhada
          const shuffledPercentages = [0, 0, 0, 0]
          originalAudience.percentages.forEach((percentage, originalIdx) => {
            const shuffledIdx = originalToShuffled[originalIdx]
            if (shuffledIdx !== undefined) {
              shuffledPercentages[shuffledIdx] = percentage
            }
          })
          
          result = { percentages: shuffledPercentages }
        }
        break
    }

    // Atualizar contador de uso (só para cards e audience)
    if (lifeline_type !== "skip") {
      await supabase
        .from("quiz_participants")
        .update({ [config.field]: used + 1 })
        .eq("id", participant.id)
    }

    return NextResponse.json({
      type: lifeline_type,
      data: result,
      remaining: config.max - used - (lifeline_type !== "skip" ? 1 : 0)
    })
  } catch (error) {
    console.error("Erro ao usar lifeline:", error)
    return NextResponse.json(
      { error: "Erro ao usar ajuda" },
      { status: 500 }
    )
  }
}

