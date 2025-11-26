import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Verificar se o usuário é dono do quiz
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isOwner: false }, { status: 200 })
    }

    // Verificar se o usuário é dono do quiz
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("user_id")
      .eq("id", quizId)
      .single()

    if (error || !quiz) {
      return NextResponse.json({ isOwner: false }, { status: 200 })
    }

    return NextResponse.json({ isOwner: quiz.user_id === user.id })
  } catch (error) {
    console.error("Erro ao verificar dono do quiz:", error)
    return NextResponse.json({ isOwner: false }, { status: 200 })
  }
}

