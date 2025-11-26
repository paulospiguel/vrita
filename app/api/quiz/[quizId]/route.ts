import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Obter detalhes do quiz
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

    // Buscar quiz com perguntas
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(`
        *,
        quiz_questions(*)
      `)
      .eq("id", quizId)
      .single()

    if (error) throw error

    if (!quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário é dono ou se o quiz está ativo
    if (quiz.user_id !== user.id && quiz.status !== "active") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Ordenar perguntas pelo order_index
    if (quiz.quiz_questions) {
      quiz.quiz_questions.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error("Erro ao obter quiz:", error)
    return NextResponse.json(
      { error: "Erro ao obter quiz" },
      { status: 500 }
    )
  }
}

// PATCH: Atualizar quiz (status, etc.)
export async function PATCH(
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

    // Verificar se o usuário é dono do quiz
    const { data: existingQuiz, error: checkError } = await supabase
      .from("quizzes")
      .select("user_id, title, status")
      .eq("id", quizId)
      .single()

    if (checkError || !existingQuiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 })
    }

    if (existingQuiz.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Permitir edição completa apenas se o quiz estiver em rascunho
    // Se estiver ativo ou encerrado, só permitir mudança de status
    if (existingQuiz.status !== "draft") {
      // Se não está em rascunho, só permitir mudança de status
      const allowedFields = ["status"]
      const bodyKeys = Object.keys(body)
      const hasInvalidFields = bodyKeys.some(key => !allowedFields.includes(key))
      
      if (hasInvalidFields) {
        return NextResponse.json(
          { error: "Apenas quizzes em rascunho podem ser editados. Para editar, primeiro encerre o quiz." },
          { status: 400 }
        )
      }
    }

    // Se está atualizando o título, verificar se não existe outro quiz com o mesmo título
    if (body.title && body.title.trim() !== existingQuiz.title) {
      const { data: duplicateQuiz } = await supabase
        .from("quizzes")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", body.title.trim())
        .neq("id", quizId)
        .single()

      if (duplicateQuiz) {
        return NextResponse.json(
          { error: "Já existe um quiz com este título. Por favor, escolha outro título." },
          { status: 400 }
        )
      }
    }

    // Atualizar quiz
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update(body)
      .eq("id", quizId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error("Erro ao atualizar quiz:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar quiz" },
      { status: 500 }
    )
  }
}

// DELETE: Excluir quiz
export async function DELETE(
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

    // Permitir exclusão de quizzes em rascunho ou encerrados
    // Não permitir exclusão de quizzes ativos (para evitar problemas com participantes)
    if (existingQuiz.status === "active") {
      return NextResponse.json(
        { error: "Não é possível excluir um quiz ativo. Encerre o quiz antes de excluí-lo." },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir quiz:", error)
    return NextResponse.json(
      { error: "Erro ao excluir quiz" },
      { status: 500 }
    )
  }
}

