"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  User,
  Share2,
  Home
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RankingEntry {
  position: number
  participant: {
    id: string
    display_name: string
    avatar_url: string | null
    total_score: number
    correct_answers: number
    questions_answered: number
    completed_at: string | null
  }
  isCurrentUser: boolean
}

interface QuizRankingProps {
  ranking: RankingEntry[]
  currentUserPosition: number | null
  quizTitle: string
  shareCode: string
  className?: string
}

export function QuizRanking({
  ranking,
  currentUserPosition,
  quizTitle,
  shareCode,
  className
}: QuizRankingProps) {
  const router = useRouter()

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const currentUserEntry = ranking.find(r => r.isCurrentUser)

  const getPodiumStyle = (position: number) => {
    switch (position) {
      case 1:
        return {
          height: "h-32",
          bg: "bg-gradient-to-t from-yellow-500 to-yellow-300",
          icon: Crown,
          iconColor: "text-yellow-900",
          medal: "🥇",
          order: "order-2"
        }
      case 2:
        return {
          height: "h-24",
          bg: "bg-gradient-to-t from-slate-400 to-slate-300",
          icon: Medal,
          iconColor: "text-slate-700",
          medal: "🥈",
          order: "order-1"
        }
      case 3:
        return {
          height: "h-20",
          bg: "bg-gradient-to-t from-amber-700 to-amber-500",
          icon: Medal,
          iconColor: "text-amber-900",
          medal: "🥉",
          order: "order-3"
        }
      default:
        return {
          height: "h-16",
          bg: "bg-muted",
          icon: Star,
          iconColor: "text-muted-foreground",
          medal: "",
          order: ""
        }
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/quiz/join/${shareCode}`
    const shareText = `Consegui ${currentUserEntry?.participant.total_score || 0} pontos no quiz "${quizTitle}"! Teste seus conhecimentos também:`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Requirements Wisdom Quiz",
          text: shareText,
          url: shareUrl
        })
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    }
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">Resultado Final</span>
        </div>
        <h1 className="text-3xl font-bold">{quizTitle}</h1>
        <p className="text-muted-foreground">
          {ranking.length} participante{ranking.length !== 1 ? "s" : ""} completaram o quiz
        </p>
      </div>

      {/* Current user score highlight */}
      {currentUserEntry && (
        <Card className={cn(
          "border-2 border-primary bg-primary/5",
          "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold",
                  currentUserPosition === 1 ? "bg-yellow-500 text-yellow-900" :
                  currentUserPosition === 2 ? "bg-slate-400 text-slate-900" :
                  currentUserPosition === 3 ? "bg-amber-600 text-white" :
                  "bg-primary/20 text-primary"
                )}>
                  {currentUserPosition && currentUserPosition <= 3 
                    ? getPodiumStyle(currentUserPosition).medal 
                    : `#${currentUserPosition}`}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sua pontuação</p>
                  <p className="text-4xl font-bold text-primary">
                    {currentUserEntry.participant.total_score}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentUserEntry.participant.correct_answers}/{currentUserEntry.participant.questions_answered} respostas corretas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-primary">
                  #{currentUserPosition}
                </p>
                <p className="text-sm text-muted-foreground">posição</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 px-4 py-8">
          {[2, 1, 3].map((pos) => {
            const entry = top3.find(e => e.position === pos)
            if (!entry) return <div key={pos} className="w-28" />
            
            const style = getPodiumStyle(pos)
            const Icon = style.icon

            return (
              <div 
                key={pos}
                className={cn(
                  "flex flex-col items-center gap-2 w-28",
                  style.order,
                  "animate-in fade-in-0 slide-in-from-bottom-8 duration-700",
                  pos === 1 && "delay-300",
                  pos === 2 && "delay-150",
                  pos === 3 && "delay-450"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "relative w-16 h-16 rounded-full overflow-hidden",
                  "border-4 shadow-lg",
                  pos === 1 ? "border-yellow-400" :
                  pos === 2 ? "border-slate-400" :
                  "border-amber-600"
                )}>
                  {entry.participant.avatar_url ? (
                    <Image 
                      src={entry.participant.avatar_url} 
                      alt={entry.participant.display_name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {entry.isCurrentUser && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="font-semibold text-center text-sm truncate w-full">
                  {entry.participant.display_name}
                </p>

                {/* Score */}
                <p className="text-xl font-bold">{entry.participant.total_score}</p>

                {/* Podium */}
                <div className={cn(
                  "w-full rounded-t-lg flex items-center justify-center",
                  style.height,
                  style.bg
                )}>
                  <span className="text-4xl">{style.medal}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rest of ranking */}
      {rest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classificação Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rest.map((entry, index) => (
              <div
                key={entry.participant.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-colors",
                  entry.isCurrentUser 
                    ? "bg-primary/10 border-2 border-primary" 
                    : "hover:bg-muted/50"
                )}
              >
                <span className="w-8 text-center font-bold text-muted-foreground">
                  #{entry.position}
                </span>
                
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {entry.participant.avatar_url ? (
                    <Image 
                      src={entry.participant.avatar_url} 
                      alt={entry.participant.display_name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium">
                    {entry.participant.display_name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-primary">(você)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.participant.correct_answers}/{entry.participant.questions_answered} corretas
                  </p>
                </div>

                <span className="font-bold text-lg">{entry.participant.total_score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleShare}
          variant="outline"
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar Resultado
        </Button>
        <Button 
          onClick={() => router.push("/")}
          className="flex-1"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  )
}

