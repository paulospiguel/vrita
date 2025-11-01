"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Copy,
  FileDown,
  FileText,
  CheckCircle2,
  Palette,
  Globe,
  Loader2,
  X,
  Eye,
  Upload,
  FolderOpen,
  Calendar,
} from "lucide-react";
import { useProject } from "@/components/providers/project-context";
import { useGeneration } from "@/components/providers/generation-context";
import { GenerationModalGeneric } from "@/components/ui/generation-modal-generic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import Lottie from "lottie-react";
import aiThinkingAnimation from "@/assets/lottiefiles/ai-thincking.json";
import { formatDownloadFilename } from "@/lib/utils/filename";

export function SystemDesignerGenerator() {
  const { projectData } = useProject();
  const { activeGenerator, generatorStates, updateGeneratorState } =
    useGeneration();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "generating" | "completed" | "error"
  >("generating");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedDesignData, setImportedDesignData] = useState<string | null>(
    null
  );
  const [showDesignDataModal, setShowDesignDataModal] = useState(false);
  const [applyingDirectly, setApplyingDirectly] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projects, setProjects] = useState<
    Array<{
      id: string;
      name: string;
      project_data: any;
      created_at: string;
    }>
  >([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [importSource, setImportSource] = useState<"project" | "url" | null>(
    null
  );
  const [importedProjectName, setImportedProjectName] = useState<string | null>(
    null
  );
  const [urlValidation, setUrlValidation] = useState<{
    valid: boolean;
    title?: string;
    description?: string;
    domain?: string;
    error?: string;
    loading: boolean;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousActiveGeneratorRef = useRef<typeof activeGenerator>(null);
  const isRestoringRef = useRef(false);
  const lastContextInputRef = useRef("");
  const lastContextOutputRef = useRef("");
  const printRef = useRef<HTMLDivElement>(null);

  // Inicializar estado do contexto apenas quando a aba se torna ativa
  useEffect(() => {
    const wasOtherTab = previousActiveGeneratorRef.current !== "designer";
    const isNowDesigner = activeGenerator === "designer";

    // Só restaurar quando mudar de outra aba para designer
    if (isNowDesigner && wasOtherTab) {
      isRestoringRef.current = true;
      // Acessar valores do contexto diretamente sem incluí-los nas dependências
      const contextInput = generatorStates.designer.input || "";
      const contextOutput = generatorStates.designer.output || "";

      setInput(contextInput);
      setOutput(contextOutput);

      // Atualizar refs para evitar salvamento desnecessário
      lastContextInputRef.current = contextInput;
      lastContextOutputRef.current = contextOutput;

      // Resetar flag após atualização
      requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    }

    previousActiveGeneratorRef.current = activeGenerator;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenerator]);

  // Salvar input no contexto quando o usuário digitar (debounce)
  useEffect(() => {
    // Não salvar se estamos restaurando do contexto
    if (isRestoringRef.current) {
      return;
    }

    // Não salvar se não estamos na aba designer
    if (activeGenerator !== "designer") {
      return;
    }

    // Não salvar se o valor não mudou desde a última vez
    if (input === lastContextInputRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      // Verificar novamente antes de salvar
      if (
        !isRestoringRef.current &&
        activeGenerator === "designer" &&
        input !== lastContextInputRef.current
      ) {
        lastContextInputRef.current = input;
        updateGeneratorState("designer", { input });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input, activeGenerator, updateGeneratorState]);

  // Salvar output no contexto quando mudar
  useEffect(() => {
    // Não salvar se estamos restaurando do contexto
    if (isRestoringRef.current) {
      return;
    }

    // Não salvar se não estamos na aba designer ou se output está vazio
    if (activeGenerator !== "designer" || !output) {
      return;
    }

    // Não salvar se o valor não mudou desde a última vez
    if (output === lastContextOutputRef.current) {
      return;
    }

    lastContextOutputRef.current = output;
    updateGeneratorState("designer", { output });
  }, [output, activeGenerator, updateGeneratorState]);

  const handleValidateUrl = async (urlToValidate: string) => {
    if (!urlToValidate.trim()) {
      setUrlValidation(null);
      return;
    }

    setUrlValidation({ valid: false, loading: true });

    try {
      const response = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToValidate }),
      });

      const data = await response.json();

      if (data.valid) {
        setUrlValidation({
          valid: true,
          title: data.title,
          description: data.description,
          domain: data.domain,
          loading: false,
        });
      } else {
        setUrlValidation({
          valid: false,
          error: data.error || "URL inválida",
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("Erro ao validar URL:", error);
      setUrlValidation({
        valid: false,
        error: "Erro ao validar URL. Tente novamente.",
        loading: false,
      });
    }
  };

  const handleImportDesign = async () => {
    if (!url.trim()) {
      toast.error("URL é obrigatória", {
        description: "Por favor, informe a URL do site para importar o design.",
      });
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      toast.error("URL inválida", {
        description:
          "Por favor, informe uma URL válida (ex: https://exemplo.com).",
      });
      return;
    }

    // Limpar dados de projeto se existirem
    setInput("");
    setImportedProjectName(null);
    setImportSource("url");

    setImporting(true);
    try {
      const response = await fetch("/api/extract-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error || "Erro ao extrair design do site"
        );
        (error as any).isRetryable = errorData.isRetryable || false;
        throw error;
      }

      const data = await response.json();
      setImportedDesignData(data.analysis);
      setUrlValidation(null); // Limpar validação após importar com sucesso

      // Preencher com uma descrição básica se não houver input
      if (!input.trim()) {
        setInput(
          `Analise o design do site ${url} e crie um sistema de design baseado nos elementos encontrados.`
        );
      }

      toast.success("Design importado com sucesso!", {
        description:
          "Clique no ícone de visualizar para ver os dados extraídos.",
      });
    } catch (error: any) {
      console.error("Erro ao importar design:", error);
      const isRetryable = error.name === "RetryableError" || error.isRetryable;
      toast.error("Erro ao importar design", {
        description:
          error.message ||
          "Tente novamente ou verifique se a URL está acessível.",
        ...(isRetryable && {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleImportDesign(),
          },
        }),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleApplyDirectly = async () => {
    if (!importedDesignData) return;

    setApplyingDirectly(true);
    setShowDesignDataModal(false);
    setModalOpen(true);
    setModalStatus("generating");

    try {
      // Converter a análise diretamente em sistema de design usando a IA mas sem modificações
      const response = await fetch("/api/generate/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input:
            "Crie um sistema de design completo baseado na análise fornecida, mantendo todos os elementos do design original.",
          projectContext: projectData,
          importedDesignData: importedDesignData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 402 &&
          errorData.code === "SUBSCRIPTION_REQUIRED"
        ) {
          throw new Error("SUBSCRIPTION_REQUIRED");
        }
        const error = new Error(
          errorData.error || "Erro ao gerar sistema de design"
        );
        (error as any).isRetryable = errorData.isRetryable || false;
        throw error;
      }

      const data = await response.json();
      setOutput(data.content);
      updateGeneratorState("designer", { output: data.content });
      setModalStatus("completed");

      // Limpar dados de importação após gerar com sucesso
      if (importSource === "url") {
        setImportSource(null);
        setImportedDesignData(null);
        setUrl("");
        setUrlValidation(null);
      }

      toast.success("Sistema de design gerado com sucesso!");
    } catch (error: any) {
      console.error(error);
      setModalStatus("error");
      if (error.message === "SUBSCRIPTION_REQUIRED") {
        setErrorMessage(
          "Assinatura necessária para usar a chave de IA do servidor."
        );
        toast.error("Assinatura necessária", {
          description:
            "Configure sua chave de API ou assine um plano para continuar.",
        });
      } else {
        const isRetryable =
          error.name === "RetryableError" || error.isRetryable;
        setErrorMessage(error.message || "Erro ao gerar sistema de design.");
        toast.error("Erro ao gerar sistema de design", {
          description:
            error.message || "Tente novamente ou verifique sua conexão.",
          ...(isRetryable && {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleApplyDirectly(),
            },
          }),
        });
      }
    } finally {
      setApplyingDirectly(false);
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Erro ao carregar projetos");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast.error("Erro ao carregar projetos", {
        description: "Tente novamente.",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleOpenProjectsModal = () => {
    setShowProjectsModal(true);
    if (projects.length === 0) {
      loadProjects();
    }
  };

  const handleImportProject = (project: {
    id: string;
    name: string;
    project_data: any;
  }) => {
    const { project_data } = project;

    // Limpar dados de URL se existirem
    setUrl("");
    setImportedDesignData(null);
    setUrlValidation(null);
    setImportSource("project");
    setImportedProjectName(project.name);

    // Construir descrição completa com dados do projeto
    let projectDescription = "";

    if (project_data.projectName) {
      projectDescription += `**Projeto:** ${project_data.projectName}\n\n`;
    }

    if (project_data.description) {
      projectDescription += `**Descrição:** ${project_data.description}\n\n`;
    }

    if (project_data.vision) {
      projectDescription += `**Visão:** ${project_data.vision}\n\n`;
    }

    if (project_data.targetAudience) {
      projectDescription += `**Público-Alvo:** ${project_data.targetAudience}\n\n`;
    }

    if (project_data.objectives) {
      projectDescription += `**Objetivos:** ${project_data.objectives}\n\n`;
    }

    if (project_data.features) {
      projectDescription += `**Features Principais:** ${project_data.features}\n\n`;
    }

    if (project_data.designSystem) {
      projectDescription += `**Requisitos de Design:** ${project_data.designSystem}\n\n`;
    }

    if (project_data.strategy) {
      projectDescription += `**Estratégia:** ${project_data.strategy}\n\n`;
    }

    if (
      project_data.technicalRequirements &&
      project_data.technicalRequirements.length > 0
    ) {
      projectDescription += `**Requisitos Técnicos:**\n${project_data.technicalRequirements
        .map((req: string) => `- ${req}`)
        .join("\n")}\n\n`;
    }

    // Adicionar instrução para criar sistema de design
    projectDescription +=
      "Com base nas informações acima, crie um sistema de design completo e detalhado.";

    setInput(projectDescription.trim());
    setShowProjectsModal(false);

    toast.success("Projeto importado!", {
      description: `Dados de "${project.name}" foram importados com sucesso.`,
    });
  };

  const handleImportMarkdown = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".md,.markdown";
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();

        // Se houver texto no input, adicionar o conteúdo do MD ao contexto
        if (input.trim()) {
          const combinedText = `${input.trim()}\n\n---\n\n## Conteúdo Importado do Markdown\n\n${text}`;
          setInput(combinedText);
          toast.success("Markdown adicionado ao contexto!", {
            description:
              "O conteúdo foi adicionado ao que você já havia digitado.",
          });
        } else {
          // Se não houver texto no input, importar diretamente para o output (preview)
          setOutput(text);
          updateGeneratorState("designer", { output: text });
          toast.success("Markdown importado com sucesso!", {
            description: "Você pode modificá-lo ou usar a IA para ajustar.",
          });
        }
      } catch (error) {
        toast.error("Erro ao importar arquivo", {
          description: "Verifique se o arquivo é válido.",
        });
      }
    };
    fileInput.click();
  };

  const handleGenerate = async () => {
    if (!input.trim() && !importedDesignData) {
      toast.error("Descreva o seu UI/UX Designer ou importe um design", {
        description:
          "Por favor, descreva o seu UI/UX Designer ou importe um design de um site.",
      });
      return;
    }

    // Salvar input antes de iniciar geração
    updateGeneratorState("designer", { input });

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setModalOpen(true);
    setModalStatus("generating");
    setErrorMessage("");

    // Criar novo AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/generate/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          projectContext: projectData,
          importedDesignData: importedDesignData || undefined,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 402 &&
          errorData.code === "SUBSCRIPTION_REQUIRED"
        ) {
          throw new Error("SUBSCRIPTION_REQUIRED");
        }
        // Usar error ou details, o que estiver disponível
        const errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details ||
          "Erro ao gerar sistema de design";
        const error = new Error(errorMessage);
        (error as any).isRetryable = errorData.isRetryable || false;
        throw error;
      }

      const data = await response.json();

      // Atualizar output tanto no estado local quanto no contexto
      setOutput(data.content);
      updateGeneratorState("designer", { output: data.content });
      setModalStatus("completed");

      // Limpar dados de importação após gerar com sucesso
      if (importSource === "url") {
        setImportSource(null);
        setImportedDesignData(null);
        setUrl("");
        setUrlValidation(null);
      }

      toast.success("Sistema de design gerado com sucesso!");
    } catch (error: any) {
      // Ignorar erro se foi cancelado manualmente
      if (error.name === "AbortError") {
        setModalOpen(false);
        setLoading(false);
        abortControllerRef.current = null;
        return;
      }
      console.error(error);

      setModalStatus("error");
      if (error.message === "SUBSCRIPTION_REQUIRED") {
        setErrorMessage(
          "Assinatura necessária para usar a chave de IA do servidor. Configure sua própria chave nas configurações ou assine um plano."
        );
        toast.error("Assinatura necessária", {
          description:
            "Configure sua chave de API ou assine um plano para continuar.",
          action: {
            label: "Ver Planos",
            onClick: () => (window.location.href = "/subscription"),
          },
        });
      } else {
        const isRetryable =
          error.name === "RetryableError" || error.isRetryable;
        setErrorMessage(
          error.message || "Erro ao gerar sistema de design. Tente novamente."
        );
        toast.error("Erro ao gerar sistema de design", {
          description:
            error.message || "Tente novamente ou verifique sua conexão.",
          ...(isRetryable && {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleGenerate(),
            },
          }),
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copiado!", {
      description: "Sistema de design copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAIPrompt = () => {
    return `Você é um especialista em UI/UX e desenvolvedor experiente com conhecimento profundo em React, TypeScript, Tailwind CSS e componentes modernos de interface.

Analise o seguinte sistema de design completo e gere o código de implementação seguindo todas as especificações, padrões e diretrizes descritas:

${output}

INSTRUÇÕES PARA IMPLEMENTAÇÃO:

1. **Estrutura de Componentes:**
   - Crie componentes React/TypeScript reutilizáveis
   - Use Tailwind CSS conforme o sistema de design
   - Implemente variantes e estados conforme especificado
   - Siga os padrões de espaçamento e layout descritos

2. **Cores e Tokens:**
   - Implemente todas as cores da paleta usando variáveis CSS ou Tailwind
   - Use os tokens de cor exatamente como especificado
   - Mantenha contraste e acessibilidade (WCAG)

3. **Tipografia:**
   - Implemente a hierarquia tipográfica completa
   - Use as fontes especificadas
   - Aplique tamanhos, pesos e espaçamentos conforme o design system

4. **Componentes UI:**
   - Implemente todos os componentes descritos (botões, inputs, cards, etc.)
   - Inclua todos os estados (hover, active, disabled, error, success)
   - Siga os padrões de elevação, sombras e bordas

5. **Layout e Responsividade:**
   - Implemente o grid system descrito
   - Use os breakpoints especificados
   - Garanta responsividade em todos os dispositivos

6. **Animações e Transições:**
   - Implemente as animações e transições descritas
   - Use as durações e easing functions especificadas

7. **Acessibilidade:**
   - Implemente navegação por teclado
   - Adicione atributos ARIA quando necessário
   - Garanta contraste adequado

Gere código completo, funcional e pronto para uso, seguindo as melhores práticas de desenvolvimento e mantendo fidelidade total ao sistema de design fornecido.`;
  };

  const handleCopyPrompt = () => {
    const prompt = generateAIPrompt();
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    toast.success("Prompt copiado!", {
      description: "Prompt para IA copiado para a área de transferência.",
    });
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const projectName = projectData.projectName || "system-designer";
    a.download = formatDownloadFilename(`${projectName}_design_system`, "md");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!", {
      description: "O arquivo será salvo em breve.",
    });
  };

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${
      projectData.projectName || "system-designer"
    }-design-system`,
  });

  // Handler para evitar fechar modal durante geração
  const handleModalOpenChange = (open: boolean) => {
    // Não permitir fechar durante geração (dupla verificação: loading e status)
    if ((loading || modalStatus === "generating") && !open) {
      return;
    }
    setModalOpen(open);
  };

  return (
    <>
      <GenerationModalGeneric
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        status={modalStatus}
        errorMessage={errorMessage}
        title="Gerando Sistema de Design com IA"
        description="Aguarde enquanto geramos o sistema de design completo com teoria das cores, componentes e guias de estilo"
        warningMessage="⚠️ Não feche esta janela ou troque de aba até a geração ser concluída, pois isso pode cancelar o processo."
      />

      {/* Overlay para bloquear ações durante importação */}
      {importing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <Lottie
                animationData={aiThinkingAnimation}
                className="w-32 h-32"
                loop={true}
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analisando Design...</h3>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto extraímos os elementos de design do site. Esta
              operação pode levar alguns segundos.
            </p>
          </div>
        </div>
      )}

      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${
          importing ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Palette className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              Descreva o seu UI/UX Designer
            </CardTitle>
            <CardDescription>
              Descreva o tipo de aplicativo e contexto para criar um sistema de
              design personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Indicador de fonte selecionada */}
            {importSource && (
              <div
                className={`p-3 rounded-lg border-2 ${
                  importSource === "project"
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-400"
                    : "bg-green-50 dark:bg-green-950/20 border-green-500 dark:border-green-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {importSource === "project" ? (
                    <>
                      <FolderOpen
                        className={`h-5 w-5 ${
                          importSource === "project"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Importando de Projeto
                        </p>
                        {importedProjectName && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            Projeto: {importedProjectName}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-800">
                          Importando de URL
                        </p>
                        {url && (
                          <p className="text-xs text-green-700 dark:text-green-600 mt-0.5 truncate">
                            URL: {url}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImportSource(null);
                      setImportedProjectName(null);
                      setUrl("");
                      setImportedDesignData(null);
                      setInput("");
                      setUrlValidation(null);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Importar de Projeto Salvo (Opcional)
                </label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Importe a descrição e características de um projeto salvo para
                  criar o sistema de design
                </p>
                <Button
                  onClick={handleOpenProjectsModal}
                  variant={importSource === "project" ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${
                    importSource === "project"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : ""
                  }`}
                  disabled={importSource === "url"}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {importSource === "project"
                    ? "Alterar Projeto"
                    : "Importar de Projeto"}
                </Button>
              </div>
            </div>

            {importSource !== "project" && (
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Importar Design de um Site (Opcional)
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole a URL de um site e a IA analisará os elementos de
                    design para criar um sistema baseado nele
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://exemplo.com"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      // Limpar validação quando URL mudar
                      if (urlValidation) {
                        setUrlValidation(null);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        handleValidateUrl(e.target.value);
                      }
                    }}
                    className={`flex-1 ${
                      importSource === "url"
                        ? "border-green-500 dark:border-green-400 ring-2 ring-green-500/20"
                        : urlValidation &&
                          !urlValidation.valid &&
                          !urlValidation.loading
                        ? "border-red-500 dark:border-red-400 ring-2 ring-red-500/20"
                        : urlValidation && urlValidation.valid
                        ? "border-green-500 dark:border-green-400 ring-2 ring-green-500/20"
                        : ""
                    }`}
                    disabled={importing}
                  />
                  <Button
                    onClick={handleImportDesign}
                    disabled={importing || !url.trim()}
                    variant={importSource === "url" ? "default" : "outline"}
                    size="default"
                    className={`relative overflow-hidden ${
                      importSource === "url"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : ""
                    }`}
                  >
                    {importing ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <Lottie
                            animationData={aiThinkingAnimation}
                            className="w-12 h-12"
                            loop={true}
                          />
                        </div>
                        <span className="relative z-10 opacity-0">
                          Importar
                        </span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Importar
                      </>
                    )}
                  </Button>
                </div>
                {urlValidation && !importedDesignData && (
                  <div
                    className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${
                      urlValidation.loading
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-400"
                        : urlValidation.valid
                        ? "bg-green-400 dark:bg-green-600/85 border-green-700 dark:border-green-400"
                        : "bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-400"
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      {urlValidation.loading ? (
                        <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 animate-spin" />
                      ) : urlValidation.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-800 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        {urlValidation.loading ? (
                          <p className="text-xs text-muted-foreground">
                            <strong className="text-blue-900 dark:text-blue-100">
                              Validando URL...
                            </strong>
                          </p>
                        ) : urlValidation.valid ? (
                          <>
                            <p className="text-xs text-muted-foreground">
                              <strong className="text-green-900 dark:text-green-100">
                                URL válida
                              </strong>
                            </p>
                            {urlValidation.title && (
                              <p className="text-xs font-semibold text-green-900 dark:text-green-100 mt-1">
                                {urlValidation.title}
                              </p>
                            )}
                            {urlValidation.domain && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                {urlValidation.domain}
                              </p>
                            )}
                            {urlValidation.description && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
                                {urlValidation.description}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            <strong className="text-red-900 dark:text-red-100">
                              URL inválida
                            </strong>
                            {urlValidation.error && (
                              <span className="block text-red-700 dark:text-red-300 mt-0.5">
                                {urlValidation.error}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {!urlValidation.loading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => setUrlValidation(null)}
                        title="Fechar"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                {importedDesignData && (
                  <div className="p-3 bg-accent rounded-lg border border-border flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground">
                            Design importado com sucesso!
                          </strong>{" "}
                          Visualize os dados extraídos ou descreva modificações
                          abaixo.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => setShowDesignDataModal(true)}
                        title="Visualizar dados extraídos"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => {
                          setImportedDesignData(null);
                          setUrl("");
                          setImportSource(null);
                          setUrlValidation(null);
                          toast.info("Design importado removido");
                        }}
                        title="Remover design importado"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {importedDesignData
                  ? "Descreva modificações ou ajustes (opcional)"
                  : "Descreva o Sistema de Design UI/UX"}
              </label>
              <Textarea
                placeholder={
                  importedDesignData
                    ? "Exemplo: Ajuste as cores primárias para tons mais suaves, aumente o espaçamento entre elementos e adicione mais contraste nos botões..."
                    : "Exemplo: Preciso de um sistema de design para um aplicativo de saúde mental que seja acolhedor, calmo e inspire confiança. O público-alvo são pessoas que buscam apoio emocional..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || (!input.trim() && !importedDesignData)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Sistema...
                </>
              ) : (
                <>
                  <Palette className="mr-2 h-4 w-4" />
                  Gerar UI/UX Designer com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Sistema de Design Preview
                </CardTitle>
                <CardDescription>
                  Documento estruturado pronto para uso
                </CardDescription>
              </div>
              {!output && (
                <Button
                  onClick={handleImportMarkdown}
                  variant="outline"
                  size="sm"
                  title="Importar markdown existente"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar MD
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {output ? (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copiado!</span>
                        <span className="sm:hidden">OK</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleImportMarkdown}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    title="Importar markdown para modificar"
                  >
                    <Upload className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Importar MD</span>
                    <span className="sm:hidden">MD</span>
                  </Button>
                  <Button
                    onClick={handleDownloadMD}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Markdown</span>
                    <span className="sm:hidden">MD</span>
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    <FileDown className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                </div>
                {/* Conteúdo oculto para impressão/PDF */}
                <div className="hidden">
                  <div
                    ref={printRef}
                    className="p-8 bg-white prose prose-sm max-w-none print:prose-sm
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:text-pink-700 prose-h1:border-b-2 prose-h1:border-pink-500/30 prose-h1:pb-3
                    prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-rose-600 prose-h2:border-b prose-h2:border-rose-200 prose-h2:pb-2
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-pink-600
                    prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-rose-600
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-3
                    prose-strong:text-pink-700 prose-strong:font-bold
                    prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-700 prose-ul:my-4
                    prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-gray-700 prose-ol:my-4
                    prose-li:text-gray-700 prose-li:my-2 prose-li:marker:text-rose-500
                    prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-semibold
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
                    prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-pink-50 prose-blockquote:py-2 prose-blockquote:rounded-r
                    prose-hr:border-gray-300 prose-hr:my-8
                    prose-a:text-pink-600 prose-a:font-semibold prose-a:underline
                    prose-table:text-sm prose-th:bg-pink-100 prose-th:text-pink-900 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-200
                  "
                    style={{
                      padding: "32px",
                      backgroundColor: "white",
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {output}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Conteúdo visível na tela */}
                <div className="border border-border rounded-xl p-6 bg-card max-h-[600px] overflow-y-auto">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:scroll-mt-20
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-pink-500/30 prose-h1:text-pink-700 dark:prose-h1:text-pink-400
                  prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-rose-600 dark:prose-h2:text-rose-400 prose-h2:border-b prose-h2:border-rose-200 dark:prose-h2:border-rose-800 prose-h2:pb-2
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-pink-600 dark:prose-h3:text-pink-400
                  prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-rose-600 dark:prose-h4:text-rose-400
                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
                  prose-strong:text-pink-700 dark:prose-strong:text-pink-400 prose-strong:font-bold
                  prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ul:my-4
                  prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ol:my-4
                  prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-2 prose-li:marker:text-rose-500 dark:prose-li:marker:text-rose-400
                  prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-semibold
                  prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:bg-pink-50 dark:prose-blockquote:bg-pink-900/20 prose-blockquote:py-2 prose-blockquote:rounded-r
                  prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-8
                  prose-a:text-pink-600 dark:prose-a:text-pink-400 prose-a:font-semibold hover:prose-a:text-pink-800 dark:hover:prose-a:text-pink-300 prose-a:underline
                  prose-table:text-sm prose-th:bg-pink-100 dark:prose-th:bg-pink-900/30 prose-th:text-pink-900 dark:prose-th:text-pink-100 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700
                "
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {output}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Seção Prompt para AI */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      Prompt para AI
                    </h3>
                    <Button
                      onClick={handleCopyPrompt}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {promptCopied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            Copiar Prompt
                          </span>
                          <span className="sm:hidden">Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Copie este prompt e use em uma IA para gerar o código de
                    implementação baseado no sistema de design acima.
                  </p>
                  <div className="relative">
                    <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">
                      {generateAIPrompt()}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-border rounded-xl p-8 text-center text-muted-foreground bg-muted/50">
                O sistema de design aparecerá aqui após a geração
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para visualizar dados extraídos */}
      <Dialog open={showDesignDataModal} onOpenChange={setShowDesignDataModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Dados Extraídos do Design</DialogTitle>
            <DialogDescription>
              Análise estruturada dos elementos de design extraídos do site.
              Você pode aplicar diretamente ou fechar para fazer modificações.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div
              className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:scroll-mt-20
            prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-0 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border
            prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-foreground prose-h2:border-b prose-h2:border-border prose-h2:pb-1
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2
            prose-strong:text-foreground prose-strong:font-bold
            prose-ul:list-disc prose-ul:ml-6 prose-ul:text-muted-foreground prose-ul:my-3
            prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-muted-foreground prose-ol:my-3
            prose-li:text-muted-foreground prose-li:my-1
            prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:p-4
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:rounded-r
          "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {importedDesignData || ""}
              </ReactMarkdown>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDesignDataModal(false)}
            >
              Fechar e Modificar
            </Button>
            <Button onClick={handleApplyDirectly} disabled={applyingDirectly}>
              {applyingDirectly ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aplicar Diretamente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para selecionar projeto */}
      <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar de Projeto</DialogTitle>
            <DialogDescription>
              Selecione um projeto salvo para importar sua descrição e
              características
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {loadingProjects ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum projeto encontrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Você precisa ter pelo menos um projeto salvo para importar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleImportProject(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 truncate">
                            {project.name}
                          </h4>
                          {project.project_data?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {project.project_data.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportProject(project);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProjectsModal(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
