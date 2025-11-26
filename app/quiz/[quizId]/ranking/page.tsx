import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizRanking } from "@/components/quiz/quiz-ranking"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function RankingPage({ params }: Props) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Buscar quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, title, share_code")
    .eq("id", quizId)
    .single()

  if (quizError || !quiz) {
    notFound()
  }

  // Buscar ranking
  const { data: participants } = await supabase
    .from("quiz_participants")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("status", "completed")
    .order("total_score", { ascending: false })
    .order("completed_at", { ascending: true })

  const ranking = (participants || []).map((participant, index) => ({
    position: index + 1,
    participant: {
      id: participant.id,
      display_name: participant.display_name,
      avatar_url: participant.avatar_url,
      total_score: participant.total_score,
      correct_answers: participant.correct_answers,
      questions_answered: participant.questions_answered,
      completed_at: participant.completed_at
    },
    isCurrentUser: participant.user_id === user.id
  }))

  const currentUserPosition = ranking.find(r => r.isCurrentUser)?.position || null

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-2xl">
        <QuizRanking
          ranking={ranking}
          currentUserPosition={currentUserPosition}
          quizTitle={quiz.title}
          shareCode={quiz.share_code}
        />
      </div>
    </main>
  )
}

