"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trophy,
  Users,
  BarChart3,
  ChevronRight,
  FileText,
  Play,
  Pause,
  Loader2,
  Link as LinkIcon,
  Copy,
  Check,
  Brain,
  Shield,
  Trash2,
  Edit,
  Square,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  share_code: string;
  questions_count: number;
  time_per_question?: number;
  status: "draft" | "active" | "closed";
  created_at: string;
  quiz_participants: { count: number }[];
}

export function QuizListContent() {
  const router = useRouter();
  const { canCreateQuiz, isAdmin, loading: roleLoading } = useUserRole();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joiningQuiz, setJoiningQuiz] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [quizToClose, setQuizToClose] = useState<{
    id: string;
    title: string;
    currentStatus: string;
  } | null>(null);
  const [closingQuizId, setClosingQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (canCreateQuiz) {
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, [canCreateQuiz]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/quiz");
      const data = await response.json();
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
      toast.error("Erro ao carregar quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuiz = async () => {
    if (!joinCode.trim()) {
      toast.error("Digite o código do quiz");
      return;
    }

    setJoiningQuiz(true);
    try {
      const response = await fetch(`/api/quiz/share/${joinCode.toUpperCase()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Quiz não encontrado");
      }

      router.push(`/quiz/join/${joinCode.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar no quiz");
    } finally {
      setJoiningQuiz(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    const shareUrl = `${window.location.origin}/quiz/join/${code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedCode(code);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatusClick = (
    quizId: string,
    quizTitle: string,
    currentStatus: string
  ) => {
    if (currentStatus === "active") {
      // Se está ativo, mostrar confirmação para encerrar
      setQuizToClose({ id: quizId, title: quizTitle, currentStatus });
    } else {
      // Se está encerrado, ativar diretamente
      handleToggleStatus(quizId, currentStatus);
    }
  };

  const handleToggleStatus = async (quizId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";

    setClosingQuizId(quizId);
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar status");

      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quizId
            ? { ...q, status: newStatus as "active" | "closed" }
            : q
        )
      );

      toast.success(
        `Quiz ${newStatus === "active" ? "ativado" : "encerrado"} com sucesso`
      );
    } catch (error) {
      toast.error("Erro ao atualizar status do quiz");
    } finally {
      setClosingQuizId(null);
      setQuizToClose(null);
    }
  };

  const handleCloseConfirm = async () => {
    if (!quizToClose) return;
    await handleToggleStatus(quizToClose.id, quizToClose.currentStatus);
  };

  const handleCloseCancel = () => {
    setQuizToClose(null);
  };

  const handleDeleteClick = (quizId: string, quizTitle: string) => {
    setQuizToDelete({ id: quizId, title: quizTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;

    setDeletingQuizId(quizToDelete.id);
    try {
      const response = await fetch(`/api/quiz/${quizToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir quiz");
      }

      // Remover quiz da lista
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      toast.success("Quiz excluído com sucesso");
      setQuizToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir quiz");
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleDeleteCancel = () => {
    setQuizToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return { label: "Rascunho", color: "bg-yellow-500/10 text-yellow-600" };
      case "active":
        return { label: "Ativo", color: "bg-green-500/10 text-green-600" };
      case "closed":
        return { label: "Encerrado", color: "bg-red-500/10 text-red-600" };
      default:
        return { label: status, color: "bg-muted text-muted-foreground" };
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />

      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" />
            Requirements Wisdom Quiz
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Teste o Conhecimento da Sua Equipe
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Confirme o entendimento dos requisitos do projeto utilizando quizzes
            interativos
          </p>
        </div>

        {/* Join Quiz Section */}
        <Card className="mb-8 border-2 border-dashed bg-card/50">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-semibold mb-1 flex items-center justify-center md:justify-start gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Participar de um Quiz
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recebeu um código? Digite abaixo para participar
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Digite o código (ex: ABC12345)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinQuiz()}
                  className="w-full md:w-48 font-mono uppercase"
                  maxLength={8}
                />
                <Button onClick={handleJoinQuiz} disabled={joiningQuiz}>
                  {joiningQuiz ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Entrar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin/Manager Section */}
        {canCreateQuiz ? (
          <>
            {/* Quizzes List Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Meus Quizzes
                </h2>
                <p className="text-sm text-muted-foreground">
                  {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}{" "}
                  criado{quizzes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={() => router.push("/quiz/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Quiz
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : quizzes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Nenhum quiz criado
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                    Crie seu primeiro quiz para testar o entendimento da sua
                    equipe sobre os requisitos do projeto
                  </p>
                  <Button onClick={() => router.push("/quiz/create")} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => {
                  const statusBadge = getStatusBadge(quiz.status);
                  const participantsCount =
                    quiz.quiz_participants?.[0]?.count || 0;

                  return (
                    <Card
                      key={quiz.id}
                      className="hover:shadow-lg transition-all hover:border-primary/30"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {quiz.title}
                              </h3>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  statusBadge.color
                                )}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            {quiz.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {quiz.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {quiz.questions_count} perguntas
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {participantsCount} participante
                                {participantsCount !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <LinkIcon className="w-4 h-4" />
                                {quiz.share_code}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(quiz.share_code)}
                              title="Copiar link"
                            >
                              {copiedCode === quiz.share_code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleStatusClick(
                                  quiz.id,
                                  quiz.title,
                                  quiz.status
                                )
                              }
                              disabled={closingQuizId === quiz.id}
                              title={
                                quiz.status === "active"
                                  ? "Encerrar quiz"
                                  : "Ativar quiz"
                              }
                            >
                              {closingQuizId === quiz.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : quiz.status === "active" ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/quiz/${quiz.id}/dashboard`)
                              }
                              title="Ver dashboard"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>

                            {quiz.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/quiz/${quiz.id}/edit`)
                                }
                                title="Editar quiz"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}

                            {(quiz.status === "closed" ||
                              quiz.status === "draft") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteClick(quiz.id, quiz.title)
                                }
                                disabled={deletingQuizId === quiz.id}
                                title="Excluir quiz"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                {deletingQuizId === quiz.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/quiz/${quiz.id}/dashboard`)
                              }
                            >
                              Ver Detalhes
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* User Section - Can only join quizzes */
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Participe dos Quizzes
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Digite o código do quiz acima para participar. A criação de
                quizzes está disponível apenas para administradores e gerentes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={quizToDelete !== null}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o quiz{" "}
              <strong>&quot;{quizToDelete?.title}&quot;</strong>?
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                Esta ação não pode ser desfeita.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deletingQuizId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingQuizId !== null}
            >
              {deletingQuizId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de encerramento */}
      <Dialog
        open={quizToClose !== null}
        onOpenChange={(open) => !open && handleCloseCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Encerramento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja encerrar o quiz{" "}
              <strong>&quot;{quizToClose?.title}&quot;</strong>?
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Após encerrar, os participantes não poderão mais responder
                perguntas. Você poderá reativar o quiz depois se necessário.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseCancel}
              disabled={closingQuizId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleCloseConfirm}
              disabled={closingQuizId !== null}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {closingQuizId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Encerrando...
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Confirmar Encerramento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
