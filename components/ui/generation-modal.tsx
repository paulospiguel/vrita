"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import Lottie from "lottie-react"
import loadingAnimation from "@/assets/lottiefiles/loading.json"
import successAnimation from "@/assets/lottiefiles/success.json"

interface GenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: "generating" | "completed" | "error"
  errorMessage?: string
}

const feedbackMessages = [
  "Coletando informações",
  "Comunicando com IA",
  "Finalizando documento",
]

export function GenerationModal({
  open,
  onOpenChange,
  status,
  errorMessage,
}: GenerationModalProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (status === "generating" && open) {
      setProgress(0)
      setCurrentMessageIndex(0)

      let currentIndex = 0
      let currentProgress = 0

      // Simular progresso para cada etapa
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 25, 95)
        setProgress(currentProgress)
      }, 300)

      // Trocar mensagens de feedback e reiniciar progress bar
      const messageInterval = setInterval(() => {
        currentIndex++
        if (currentIndex >= feedbackMessages.length) {
          // Voltar para última mensagem disponível (não mostrar "Finalizado" ainda)
          currentIndex = feedbackMessages.length - 1
          clearInterval(messageInterval)
          // Continuar progresso até 95% (só completa quando receber resposta)
          return
        }
        // Reiniciar progress bar a cada mudança de mensagem
        currentProgress = 0
        setProgress(0)
        setCurrentMessageIndex(currentIndex)
      }, 2000)

      return () => {
        clearInterval(progressInterval)
        clearInterval(messageInterval)
      }
    } else if (status === "completed") {
      // Quando realmente completar, mostrar "Finalizado com sucesso"
      setProgress(100)
      setCurrentMessageIndex(feedbackMessages.length) // Índice fora do array para mostrar mensagem especial
      // Fechar após 2 segundos
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === "generating" && "Gerando PRD com IA"}
            {status === "completed" && "PRD Gerado com Sucesso!"}
            {status === "error" && "Erro ao Gerar PRD"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === "generating" &&
              "Aguarde enquanto geramos seu documento estruturado"}
            {status === "completed" &&
              "Seu PRD foi gerado e está pronto para uso"}
            {status === "error" && errorMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {status === "generating" && (
            <>
              <div className="w-64 h-64">
                <Lottie
                  animationData={loadingAnimation}
                  loop={true}
                  autoplay={true}
                />
              </div>
              <div className="w-full px-4 space-y-3">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  {currentMessageIndex < feedbackMessages.length
                    ? feedbackMessages[currentMessageIndex]
                    : "Finalizado com sucesso"}
                </p>
              </div>
            </>
          )}
          {status === "completed" && (
            <div className="w-64 h-64">
              <Lottie
                animationData={successAnimation}
                loop={false}
                autoplay={true}
              />
            </div>
          )}
          {status === "error" && (
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

