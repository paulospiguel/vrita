"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, HelpCircle, Sparkles } from "lucide-react"
import type { QuizQuestion, LifelineResult } from "@/lib/quiz/types"

interface QuizQuestionCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  selectedOption: number | null
  onSelectOption: (option: number) => void
  showResult: boolean
  correctOption?: number
  eliminatedOptions?: number[]
  disabled?: boolean
  className?: string
}

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  showResult,
  correctOption,
  eliminatedOptions = [],
  disabled = false,
  className
}: QuizQuestionCardProps) {
  const [revealedCorrect, setRevealedCorrect] = useState(false)

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => setRevealedCorrect(true), 500)
      return () => clearTimeout(timer)
    }
    setRevealedCorrect(false)
  }, [showResult])

  const getOptionStyle = (index: number) => {
    const isSelected = selectedOption === index
    const isCorrect = correctOption === index
    const isEliminated = eliminatedOptions.includes(index)
    const isWrong = showResult && isSelected && !isCorrect

    if (isEliminated && !showResult) {
      return "opacity-30 scale-95 cursor-not-allowed bg-muted/50"
    }

    if (showResult) {
      if (isCorrect && revealedCorrect) {
        return "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30 scale-105"
      }
      if (isWrong) {
        return "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 animate-shake"
      }
      if (isSelected && isCorrect) {
        return "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30"
      }
    }

    if (isSelected) {
      return "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
    }

    return "bg-card hover:bg-accent hover:border-accent-foreground/20 hover:scale-[1.01]"
  }

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Sparkles
        key={i}
        className={cn(
          "w-3 h-3",
          i < difficulty ? "text-amber-500" : "text-muted/30"
        )}
      />
    ))
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-card via-card to-accent/5",
      "border-2",
      className
    )}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
              Pergunta {questionNumber}/{totalQuestions}
            </span>
            <div className="flex items-center gap-0.5" title={`Dificuldade: ${question.difficulty}/5`}>
              {getDifficultyStars(question.difficulty)}
            </div>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {question.points} pontos
          </span>
        </div>

        {/* Question */}
        <div className="py-4">
          <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-foreground">
            {question.question_text}
          </h2>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const isEliminated = eliminatedOptions.includes(index)
            const letter = String.fromCharCode(65 + index) // A, B, C, D

            return (
              <Button
                key={index}
                onClick={() => onSelectOption(index)}
                disabled={disabled || isEliminated || showResult}
                variant="outline"
                className={cn(
                  "h-auto py-4 px-5 justify-start text-left",
                  "transition-all duration-300 ease-out",
                  "border-2 rounded-xl",
                  getOptionStyle(index)
                )}
              >
                <div className="flex items-center gap-4 w-full">
                  <span className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    "font-bold text-lg",
                    "transition-colors duration-300",
                    selectedOption === index || (showResult && correctOption === index)
                      ? "bg-white/20 text-inherit"
                      : "bg-primary/10 text-primary"
                  )}>
                    {showResult && correctOption === index && revealedCorrect ? (
                      <Check className="w-5 h-5" />
                    ) : showResult && selectedOption === index && correctOption !== index ? (
                      <X className="w-5 h-5" />
                    ) : (
                      letter
                    )}
                  </span>
                  <span className="flex-1 text-base font-medium">{option}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

