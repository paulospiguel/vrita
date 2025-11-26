import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizPlayContent } from "@/components/quiz/quiz-play-content"
import { QuizProvider } from "@/components/quiz/quiz-context"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function PlayQuizPage({ params }: Props) {
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

  // Verificar se tem participação
  const { data: participant, error: participantError } = await supabase
    .from("quiz_participants")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .single()

  if (participantError || !participant) {
    // Redirecionar para página de entrada
    redirect(`/quiz/join/${quiz.share_code}`)
  }

  // Se já completou, redirecionar para ranking
  if (participant.status === "completed") {
    redirect(`/quiz/${quizId}/ranking`)
  }

  // As perguntas serão carregadas no cliente via API para serem embaralhadas
  // Não precisamos buscar aqui

  return (
    <QuizProvider quizId={quizId}>
      <QuizPlayContent 
        quiz={quiz}
        participant={participant}
      />
    </QuizProvider>
  )
}

