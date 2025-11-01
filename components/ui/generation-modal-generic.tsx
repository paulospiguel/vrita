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
import { AlertCircle } from "lucide-react"

interface GenerationModalGenericProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: "generating" | "completed" | "error"
  errorMessage?: string
  title: string
  description: string
  warningMessage?: string
}

const feedbackMessages = [
  "Coletando informações",
  "Comunicando com IA",
  "Finalizando documento",
]

export function GenerationModalGeneric({
  open,
  onOpenChange,
  status,
  errorMessage,
  title,
  description,
  warningMessage = "Não feche esta janela ou troque de aba até a geração ser concluída, pois isso pode cancelar o processo.",
}: GenerationModalGenericProps) {
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
          currentIndex = feedbackMessages.length - 1
          clearInterval(messageInterval)
          return
        }
        currentProgress = 0
        setProgress(0)
        setCurrentMessageIndex(currentIndex)
      }, 2000)

      return () => {
        clearInterval(progressInterval)
        clearInterval(messageInterval)
      }
    } else if (status === "completed") {
      setProgress(100)
      setCurrentMessageIndex(feedbackMessages.length)
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, open, onOpenChange])

  // Impedir fechar durante geração
  const handleOpenChange = (newOpen: boolean) => {
    if (status === "generating" && !newOpen) {
      // Não permitir fechar durante geração
      return
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => {
          if (status === "generating") {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (status === "generating") {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {status === "generating" && description}
            {status === "completed" && "Geração concluída com sucesso!"}
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
              {warningMessage && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md w-full">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    {warningMessage}
                  </p>
                </div>
              )}
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

