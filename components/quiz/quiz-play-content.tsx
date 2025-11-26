"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuiz } from "./quiz-context";
import { QuizTimer } from "./quiz-timer";
import { QuizQuestionCard } from "./quiz-question-card";
import { QuizLifelines, AudienceResult } from "./quiz-lifelines";
import { QuizResultModal } from "./quiz-result-modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/ui/logo";
import { Trophy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Quiz, QuizParticipant, LifelineType } from "@/lib/quiz/types";

interface ShuffledQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  difficulty: number;
  points: number;
  order_index: number;
  original_order_index: number;
}

interface QuizPlayContentProps {
  quiz: Quiz;
  participant: QuizParticipant;
}

export function QuizPlayContent({ quiz, participant }: QuizPlayContentProps) {
  const router = useRouter();
  const {
    submitAnswer,
    applyLifeline,
    lastAnswerResult,
    setLastAnswerResult,
    activeLifeline,
    setActiveLifeline,
    isLoading,
  } = useQuiz();

  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    participant.current_question_index
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(quiz.time_per_question);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [lifelines, setLifelines] = useState({
    skip: { available: 3 - participant.skips_used, max: 3 },
    cards: { available: 1 - participant.cards_used, max: 1 },
    audience: { available: 1 - participant.audience_used, max: 1 },
  });

  // Carregar perguntas embaralhadas
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/quiz/${quiz.id}/questions`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar perguntas");
        }

        setQuestions(data.questions);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar perguntas");
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [quiz.id]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const progress = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  // Reset estado quando muda de pergunta
  useEffect(() => {
    if (!currentQuestion) return;

    setSelectedOption(null);
    setTimeRemaining(quiz.time_per_question);
    setIsTimerRunning(true);
    setShowResultModal(false);
    setEliminatedOptions([]);
    setActiveLifeline(null);
    setLastAnswerResult(null);
  }, [
    currentQuestionIndex,
    quiz.time_per_question,
    setActiveLifeline,
    setLastAnswerResult,
    currentQuestion,
  ]);

  // Mostrar modal quando lastAnswerResult for atualizado
  useEffect(() => {
    if (lastAnswerResult && !showResultModal) {
      setShowResultModal(true);
    }
  }, [lastAnswerResult, showResultModal]);

  // Resetar timer quando mudar de pergunta
  useEffect(() => {
    if (currentQuestion) {
      setIsTimerRunning(true);
      setTimeRemaining(quiz.time_per_question);
    }
  }, [currentQuestion, quiz.time_per_question]);

  const handleTimeUp = useCallback(async () => {
    // Prevenir múltiplas execuções
    if (showResultModal || !currentQuestion || isLoading) return;

    setIsTimerRunning(false);

    // Submeter como resposta incorreta (sem opção selecionada)
    // Isso vai abrir o modal de resposta errada automaticamente
    try {
      await submitAnswer(
        currentQuestion.id,
        null, // Nenhuma opção selecionada = resposta errada
        quiz.time_per_question, // Tempo total gasto
        false // Não pulou, mas não respondeu
      );
      // O submitAnswer já atualiza o lastAnswerResult através do contexto
      // O modal será mostrado automaticamente quando lastAnswerResult for atualizado
      setShowResultModal(true);
    } catch (error) {
      console.error("Erro ao submeter resposta por tempo esgotado:", error);
      // Mesmo com erro, mostrar resultado como incorreto
      setLastAnswerResult({
        isCorrect: false,
        correctOption: currentQuestion.correct_option,
        explanation: currentQuestion.explanation,
        pointsEarned: 0,
        needsReview: false,
        answerId: undefined
      });
      setShowResultModal(true);
    }
  }, [currentQuestion, quiz.time_per_question, submitAnswer, showResultModal, isLoading, setLastAnswerResult]);

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || isLoading || !currentQuestion) return;

    setIsTimerRunning(false);
    const timeTaken = quiz.time_per_question - timeRemaining;

    try {
      await submitAnswer(
        currentQuestion.id,
        selectedOption,
        timeTaken,
        false
      );
      setShowResultModal(true);
    } catch (error) {
      toast.error("Erro ao submeter resposta");
    }
  };

  const handleUseLifeline = async (type: LifelineType) => {
    if (!currentQuestion) return;

    if (type === "skip") {
      // Pular pergunta
      if (lifelines.skip.available <= 0) {
        toast.error("Você já usou todos os pulos!");
        return;
      }

      setIsTimerRunning(false);
      const timeTaken = quiz.time_per_question - timeRemaining;

      try {
        await submitAnswer(
          currentQuestion.id,
          null,
          timeTaken,
          true,
          "skip"
        );

        setLifelines((prev) => ({
          ...prev,
          skip: { ...prev.skip, available: prev.skip.available - 1 },
        }));

        // Ir para próxima pergunta ou finalizar
        if (isLastQuestion) {
          router.push(`/quiz/${quiz.id}/ranking`);
        } else {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      } catch (error) {
        toast.error("Erro ao pular pergunta");
      }
    } else {
      // Usar cartas ou resposta da equipe
      const result = await applyLifeline(currentQuestion.id, type);

      if (result) {
        if (
          type === "cards" &&
          result.data.eliminatedOptions
        ) {
          setEliminatedOptions(result.data.eliminatedOptions);
          toast.success("2 opções eliminadas!");
          setLifelines((prev) => ({
            ...prev,
            cards: { ...prev.cards, available: 0 },
          }));
        } else if (type === "audience") {
          setLifelines((prev) => ({
            ...prev,
            audience: { ...prev.audience, available: 0 },
          }));
        }
      }
    }
  };

  const handleContinue = () => {
    if (isLastQuestion) {
      // Quiz finalizado - ir para ranking
      router.push(`/quiz/${quiz.id}/ranking`);
      return;
    }

    // Fechar modal e limpar estado
    setShowResultModal(false);
    setLastAnswerResult(null);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setActiveLifeline(null);
    
    // Ir para próxima pergunta
    // O useEffect vai resetar o estado automaticamente quando currentQuestionIndex mudar
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p>Carregando perguntas...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Nenhuma pergunta disponível
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-bold">{participant.total_score}</span>
            </div>
          </div>
        </header>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>
              {currentQuestionIndex + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          {/* Question */}
          <div className="space-y-6">
            <QuizQuestionCard
              question={{
                id: currentQuestion.id,
                quiz_id: quiz.id,
                question_text: currentQuestion.question_text,
                options: currentQuestion.options,
                correct_option: currentQuestion.correct_option,
                explanation: currentQuestion.explanation,
                difficulty: currentQuestion.difficulty,
                points: currentQuestion.points,
                order_index: currentQuestion.order_index,
                created_at: new Date().toISOString(),
              }}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              showResult={showResultModal}
              correctOption={lastAnswerResult?.correctOption}
              eliminatedOptions={eliminatedOptions}
              disabled={isLoading || showResultModal}
            />

            {/* Audience result */}
            {activeLifeline?.type === "audience" &&
              activeLifeline.data.percentages && (
                <AudienceResult
                  percentages={activeLifeline.data.percentages}
                  options={currentQuestion.options}
                />
              )}

            {/* Submit button */}
            {!showResultModal && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null || isLoading}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Confirmar Resposta
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-6">
            {/* Timer */}
            <QuizTimer
              totalTime={quiz.time_per_question}
              timeRemaining={timeRemaining}
              onTimeUpdate={setTimeRemaining}
              onTimeUp={handleTimeUp}
              isRunning={isTimerRunning && !showResultModal}
            />

            {/* Lifelines */}
            {!showResultModal && (
              <QuizLifelines
                lifelines={lifelines}
                onUseLifeline={handleUseLifeline}
                disabled={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {lastAnswerResult && (
        <QuizResultModal
          isOpen={showResultModal}
          isCorrect={lastAnswerResult.isCorrect}
          correctOption={lastAnswerResult.correctOption}
          explanation={lastAnswerResult.explanation}
          pointsEarned={lastAnswerResult.pointsEarned}
          options={currentQuestion.options}
          selectedOption={selectedOption}
          onContinue={handleContinue}
          isLastQuestion={isLastQuestion}
          needsReview={lastAnswerResult.needsReview}
          answerId={lastAnswerResult.answerId}
          quizId={quiz.id}
          isOwner={false} // Será verificado no componente
        />
      )}
    </div>
  );
}
