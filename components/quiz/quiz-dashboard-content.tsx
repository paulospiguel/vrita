"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Users,
  Trophy,
  Target,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  BarChart3,
  User,
  TrendingDown,
  AlertTriangle,
  Clock,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Ban,
  Save
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface DashboardData {
  quiz: {
    id: string
    title: string
    description: string | null
    status: string
    questions_count: number
    share_code: string
    created_at: string
  }
  stats: {
    totalParticipants: number
    completedParticipants: number
    completionRate: string
    averageScore: string
  }
  mostMissedQuestions: {
    question_text: string
    explanation: string
    error_rate: string
    total_answers: number
  }[]
  mostCorrectQuestions: {
    question_text: string
    correct_rate: string
    total_answers: number
  }[]
  participantScores: {
    participant: {
      id: string
      display_name: string
      avatar_url: string | null
      total_score: number
      correct_answers: number
      questions_answered: number
      status: string
      started_at: string
      completed_at: string | null
    }
    accuracy: string
  }[]
  questions: {
    id: string
    question_text: string
    difficulty: number
    error_rate: string
    correct_rate: string
    total_answers: number
    options: string[]
    correct_option: number
    explanation: string
    order_index: number
    has_manual_corrections: boolean
  }[]
  answersNeedingReview: {
    id: string
    question_id: string
    question_text: string
    participant_name: string
    selected_option: number | null
    correct_option: number
    is_correct: boolean
    time_taken: number
    points_earned: number
    answered_at: string
    options: string[]
    difficulty: number
    explanation: string
    correction_reason: string | null
    is_manually_corrected: boolean
  }[]
}

interface QuizDashboardContentProps {
  quizId: string
}

type QuestionFilter = "all" | "correct" | "incorrect" | "questioned"

export function QuizDashboardContent({ quizId }: QuizDashboardContentProps) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [questionsExpanded, setQuestionsExpanded] = useState(false)
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("all")
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false)
  const [showDisableQuestionDialog, setShowDisableQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/dashboard`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      setData(result)
    } catch (error) {
      toast.error("Erro ao carregar dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!data) return
    const shareUrl = `${window.location.origin}/quiz/join/${data.quiz.share_code}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleStatus = async () => {
    if (!data) return
    
    const newStatus = data.quiz.status === "active" ? "closed" : "active"
    setToggling(true)

    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error("Erro ao atualizar status")

      setData(prev => prev ? {
        ...prev,
        quiz: { ...prev.quiz, status: newStatus }
      } : null)

      toast.success(`Quiz ${newStatus === "active" ? "ativado" : "encerrado"}!`)
    } catch (error) {
      toast.error("Erro ao atualizar status")
    } finally {
      setToggling(false)
    }
  }

  const handleMarkAsReviewed = async (answerId: string) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/answers/${answerId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed: true })
      })

      if (!response.ok) throw new Error("Erro ao marcar como revisado")

      // Atualizar lista removendo a resposta revisada
      setData(prev => prev ? {
        ...prev,
        answersNeedingReview: prev.answersNeedingReview.filter(a => a.id !== answerId)
      } : null)

      // Ajustar índice se necessário
      const newLength = (data?.answersNeedingReview.length || 1) - 1
      if (currentReviewIndex >= newLength && newLength > 0) {
        setCurrentReviewIndex(newLength - 1)
      } else if (newLength === 0) {
        setCurrentReviewIndex(0)
      }

      toast.success("Resposta marcada como revisada")
    } catch (error) {
      toast.error("Erro ao marcar como revisado")
    }
  }

  const handleEditQuestion = async (questionData: any) => {
    // Implementar edição de questão
    toast.info("Funcionalidade de edição em desenvolvimento")
  }

  const handleDisableQuestion = async (questionData: any) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/questions/${questionData.question_id}/disable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace: true })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao desabilitar questão")
      }

      toast.success("Questão desabilitada e substituída por uma nova")
      setShowDisableQuestionDialog(false)
      setEditingQuestion(null)
      // Remover a resposta da lista de revisão se necessário
      setData(prev => prev ? {
        ...prev,
        answersNeedingReview: prev.answersNeedingReview.filter(a => a.question_id !== questionData.question_id)
      } : null)
      // Recarregar dashboard para atualizar estatísticas
      fetchDashboard()
    } catch (error: any) {
      console.error("Erro ao desabilitar questão:", error)
      toast.error(error.message || "Erro ao desabilitar questão")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  const { quiz, stats, mostMissedQuestions, participantScores, questions } = data

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/quiz")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                quiz.status === "active" ? "bg-green-500/10 text-green-600" :
                quiz.status === "closed" ? "bg-red-500/10 text-red-600" :
                "bg-yellow-500/10 text-yellow-600"
              )}>
                {quiz.status === "active" ? "Ativo" : 
                 quiz.status === "closed" ? "Encerrado" : "Rascunho"}
              </span>
              <span>•</span>
              <span className="font-mono">{quiz.share_code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copiar Link
          </Button>

          <Button
            variant={quiz.status === "active" ? "destructive" : "default"}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : quiz.status === "active" ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {quiz.status === "active" ? "Encerrar" : "Ativar"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDashboard}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}</p>
                <p className="text-sm text-muted-foreground">Média Pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quiz.questions_count}</p>
                <p className="text-sm text-muted-foreground">Perguntas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respostas que precisam revisão */}
      {data && data.answersNeedingReview && data.answersNeedingReview.length > 0 && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Pontos de Atenção - Respostas para Revisar
                </CardTitle>
            <CardDescription>
              {data.answersNeedingReview.length} resposta(s) marcada(s) com inconsistências ou questionadas que requerem revisão
            </CardDescription>
              </div>
              {data.answersNeedingReview.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentReviewIndex(prev => 
                      prev > 0 ? prev - 1 : data.answersNeedingReview.length - 1
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                    {currentReviewIndex + 1} / {data.answersNeedingReview.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentReviewIndex(prev => 
                      prev < data.answersNeedingReview.length - 1 ? prev + 1 : 0
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const answer = data.answersNeedingReview[currentReviewIndex]
              if (!answer) return null
              
              return (
                <div
                  key={answer.id}
                  className="p-4 rounded-lg border border-amber-500/30 bg-card space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{answer.participant_name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          answer.is_correct
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        )}>
                          {answer.is_correct ? "Correto" : "Incorreto"}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{answer.question_text}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Resposta selecionada:</span>
                          <span className="font-medium">
                            {answer.selected_option !== null
                              ? `${String.fromCharCode(65 + answer.selected_option)}. ${answer.options[answer.selected_option]}`
                              : "Não respondida"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Resposta correta:</span>
                          <span className="font-medium text-green-600">
                            {String.fromCharCode(65 + answer.correct_option)}. {answer.options[answer.correct_option]}
                          </span>
                        </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {answer.time_taken}s
                        </span>
                        <span>Pontos: {answer.points_earned}</span>
                        <span>Dificuldade: {"⭐".repeat(answer.difficulty)}</span>
                      </div>
                    </div>
                    
                    {/* Motivo da correção (se foi marcada como incorreta manualmente) */}
                    {answer.is_manually_corrected && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-red-600 mb-1">
                              Motivo da correção:
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {answer.correction_reason ? String(answer.correction_reason) : "Motivo não informado"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsReviewed(answer.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Marcar como Revisado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingQuestion(answer)
                          setShowEditQuestionDialog(true)
                        }}
                        className="text-blue-600 border-blue-600/30 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Questão
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingQuestion(answer)
                          setShowDisableQuestionDialog(true)
                        }}
                        className="text-red-600 border-red-600/30 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Desabilitar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Perguntas mais erradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Perguntas com Mais Erros
            </CardTitle>
            <CardDescription>
              Tópicos que precisam de mais atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mostMissedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível ainda
              </p>
            ) : (
              mostMissedQuestions.map((q, index) => (
                <div key={index} className="space-y-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="font-medium text-sm line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-500 font-bold">{q.error_rate}% erraram</span>
                    <span className="text-muted-foreground">{q.total_answers} respostas</span>
                  </div>
                  <Progress value={parseFloat(q.error_rate)} className="h-1.5 bg-red-500/20 [&>div]:bg-red-500" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Participantes
            </CardTitle>
            <CardDescription>
              Desempenho individual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {participantScores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum participante ainda
              </p>
            ) : (
              participantScores.slice(0, 10).map((item, index) => (
                <div 
                  key={item.participant.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {item.participant.avatar_url ? (
                      <Image 
                        src={item.participant.avatar_url} 
                        alt={item.participant.display_name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.participant.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.participant.correct_answers}/{item.participant.questions_answered} corretas ({item.accuracy}%)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{item.participant.total_score}</p>
                    <p className={cn(
                      "text-xs",
                      item.participant.status === "completed" ? "text-green-500" : "text-amber-500"
                    )}>
                      {item.participant.status === "completed" ? "Completo" : "Em andamento"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise de alinhamento */}
      {participantScores.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Análise de Alinhamento da Equipe
            </CardTitle>
            <CardDescription>
              Com base nas respostas, veja o nível de entendimento dos requisitos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const avgAccuracy = participantScores.reduce((sum, p) => sum + parseFloat(p.accuracy), 0) / participantScores.length
              const alignmentLevel = avgAccuracy >= 80 ? "high" : avgAccuracy >= 60 ? "medium" : "low"
              
              return (
                <div className={cn(
                  "p-6 rounded-xl border-2",
                  alignmentLevel === "high" && "bg-green-500/5 border-green-500/30",
                  alignmentLevel === "medium" && "bg-amber-500/5 border-amber-500/30",
                  alignmentLevel === "low" && "bg-red-500/5 border-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">
                        {alignmentLevel === "high" && "✅ Equipe Bem Alinhada"}
                        {alignmentLevel === "medium" && "⚠️ Alinhamento Parcial"}
                        {alignmentLevel === "low" && "❌ Necessário Realinhamento"}
                      </h4>
                      <p className="text-muted-foreground">
                        Taxa média de acerto: {avgAccuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div className={cn(
                      "text-4xl font-bold",
                      alignmentLevel === "high" && "text-green-500",
                      alignmentLevel === "medium" && "text-amber-500",
                      alignmentLevel === "low" && "text-red-500"
                    )}>
                      {avgAccuracy.toFixed(0)}%
                    </div>
                  </div>
                  
                  <p className="text-sm">
                    {alignmentLevel === "high" && 
                      "A equipe demonstrou um excelente entendimento dos requisitos do projeto. Continue assim!"
                    }
                    {alignmentLevel === "medium" && 
                      "Alguns membros podem precisar de esclarecimentos adicionais. Revise as perguntas com mais erros."
                    }
                    {alignmentLevel === "low" && 
                      "Recomendamos uma nova sessão de planning/refinement para garantir que todos estejam alinhados com os requisitos."
                    }
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Seção de Perguntas do Quiz */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="w-5 h-5 text-primary" />
                Perguntas do Quiz
              </CardTitle>
              <CardDescription>
                Todas as perguntas e suas estatísticas de desempenho
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuestionsExpanded(!questionsExpanded)}
            >
              {questionsExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        {questionsExpanded && (
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filtrar por:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={questionFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={questionFilter === "correct" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionFilter("correct")}
                  className="text-green-600 border-green-600/30 hover:bg-green-50 dark:hover:bg-green-950/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mais Acertadas
                </Button>
                <Button
                  variant={questionFilter === "incorrect" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionFilter("incorrect")}
                  className="text-red-600 border-red-600/30 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Mais Erradas
                </Button>
                <Button
                  variant={questionFilter === "questioned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionFilter("questioned")}
                  className="text-amber-600 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Questionadas
                </Button>
              </div>
            </div>
          <div className="space-y-4">
            {(() => {
              // Filtrar perguntas baseado no filtro selecionado
              let filteredQuestions = questions.sort((a, b) => a.order_index - b.order_index)
              
              if (questionFilter === "correct") {
                filteredQuestions = filteredQuestions.filter(
                  q => parseFloat(q.correct_rate) >= 50
                )
              } else if (questionFilter === "incorrect") {
                filteredQuestions = filteredQuestions.filter(
                  q => parseFloat(q.error_rate) >= 50
                )
              } else if (questionFilter === "questioned") {
                filteredQuestions = filteredQuestions.filter(
                  q => q.has_manual_corrections === true
                )
              }

              if (filteredQuestions.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma pergunta encontrada com o filtro selecionado
                  </p>
                )
              }

              return filteredQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-5 rounded-xl border bg-card space-y-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Cabeçalho da pergunta */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Pergunta #{index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Sparkles
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < question.difficulty
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                          {question.has_manual_corrections && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Questionada
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-base leading-relaxed">
                          {question.question_text}
                        </p>
                      </div>
                    </div>

                    {/* Opções */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={cn(
                            "p-3 rounded-lg border text-sm",
                            optIndex === question.correct_option
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-muted/30 border-border"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                "font-semibold",
                                optIndex === question.correct_option
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span
                              className={cn(
                                optIndex === question.correct_option
                                  ? "text-green-700 font-medium"
                                  : ""
                              )}
                            >
                              {option}
                            </span>
                            {optIndex === question.correct_option && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explicação */}
                    {question.explanation && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Explicação:</p>
                        <p className="text-sm text-foreground">{question.explanation}</p>
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">
                          Taxa de acerto:{" "}
                          <span className="font-semibold text-green-600">
                            {question.correct_rate}%
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground">
                          Taxa de erro:{" "}
                          <span className="font-semibold text-red-600">
                            {question.error_rate}%
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {question.total_answers} resposta{question.total_answers !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Barras de progresso */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 font-medium">Acertos</span>
                        <span className="text-muted-foreground">
                          {question.correct_rate}%
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(question.correct_rate)}
                        className="h-2 bg-green-500/20 [&>div]:bg-green-500"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-600 font-medium">Erros</span>
                        <span className="text-muted-foreground">
                          {question.error_rate}%
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(question.error_rate)}
                        className="h-2 bg-red-500/20 [&>div]:bg-red-500"
                      />
                    </div>
                  </div>
                ))
            })()}
          </div>
        </CardContent>
        )}
      </Card>

      {/* Dialog para editar questão */}
      <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Questão</DialogTitle>
            <DialogDescription>
              Edite o texto da questão, opções ou resposta correta
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-question-text">Texto da Questão</Label>
                <Textarea
                  id="edit-question-text"
                  defaultValue={editingQuestion.question_text}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Opções</Label>
                {editingQuestion.options.map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-semibold w-6">{String.fromCharCode(65 + idx)}.</span>
                    <Input defaultValue={opt} />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-explanation">Explicação</Label>
                <Textarea
                  id="edit-explanation"
                  defaultValue={editingQuestion.explanation}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditQuestionDialog(false)
              setEditingQuestion(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={() => editingQuestion && handleEditQuestion(editingQuestion)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para desabilitar questão */}
      <Dialog open={showDisableQuestionDialog} onOpenChange={setShowDisableQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desabilitar Questão</DialogTitle>
            <DialogDescription>
              Esta questão será desabilitada e substituída por uma nova gerada automaticamente.
              A nova questão será adicionada ao pool de perguntas disponíveis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDisableQuestionDialog(false)
              setEditingQuestion(null)
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingQuestion && handleDisableQuestion(editingQuestion)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Desabilitar e Substituir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

