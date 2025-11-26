"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Flag,
  X,
  Loader2
} from "lucide-react"
import Lottie from "lottie-react"
import successAnimation from "@/assets/lottiefiles/success.json"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface QuizResultModalProps {
  isOpen: boolean
  isCorrect: boolean
  correctOption: number
  explanation: string
  pointsEarned: number
  options: string[]
  selectedOption: number | null
  onContinue: () => void
  isLastQuestion: boolean
  needsReview?: boolean
  answerId?: string
  quizId?: string
  isOwner?: boolean
}

export function QuizResultModal({
  isOpen,
  isCorrect,
  correctOption,
  explanation,
  pointsEarned,
  options,
  selectedOption,
  onContinue,
  isLastQuestion,
  needsReview = false,
  answerId,
  quizId,
  isOwner = false
}: QuizResultModalProps) {
  const [showContent, setShowContent] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionReason, setCorrectionReason] = useState("")
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false)
  const [isActuallyOwner, setIsActuallyOwner] = useState(false)

  // Verificar se é dono do quiz
  useEffect(() => {
    const checkOwner = async () => {
      if (!quizId) {
        setIsActuallyOwner(false)
        return
      }

      try {
        const response = await fetch(`/api/quiz/${quizId}/check-owner`)
        const data = await response.json()
        setIsActuallyOwner(data.isOwner || false)
      } catch (error) {
        setIsActuallyOwner(false)
      }
    }

    if (isOpen && quizId) {
      checkOwner()
    }
  }, [isOpen, quizId])

  const handleMarkAsWrong = () => {
    setShowCorrectionDialog(true)
  }

  const handleSubmitCorrection = async () => {
    if (!correctionReason.trim()) {
      toast.error("Por favor, informe o motivo da correção")
      return
    }

    if (!answerId || !quizId) {
      toast.error("Erro: informações da resposta não encontradas")
      return
    }

    setIsSubmittingCorrection(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}/answers/${answerId}/correct`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_correct: false,
          correction_reason: correctionReason.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao corrigir resposta")
      }

      toast.success("Resposta marcada como incorreta com sucesso!")
      setShowCorrectionDialog(false)
      setCorrectionReason("")
      // Opcional: recarregar a página ou atualizar o estado
      window.location.reload()
    } catch (error: any) {
      console.error("Erro ao corrigir resposta:", error)
      toast.error(error.message || "Erro ao corrigir resposta")
    } finally {
      setIsSubmittingCorrection(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
      const timer = setTimeout(() => setShowContent(true), 600)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
      setShowAnimation(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500",
          isCorrect 
            ? "bg-green-500/20 backdrop-blur-sm" 
            : "bg-red-500/20 backdrop-blur-sm"
        )}
      />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden",
        "transform transition-all duration-500",
        showContent ? "scale-100 opacity-100" : "scale-90 opacity-0",
        isCorrect 
          ? "bg-gradient-to-br from-green-900 via-green-800 to-emerald-900" 
          : "bg-gradient-to-br from-red-900 via-red-800 to-rose-900"
      )}>
        {/* Botão para marcar como errada (apenas para dono do quiz) */}
        {isActuallyOwner && answerId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMarkAsWrong}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            title="Marcar resposta como incorreta"
          >
            <Flag className="w-5 h-5" />
          </Button>
        )}
        {/* Header com animação */}
        <div className="relative h-40 flex items-center justify-center overflow-hidden">
          {/* Background effect */}
          <div className={cn(
            "absolute inset-0",
            isCorrect 
              ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-400/30 via-transparent to-transparent"
              : "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-400/30 via-transparent to-transparent"
          )} />

          {/* Animation */}
          {showAnimation && (
            <div className="relative z-10">
              {isCorrect ? (
                <div className="w-24 h-24">
                  <Lottie 
                    animationData={successAnimation} 
                    loop={false}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  "bg-red-500/30 animate-pulse"
                )}>
                  <XCircle className="w-14 h-14 text-red-400" />
                </div>
              )}
            </div>
          )}

          {/* Floating sparkles for correct answer */}
          {isCorrect && (
            <>
              <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
              <Sparkles className="absolute top-8 right-8 w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
              <Sparkles className="absolute bottom-4 left-8 w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-white">
          {/* Result text */}
          <div className="text-center space-y-2">
            <h3 className={cn(
              "text-2xl font-bold",
              isCorrect ? "text-green-300" : "text-red-300"
            )}>
              {isCorrect ? "🎉 Correto!" : "😔 Incorreto"}
            </h3>
            
            {isCorrect && pointsEarned > 0 && (
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xl font-bold">+{pointsEarned} pontos</span>
              </div>
            )}

            {/* Flag de ponto de atenção */}
            {needsReview && (
              <div className="flex items-center justify-center gap-2 mt-3 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">
                  Esta resposta foi marcada para revisão
                </span>
              </div>
            )}
          </div>

          {/* Correct answer */}
          {!isCorrect && (
            <div className={cn(
              "p-4 rounded-xl",
              "bg-white/10 border border-white/20"
            )}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/70 mb-1">Resposta correta:</p>
                  <p className="font-semibold">
                    {String.fromCharCode(65 + correctOption)}. {options[correctOption]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className={cn(
            "p-4 rounded-xl",
            "bg-white/5 border border-white/10"
          )}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/70 mb-2">Explicação:</p>
                <p className="text-sm text-white/90 leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <Button
            onClick={onContinue}
            className={cn(
              "w-full h-12 text-lg font-semibold",
              "transition-all duration-200 hover:scale-[1.02]",
              isCorrect 
                ? "bg-green-500 hover:bg-green-400 text-white" 
                : "bg-white hover:bg-white/90 text-gray-900"
            )}
          >
            {isLastQuestion ? (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Ver Resultado Final
              </>
            ) : (
              <>
                Próxima Pergunta
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dialog para correção manual */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Marcar Resposta como Incorreta</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual esta resposta deve ser considerada incorreta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correction-reason">
                Motivo da correção <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="correction-reason"
                placeholder="Ex: A resposta correta está incorreta, a questão tem ambiguidade, etc."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                rows={4}
                className="resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este motivo será exibido na dashboard para revisão. É obrigatório informar o motivo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCorrectionDialog(false)
                setCorrectionReason("")
              }}
              disabled={isSubmittingCorrection}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCorrection}
              disabled={isSubmittingCorrection || !correctionReason.trim()}
            >
              {isSubmittingCorrection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Marcar como Incorreta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

