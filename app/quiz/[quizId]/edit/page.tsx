import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditQuizContent } from "@/components/quiz/edit-quiz-content"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function EditQuizPage({ params }: Props) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Buscar quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single()

  if (quizError || !quiz) {
    notFound()
  }

  // Verificar se o usuário é dono
  if (quiz.user_id !== user.id) {
    redirect("/quiz")
  }

  // Verificar se está em rascunho
  if (quiz.status !== "draft") {
    redirect(`/quiz/${quizId}/dashboard`)
  }

  return (
    <main className="min-h-screen bg-background">
      <EditQuizContent quiz={quiz} />
    </main>
  )
}

