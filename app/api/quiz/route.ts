import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateQuizQuestions } from "@/lib/quiz/generators"
import type { CreateQuizInput } from "@/lib/quiz/types"

// GET: Listar quizzes do usuário
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select(`
        *,
        quiz_participants(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error("Erro ao listar quizzes:", error)
    return NextResponse.json(
      { error: "Erro ao listar quizzes" },
      { status: 500 }
    )
  }
}

// POST: Criar novo quiz
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body: CreateQuizInput = await request.json()
    const { title, description, documents_content, questions_count, time_per_question } = body

    if (!title || !documents_content || !questions_count) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // Verificar se já existe um quiz com o mesmo título para este usuário em rascunho
    const { data: existingQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", title.trim())
      .eq("status", "draft")
      .single()

    let quiz
    let isReusingQuiz = false

    if (existingQuiz) {
      // Verificar se o quiz existente tem perguntas
      const { data: existingQuestions, error: questionsCheckError } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("quiz_id", existingQuiz.id)
        .limit(1)

      if (questionsCheckError) throw questionsCheckError

      if (!existingQuestions || existingQuestions.length === 0) {
        // Quiz incompleto (sem perguntas) - reutilizar e atualizar
        isReusingQuiz = true
        const { data: updatedQuiz, error: updateError } = await supabase
          .from("quizzes")
          .update({
            description: description || null,
            documents_content,
            questions_count,
            time_per_question: time_per_question || 30,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingQuiz.id)
          .select()
          .single()

        if (updateError) throw updateError
        quiz = updatedQuiz
      } else {
        // Quiz completo com perguntas - não permitir reutilizar
        return NextResponse.json(
          { error: "Já existe um quiz com este título. Por favor, escolha outro título." },
          { status: 400 }
        )
      }
    } else {
      // Criar novo quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          documents_content,
          questions_count,
          time_per_question: time_per_question || 30,
          status: "draft"
        })
        .select()
        .single()

      if (quizError) throw quizError
      quiz = newQuiz
    }

    // Gerar perguntas com IA
    // Gerar 30% a mais de perguntas como reserva para casos de desabilitação
    // Isso garante que sempre haverá perguntas suficientes mesmo quando questões são desabilitadas
    const questionsToGenerate = Math.ceil(questions_count * 1.3)
    
    let generatedQuestions
    try {
      generatedQuestions = await generateQuizQuestions(
        documents_content,
        questionsToGenerate,
        user.id
      )
    } catch (error) {
      // Se falhar na geração de perguntas e for um quiz novo, deletar o quiz
      if (!isReusingQuiz) {
        await supabase
          .from("quizzes")
          .delete()
          .eq("id", quiz.id)
      }
      throw error
    }
    
    // Limitar ao número solicitado (mas manter as extras no banco para uso futuro)
    // Deletar perguntas antigas se estiver reutilizando
    if (isReusingQuiz) {
      const { error: deleteError } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("quiz_id", quiz.id)

      if (deleteError) throw deleteError
    }

    // Inserir todas as perguntas geradas
    // As primeiras questions_count são ativas, o restante fica como reserva (is_disabled = true)
    const questionsToInsert = generatedQuestions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty: q.difficulty,
      points: q.difficulty * 100,
      order_index: index,
      is_disabled: index >= questions_count // Desabilitar as perguntas de reserva (30% extra)
    }))

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert)

    if (questionsError) {
      // Se falhar na inserção de perguntas e for um quiz novo, deletar o quiz
      if (!isReusingQuiz) {
        await supabase
          .from("quizzes")
          .delete()
          .eq("id", quiz.id)
      }
      throw questionsError
    }

    return NextResponse.json({ 
      quiz, 
      questions_generated: questionsToInsert.length,
      reused: isReusingQuiz 
    })
  } catch (error) {
    console.error("Erro ao criar quiz:", error)
    return NextResponse.json(
      { error: "Erro ao criar quiz" },
      { status: 500 }
    )
  }
}

