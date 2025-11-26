import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Obter ranking do quiz
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

    // Buscar todos os participantes ordenados por score
    const { data: participants, error } = await supabase
      .from("quiz_participants")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("status", "completed")
      .order("total_score", { ascending: false })
      .order("completed_at", { ascending: true }) // Em caso de empate, quem terminou primeiro

    if (error) throw error

    // Formatar ranking
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

    // Encontrar posição do usuário atual
    const currentUserPosition = ranking.find(r => r.isCurrentUser)?.position || null

    return NextResponse.json({
      ranking,
      currentUserPosition,
      totalParticipants: ranking.length
    })
  } catch (error) {
    console.error("Erro ao obter ranking:", error)
    return NextResponse.json(
      { error: "Erro ao obter ranking" },
      { status: 500 }
    )
  }
}

