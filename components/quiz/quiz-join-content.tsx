"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Clock,
  HelpCircle,
  Trophy,
  Loader2,
  SkipForward,
  CreditCard,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  share_code: string;
  questions_count: number;
  time_per_question: number;
  status: string;
}

interface Participant {
  id: string;
  status: string;
  current_question_index: number;
}

interface QuizJoinContentProps {
  quiz: Quiz;
  existingParticipant: Participant | null;
}

export function QuizJoinContent({
  quiz,
  existingParticipant,
}: QuizJoinContentProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar no quiz");
      }

      // Redirecionar para o quiz
      router.push(`/quiz/play/${quiz.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar no quiz");
      setJoining(false);
    }
  };

  const handleContinue = () => {
    router.push(`/quiz/play/${quiz.id}`);
  };

  const handleViewRanking = () => {
    router.push(`/quiz/${quiz.id}/ranking`);
  };

  // Se já completou, mostrar opção de ver ranking
  if (existingParticipant?.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Quiz Completado!</h2>
              <p className="text-muted-foreground">
                Você já completou este quiz. Veja sua posição no ranking.
              </p>
            </div>

            <Button onClick={handleViewRanking} className="w-full" size="lg">
              <Trophy className="w-5 h-5 mr-2" />
              Ver Ranking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tem participação em andamento
  if (existingParticipant?.status === "playing") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold">Quiz em Andamento</h2>
              <p className="text-muted-foreground">
                Você já iniciou este quiz. Continue de onde parou!
              </p>
              <p className="text-sm text-primary font-medium">
                Pergunta {existingParticipant.current_question_index + 1} de{" "}
                {quiz.questions_count}
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Continuar Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de boas-vindas
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="default" />
        </div>

        {/* Quiz info card */}
        <Card className="overflow-hidden">
          {/* Header gradient */}
          <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

          <CardContent className="pt-8 pb-6 space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground">{quiz.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{quiz.questions_count}</p>
                  <p className="text-xs text-muted-foreground">Perguntas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {quiz.time_per_question}s
                  </p>
                  <p className="text-xs text-muted-foreground">Por pergunta</p>
                </div>
              </div>
            </div>

            {/* Lifelines info */}
            <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
              <h3 className="font-semibold text-sm">Ajudas Disponíveis:</h3>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <SkipForward className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>Pular</strong> - 3 chances de pular perguntas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>
                    <strong>Cartas</strong> - Elimina 2 opções erradas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>
                    <strong>Equipa</strong> - Média das respostas
                  </span>
                </div>
              </div>
            </div>

            {/* Start button */}
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Quiz
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Responda corretamente e rapidamente para ganhar mais pontos!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
