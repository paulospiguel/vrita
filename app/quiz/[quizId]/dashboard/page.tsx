import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizDashboardContent } from "@/components/quiz/quiz-dashboard-content"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Verificar se é dono do quiz
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("user_id")
    .eq("id", quizId)
    .single()

  if (error || !quiz) {
    notFound()
  }

  if (quiz.user_id !== user.id) {
    redirect("/quiz")
  }

  return (
    <main className="min-h-screen bg-background">
      <QuizDashboardContent quizId={quizId} />
    </main>
  )
}

