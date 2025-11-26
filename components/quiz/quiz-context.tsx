"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Quiz,
  QuizQuestion,
  QuizParticipant,
  QuizGameState,
  LifelineType,
  LifelineResult,
} from "@/lib/quiz/types";

interface QuizContextType {
  // Estado do jogo
  gameState: QuizGameState | null;
  setGameState: (state: QuizGameState | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Resultado da última resposta
  lastAnswerResult: {
    isCorrect: boolean;
    correctOption: number;
    explanation: string;
    pointsEarned: number;
    needsReview?: boolean;
    answerId?: string;
  } | null;
  setLastAnswerResult: (
    result: {
      isCorrect: boolean;
      correctOption: number;
      explanation: string;
      pointsEarned: number;
      needsReview?: boolean;
      answerId?: string;
    } | null
  ) => void;

  // Lifeline atual em uso
  activeLifeline: LifelineResult | null;
  setActiveLifeline: (lifeline: LifelineResult | null) => void;

  // Actions
  submitAnswer: (
    questionId: string,
    selectedOption: number | null,
    timeTaken: number,
    isSkipped?: boolean,
    lifelineUsed?: LifelineType
  ) => Promise<void>;
  applyLifeline: (
    questionId: string,
    type: LifelineType
  ) => Promise<LifelineResult | null>;

  // Timer
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({
  children,
  quizId,
}: {
  children: ReactNode;
  quizId: string;
}) {
  const [gameState, setGameState] = useState<QuizGameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<{
    isCorrect: boolean;
    correctOption: number;
    explanation: string;
    pointsEarned: number;
    needsReview?: boolean;
    answerId?: string;
  } | null>(null);
  const [activeLifeline, setActiveLifeline] = useState<LifelineResult | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const submitAnswer = useCallback(
    async (
      questionId: string,
      selectedOption: number | null,
      timeTaken: number,
      isSkipped = false,
      lifelineUsed?: LifelineType
    ) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/quiz/${quizId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: questionId,
            selected_option: selectedOption,
            time_taken: timeTaken,
            is_skipped: isSkipped,
            lifeline_used: lifelineUsed,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao submeter resposta");
        }

        setLastAnswerResult({
          isCorrect: data.is_correct,
          correctOption: data.correct_option,
          explanation: data.explanation,
          pointsEarned: data.points_earned,
          needsReview: data.needs_review || false,
          answerId: data.answer_id,
        });

        // Atualizar estado do jogo
        if (gameState) {
          setGameState({
            ...gameState,
            participant: {
              ...gameState.participant,
              total_score:
                gameState.participant.total_score + data.points_earned,
              questions_answered: gameState.participant.questions_answered + 1,
              correct_answers: data.is_correct
                ? gameState.participant.correct_answers + 1
                : gameState.participant.correct_answers,
              current_question_index:
                gameState.participant.current_question_index + 1,
            },
            isFinished: data.is_finished,
          });
        }
      } catch (error) {
        console.error("Erro ao submeter resposta:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [quizId, gameState]
  );

  const applyLifeline = useCallback(
    async (
      questionId: string,
      type: LifelineType
    ): Promise<LifelineResult | null> => {
      if (type === "skip") {
        // Skip é tratado como uma resposta
        return { type: "skip", data: {} };
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/quiz/${quizId}/lifeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: questionId,
            lifeline_type: type,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao usar ajuda");
        }

        const result: LifelineResult = {
          type,
          data: data.data,
        };

        setActiveLifeline(result);

        // Atualizar lifelines disponíveis no estado
        if (gameState) {
          const updatedLifelines = { ...gameState.lifelines };
          if (type === "cards") {
            updatedLifelines.cards.available = Math.max(
              0,
              updatedLifelines.cards.available - 1
            );
          } else if (type === "audience") {
            updatedLifelines.audience.available = Math.max(
              0,
              updatedLifelines.audience.available - 1
            );
          }
          setGameState({ ...gameState, lifelines: updatedLifelines });
        }

        return result;
      } catch (error) {
        console.error("Erro ao usar lifeline:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [quizId, gameState]
  );

  return (
    <QuizContext.Provider
      value={{
        gameState,
        setGameState,
        isLoading,
        setIsLoading,
        lastAnswerResult,
        setLastAnswerResult,
        activeLifeline,
        setActiveLifeline,
        submitAnswer,
        applyLifeline,
        timeRemaining,
        setTimeRemaining,
        isTimerRunning,
        setIsTimerRunning,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
