"use client"

import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Clock, AlertTriangle } from "lucide-react"

interface QuizTimerProps {
  totalTime: number
  timeRemaining: number
  onTimeUpdate: (time: number) => void
  onTimeUp: () => void
  isRunning: boolean
  className?: string
}

export function QuizTimer({ 
  totalTime, 
  timeRemaining, 
  onTimeUpdate, 
  onTimeUp, 
  isRunning,
  className 
}: QuizTimerProps) {
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      const newTime = timeRemaining - 1
      onTimeUpdate(newTime)
      
      if (newTime <= 0) {
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, onTimeUpdate, onTimeUp])

  const percentage = (timeRemaining / totalTime) * 100
  const isLowTime = timeRemaining <= 10
  const isCriticalTime = timeRemaining <= 5

  // Calcular cor baseada no tempo
  const getColor = () => {
    if (isCriticalTime) return "rgb(239, 68, 68)" // red-500
    if (isLowTime) return "rgb(245, 158, 11)" // amber-500
    return "rgb(34, 197, 94)" // green-500
  }

  const circumference = 2 * Math.PI * 45

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Circular timer */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            className={cn(
              "transition-all duration-1000 ease-linear",
              isCriticalTime && "animate-pulse"
            )}
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isCriticalTime ? (
            <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce mb-1" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground mb-1" />
          )}
          <span 
            className={cn(
              "text-3xl font-bold tabular-nums",
              isCriticalTime && "text-red-500 animate-pulse",
              isLowTime && !isCriticalTime && "text-amber-500"
            )}
          >
            {timeRemaining}
          </span>
          <span className="text-xs text-muted-foreground">segundos</span>
        </div>
      </div>

      {/* Warning message */}
      {isLowTime && (
        <p className={cn(
          "text-sm font-medium animate-bounce",
          isCriticalTime ? "text-red-500" : "text-amber-500"
        )}>
          {isCriticalTime ? "Tempo esgotando!" : "Atenção ao tempo!"}
        </p>
      )}
    </div>
  )
}

