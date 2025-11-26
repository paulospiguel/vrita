"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Upload,
  FileText,
  Brain,
  Loader2,
  Sparkles,
  Clock,
  HelpCircle,
  Check,
  Copy,
  Share2,
  ExternalLink,
  X,
  File,
  FileType,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import Lottie from "lottie-react";
import aiThinkingAnimation from "@/assets/lottiefiles/ai-thincking.json";

interface CreatedQuiz {
  id: string;
  title: string;
  share_code: string;
  questions_count: number;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export function CreateQuizContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"form" | "generating" | "success">("form");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    documents_content: "",
    questions_count: 10,
    time_per_question: 30,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<CreatedQuiz | null>(null);
  const [copied, setCopied] = useState(false);

  // Verificar se há dados de projeto no sessionStorage para pré-preencher
  useEffect(() => {
    const quizFromProject = sessionStorage.getItem("quizFromProject");
    if (quizFromProject) {
      try {
        const projectData = JSON.parse(quizFromProject);
        setFormData((prev) => ({
          ...prev,
          title: projectData.title || prev.title,
          description: projectData.description || prev.description,
          documents_content: projectData.documents_content || prev.documents_content,
        }));
        // Limpar sessionStorage após usar
        sessionStorage.removeItem("quizFromProject");
      } catch (error) {
        console.error("Erro ao carregar dados do projeto:", error);
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      const filesList: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        formDataUpload.append("files", files[i]);
        filesList.push({
          name: files[i].name,
          size: files[i].size,
          type: files[i].type,
        });
      }

      const response = await fetch("/api/quiz/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar arquivo");
      }

      setUploadedFiles(filesList);
      setFormData((prev) => ({
        ...prev,
        documents_content: data.content,
      }));

      toast.success(
        `${data.filesProcessed} arquivo(s) processado(s) com sucesso!`
      );
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar arquivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      setFormData((prev) => ({ ...prev, documents_content: "" }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Digite um título para o quiz");
      return;
    }

    if (!formData.documents_content.trim()) {
      toast.error("Faça upload de um documento ou cole o conteúdo do PRD/RSD");
      return;
    }

    if (formData.documents_content.trim().length < 500) {
      toast.error(
        "O documento parece muito curto. Adicione mais conteúdo para gerar boas perguntas."
      );
      return;
    }

    setStep("generating");

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar quiz");
      }

      setCreatedQuiz({
        id: data.quiz.id,
        title: data.quiz.title,
        share_code: data.quiz.share_code,
        questions_count: data.questions_generated,
      });
      setStep("success");
      toast.success("Quiz criado com sucesso!");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao criar quiz");
      setStep("form");
    }
  };

  const handleCopyLink = async () => {
    if (!createdQuiz) return;
    const shareUrl = `${window.location.origin}/quiz/join/${createdQuiz.share_code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async () => {
    if (!createdQuiz) return;

    try {
      const response = await fetch(`/api/quiz/${createdQuiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!response.ok) throw new Error("Erro ao ativar quiz");

      toast.success("Quiz ativado! Agora as pessoas podem participar.");
      router.push(`/quiz/${createdQuiz.id}/dashboard`);
    } catch (error) {
      toast.error("Erro ao ativar quiz");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/quiz")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
          </div>
          <ThemeToggle />
        </header>

        {/* Form Step */}
        {step === "form" && (
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Criar Novo Quiz</CardTitle>
              <CardDescription>
                Faça upload do seu documento PRD/RSD ou cole o conteúdo
                diretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Quiz *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Quiz do Projeto X - Sprint 5"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Breve descrição do quiz"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Upload de arquivos */}
                <div className="space-y-3">
                  <Label>Documento PRD/RSD *</Label>

                  {/* Upload area */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isUploading && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Processando arquivos...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Clique para fazer upload ou arraste os arquivos
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PDF, Word (.docx, .doc) ou TXT • Máximo 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arquivos enviados */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {file.name.endsWith(".pdf") ? (
                              <FileType className="w-5 h-5 text-red-500" />
                            ) : file.name.endsWith(".txt") ? (
                              <FileText className="w-5 h-5 text-blue-500" />
                            ) : (
                              <File className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divisor */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        ou cole o conteúdo
                      </span>
                    </div>
                  </div>

                  {/* Textarea */}
                  <Textarea
                    id="documents"
                    placeholder="Cole aqui o conteúdo do seu documento de requisitos (PRD, RSD, especificação técnica, etc.)

Quanto mais detalhado for o documento, melhores serão as perguntas geradas..."
                    value={formData.documents_content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documents_content: e.target.value,
                      }))
                    }
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.documents_content.length.toLocaleString()}{" "}
                    caracteres
                    {formData.documents_content.length > 0 &&
                      formData.documents_content.length < 500 && (
                        <span className="text-amber-500 ml-2">
                          • Recomendamos pelo menos 500 caracteres
                        </span>
                      )}
                  </p>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="questions_count"
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Quantidade de Perguntas
                    </Label>
                    <Input
                      id="questions_count"
                      type="number"
                      min={5}
                      max={30}
                      value={formData.questions_count}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          questions_count: Math.min(
                            30,
                            Math.max(5, parseInt(e.target.value) || 10)
                          ),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Entre 5 e 30 perguntas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="time_per_question"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Tempo por Pergunta (segundos)
                    </Label>
                    <Input
                      id="time_per_question"
                      type="number"
                      min={15}
                      max={120}
                      value={formData.time_per_question}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          time_per_question: Math.min(
                            120,
                            Math.max(15, parseInt(e.target.value) || 30)
                          ),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Entre 15 e 120 segundos
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" size="lg" className="w-full h-12">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Quiz com IA
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-48 h-48">
                  <Lottie
                    animationData={aiThinkingAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Gerando Quiz...</h3>
                  <p className="text-muted-foreground">
                    A IA está analisando o documento e criando perguntas
                    inteligentes
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Isso pode levar alguns segundos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === "success" && createdQuiz && (
          <Card className="border-green-500/50 bg-green-500/5 shadow-lg">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Quiz Criado com Sucesso!</h3>
                  <p className="text-muted-foreground">
                    {createdQuiz.questions_count} perguntas foram geradas
                    automaticamente
                  </p>
                </div>

                {/* Share Code */}
                <div className="w-full max-w-md p-4 rounded-xl bg-card border-2 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Código de compartilhamento
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-bold tracking-wider">
                        {createdQuiz.share_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      Link: {typeof window !== "undefined" ? window.location.origin : ""}/quiz/join/
                      {createdQuiz.share_code}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button className="flex-1" onClick={handleActivate}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ativar e Ver Dashboard
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  O quiz precisa ser <strong>ativado</strong> para que as pessoas
                  possam participar
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
