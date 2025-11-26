import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizListContent } from "@/components/quiz/quiz-list-content"

export const dynamic = "force-dynamic"

export default async function QuizPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return (
    <main className="min-h-screen bg-background">
      <QuizListContent />
    </main>
  )
}

