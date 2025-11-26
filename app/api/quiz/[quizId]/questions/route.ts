import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateQuizQuestions } from "@/lib/quiz/generators"

// GET: Obter perguntas do quiz
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

    // Buscar quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, status, user_id")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem acesso (dono ou quiz ativo)
    if (quiz.user_id !== user.id && quiz.status !== "active") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Buscar apenas perguntas ativas (não desabilitadas)
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("is_disabled", false)
      .order("order_index", { ascending: true })

    if (questionsError) throw questionsError

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma pergunta disponível para este quiz" },
        { status: 404 }
      )
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Erro ao obter perguntas:", error)
    return NextResponse.json(
      { error: "Erro ao obter perguntas" },
      { status: 500 }
    )
  }
}

// POST: Regenerar perguntas do quiz
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
    const { documents_content, questions_count } = body

    if (!documents_content || !questions_count) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // Verificar se o usuário é dono do quiz
    const { data: existingQuiz, error: checkError } = await supabase
      .from("quizzes")
      .select("user_id, status")
      .eq("id", quizId)
      .single()

    if (checkError || !existingQuiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (existingQuiz.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Só permitir regenerar perguntas se o quiz estiver em rascunho
    if (existingQuiz.status !== "draft") {
      return NextResponse.json(
        { error: "Apenas quizzes em rascunho podem ter perguntas regeneradas" },
        { status: 400 }
      )
    }

    // Gerar perguntas com IA
    // Gerar 20% a mais de perguntas para compensar possíveis skips
    const questionsToGenerate = Math.ceil(questions_count * 1.2)
    
    const generatedQuestions = await generateQuizQuestions(
      documents_content,
      questionsToGenerate,
      user.id
    )
    
    // Limitar ao número solicitado
    const questionsToInsert = generatedQuestions.slice(0, questions_count)

    // Deletar perguntas antigas
    const { error: deleteError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId)

    if (deleteError) throw deleteError

    // Inserir novas perguntas
    const questionsWithQuizId = questionsToInsert.map((q, index) => ({
      quiz_id: quizId,
      order_index: index,
      question_text: q.question_text,
      options: q.options, // JSONB array
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty: q.difficulty,
      points: q.difficulty * 100,
    }))

    const { error: insertError } = await supabase
      .from("quiz_questions")
      .insert(questionsWithQuizId)

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      questions_generated: questionsToInsert.length,
    })
  } catch (error) {
    console.error("Erro ao regenerar perguntas:", error)
    return NextResponse.json(
      { error: "Erro ao regenerar perguntas" },
      { status: 500 }
    )
  }
}
