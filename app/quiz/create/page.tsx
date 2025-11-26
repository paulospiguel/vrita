import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateQuizContent } from "@/components/quiz/create-quiz-content"

export const dynamic = "force-dynamic"

export default async function CreateQuizPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return (
    <main className="min-h-screen bg-background">
      <CreateQuizContent />
    </main>
  )
}

