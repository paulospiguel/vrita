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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { Sparkles, Copy, FileDown, FileText, CheckCircle2, Save } from "lucide-react";
import {
  useProject,
  type ProjectData,
} from "@/components/providers/project-context";
import { generatePRDTemplate } from "@/lib/prd-template";
import { extractProjectDataFromPRD } from "@/lib/prd-parser";
import { GenerationModal } from "@/components/ui/generation-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export function PRDGenerator() {
  const { projectData, currentProjectId, updateProjectData, setCurrentProjectId } = useProject();
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "generating" | "completed" | "error"
  >("generating");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Atualizar template em tempo real
  useEffect(() => {
    const template = generatePRDTemplate(projectData);
    setOutput(template);
  }, [projectData]);

  const handleGenerate = async () => {
    const hasMinimalData =
      projectData.projectName.trim() && projectData.description.trim();

    if (!hasMinimalData) {
      toast.error("Campos obrigatórios", {
        description: "Preencha pelo menos o nome do projeto e a descrição.",
      });
      return;
    }

    setModalOpen(true);
    setModalStatus("generating");
    setLoading(true);

    try {
      const response = await fetch("/api/generate/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 && errorData.code === "SUBSCRIPTION_REQUIRED") {
          throw new Error("SUBSCRIPTION_REQUIRED");
        }
        // Usar error ou details, o que estiver disponível
        const errorMessage = errorData.error || errorData.message || errorData.details || "Erro ao gerar PRD";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOutput(data.content);

      // Usar dados estruturados da resposta se disponível, senão tentar extrair
      let extractedData: Partial<ProjectData> = {};

      if (data.structuredData) {
        // Dados já estruturados vindos da IA
        extractedData = data.structuredData;
        console.log("Dados estruturados recebidos:", extractedData);
      } else {
        // Fallback: tentar extrair do markdown
        extractedData = extractProjectDataFromPRD(data.content);
        console.log("Dados extraídos do markdown:", extractedData);
      }

      if (Object.keys(extractedData).length > 0) {
        // Atualizar campos com os dados estruturados
        updateProjectData(extractedData);

        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          console.log("Campos atualizados:", extractedData);
        }, 100);
      }

      // Só mostrar "Finalizado" quando realmente receber os dados
      setModalStatus("completed");
    } catch (error: any) {
      console.error(error);
      setModalStatus("error");
      if (error.message === "SUBSCRIPTION_REQUIRED") {
        setErrorMessage("Assinatura necessária para usar a chave de IA do servidor. Configure sua própria chave nas configurações ou assine um plano.");
        toast.error("Assinatura necessária", {
          description: "Configure sua chave de API ou assine um plano para continuar.",
          action: {
            label: "Ver Planos",
            onClick: () => window.location.href = "/subscription"
          }
        });
      } else {
        setErrorMessage(error.message || "Erro ao gerar PRD. Tente novamente.");
        toast.error("Erro ao gerar PRD", {
          description: "Tente novamente ou verifique sua conexão.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copiado!", {
      description: "PRD copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectData.projectName || "prd"}-document.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${projectData.projectName || "prd"}-document`,
  });

  const handleSaveProject = async () => {
    // Verificar se há dados mínimos para salvar
    if (!projectData.projectName.trim()) {
      toast.error("Preencha pelo menos o nome do projeto");
      return;
    }

    setSaving(true);
    const isUpdate = !!currentProjectId;
    
    try {
      const url = isUpdate 
        ? "/api/projects" 
        : "/api/projects";
      
      const method = isUpdate ? "PUT" : "POST";
      
      const body = isUpdate
        ? {
            id: currentProjectId,
            name: projectData.projectName,
            projectData: projectData,
            prdContent: output || null,
          }
        : {
            name: projectData.projectName,
            projectData: projectData,
            prdContent: output || null,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Erro ao ${isUpdate ? "atualizar" : "salvar"} projeto`);

      const data = await response.json();
      
      // Se foi criação, salvar o ID do projeto criado
      if (!isUpdate && data.project?.id) {
        setCurrentProjectId(data.project.id);
      }
      
      toast.success(isUpdate ? "Projeto atualizado com sucesso!" : "Projeto salvo com sucesso!", {
        description: `"${projectData.projectName}" foi ${isUpdate ? "atualizado" : "salvo"} corretamente.`,
      });
      console.log(isUpdate ? "Projeto atualizado:" : "Projeto salvo:", data.project);
    } catch (error) {
      console.error(error);
      toast.error(`Erro ao ${isUpdate ? "atualizar" : "salvar"} projeto`, {
        description: "Tente novamente ou verifique sua conexão.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Verificar se há dados preenchidos
  const hasDataToSave =
    projectData.projectName.trim() ||
    projectData.description.trim() ||
    projectData.vision.trim() ||
    projectData.objectives.trim() ||
    projectData.strategy.trim() ||
    projectData.targetAudience.trim() ||
    projectData.features.trim() ||
    projectData.technicalRequirements.length > 0 ||
    projectData.designSystem.trim();

  // Carregar projeto salvo do localStorage se existir
  useEffect(() => {
    const savedProject = localStorage.getItem("selectedProject");
    const savedProjectId = localStorage.getItem("selectedProjectId");
    
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        updateProjectData(parsed);
        
        // Carregar ID do projeto se existir
        if (savedProjectId) {
          setCurrentProjectId(savedProjectId);
        }
        
        localStorage.removeItem("selectedProject"); // Limpar após carregar
        localStorage.removeItem("selectedProjectId"); // Limpar após carregar
      } catch (error) {
        console.error("Erro ao carregar projeto salvo:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GenerationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        status={modalStatus}
        errorMessage={errorMessage}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Informações do Projeto
            </CardTitle>
            <CardDescription>
              Preencha as seções abaixo ou apenas nome e descrição para gerar
              com IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="vision" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="vision">Visão Geral</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="vision" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nome do Projeto *</Label>
                  <Input
                    id="projectName"
                    placeholder="Ex: App de Gerenciamento de Tarefas"
                    value={projectData.projectName}
                    onChange={(e) =>
                      updateProjectData({ projectName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva brevemente o que seu aplicativo faz..."
                    value={projectData.description}
                    onChange={(e) =>
                      updateProjectData({ description: e.target.value })
                    }
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision">Visão Geral do Projeto</Label>
                  <Textarea
                    id="vision"
                    placeholder="Qual é a visão geral do projeto? O que ele pretende alcançar?"
                    value={projectData.vision}
                    onChange={(e) =>
                      updateProjectData({ vision: e.target.value })
                    }
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos & Estratégia</Label>
                  <Textarea
                    id="objectives"
                    placeholder="Quais são os principais objetivos do projeto?"
                    value={projectData.objectives}
                    onChange={(e) =>
                      updateProjectData({ objectives: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy">Estratégia</Label>
                  <Textarea
                    id="strategy"
                    placeholder="Qual estratégia será utilizada para alcançar os objetivos?"
                    value={projectData.strategy}
                    onChange={(e) =>
                      updateProjectData({ strategy: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">
                    Público-Alvo & Features
                  </Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Quem é o público-alvo? Quais características principais?"
                    value={projectData.targetAudience}
                    onChange={(e) =>
                      updateProjectData({ targetAudience: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Features Principais</Label>
                  <Textarea
                    id="features"
                    placeholder="Liste as principais funcionalidades que o app terá..."
                    value={projectData.features}
                    onChange={(e) =>
                      updateProjectData({ features: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technicalRequirements">
                    Requisitos Técnicos
                  </Label>
                  <TagsInput
                    tags={projectData.technicalRequirements}
                    onChange={(tags) =>
                      updateProjectData({ technicalRequirements: tags })
                    }
                    placeholder="Digite um requisito técnico e pressione Enter (ex: Next.js, TypeScript, Supabase...)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adicione tags para requisitos técnicos como tecnologias,
                    frameworks, bibliotecas, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designSystem">Design System</Label>
                  <Textarea
                    id="designSystem"
                    placeholder="Requisitos de design, cores, tipografia, componentes..."
                    value={projectData.designSystem}
                    onChange={(e) =>
                      updateProjectData({ designSystem: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSaveProject}
                disabled={saving || !hasDataToSave}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Save className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {saving 
                    ? (currentProjectId ? "Atualizando..." : "Salvando...") 
                    : (currentProjectId ? "Atualizar Projeto" : "Salvar Projeto")}
                </span>
                <span className="sm:hidden">
                  {saving ? (currentProjectId ? "Atualizando..." : "Salvando...") : "Salvar"}
                </span>
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  loading ||
                  !projectData.projectName.trim() ||
                  !projectData.description.trim()
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Gerar PRD com IA</span>
                <span className="sm:hidden">Gerar PRD</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PRD Preview
            </CardTitle>
            <CardDescription>
              Documento estruturado pronto para uso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {output ? (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 sm:flex-initial">
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
                    onClick={handleDownloadMD}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Markdown</span>
                    <span className="sm:hidden">MD</span>
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex-1 sm:flex-initial">
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
                      prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:text-blue-700 prose-h1:border-b-2 prose-h1:border-blue-500/30 prose-h1:pb-3
                      prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-purple-600 prose-h2:border-b prose-h2:border-purple-200 prose-h2:pb-2
                      prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-blue-600
                      prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-indigo-600
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-3
                      prose-strong:text-blue-700 prose-strong:font-bold
                      prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-700 prose-ul:my-4
                      prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-gray-700 prose-ol:my-4
                      prose-li:text-gray-700 prose-li:my-2 prose-li:marker:text-purple-500
                      prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-semibold
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
                      prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:rounded-r
                      prose-hr:border-gray-300 prose-hr:my-8
                      prose-a:text-blue-600 prose-a:font-semibold prose-a:underline
                      prose-table:text-sm prose-th:bg-blue-100 prose-th:text-blue-900 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-200
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
                <div className="border rounded-lg p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 max-h-[600px] overflow-y-auto shadow-inner">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:scroll-mt-20
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-blue-500/30 prose-h1:text-blue-700 dark:prose-h1:text-blue-400
                    prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-purple-600 dark:prose-h2:text-purple-400 prose-h2:border-b prose-h2:border-purple-200 dark:prose-h2:border-purple-800 prose-h2:pb-2
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-blue-600 dark:prose-h3:text-blue-400
                    prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-indigo-600 dark:prose-h4:text-indigo-400
                    prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
                    prose-strong:text-blue-700 dark:prose-strong:text-blue-400 prose-strong:font-bold
                    prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ul:my-4
                    prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ol:my-4
                    prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-2 prose-li:marker:text-purple-500 dark:prose-li:marker:text-purple-400
                    prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-semibold
                    prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:rounded-r
                    prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-8
                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-semibold hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300 prose-a:underline
                    prose-table:text-sm prose-th:bg-blue-100 dark:prose-th:bg-blue-900/30 prose-th:text-blue-900 dark:prose-th:text-blue-100 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700
                  "
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {output}
                    </ReactMarkdown>
                  </div>
                </div>
              </>
            ) : (
              <div className="border rounded-md p-8 text-center text-gray-400 dark:text-gray-600">
                O PRD aparecerá aqui após preencher as informações
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
