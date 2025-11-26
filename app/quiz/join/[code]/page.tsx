import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizJoinContent } from "@/components/quiz/quiz-join-content"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinQuizPage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirecionar para auth com callback para voltar ao quiz
    redirect(`/auth?redirect=/quiz/join/${code}`)
  }

  // Buscar quiz pelo código
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, title, description, share_code, questions_count, time_per_question, status")
    .eq("share_code", code.toUpperCase())
    .single()

  if (error || !quiz) {
    notFound()
  }

  if (quiz.status !== "active") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Quiz não disponível</h1>
          <p className="text-muted-foreground">
            Este quiz não está ativo no momento.
          </p>
        </div>
      </main>
    )
  }

  // Verificar se já tem participação
  const { data: participant } = await supabase
    .from("quiz_participants")
    .select("id, status, current_question_index")
    .eq("quiz_id", quiz.id)
    .eq("user_id", user.id)
    .single()

  return (
    <main className="min-h-screen bg-background">
      <QuizJoinContent 
        quiz={quiz} 
        existingParticipant={participant}
      />
    </main>
  )
}

