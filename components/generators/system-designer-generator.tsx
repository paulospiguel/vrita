"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, FileDown, FileText, CheckCircle2, Palette } from "lucide-react"
import { useProject } from "@/components/providers/project-context"
import { useGeneration } from "@/components/providers/generation-context"
import { GenerationModalGeneric } from "@/components/ui/generation-modal-generic"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"

export function SystemDesignerGenerator() {
  const { projectData } = useProject()
  const { activeGenerator, generatorStates, updateGeneratorState } = useGeneration()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<"generating" | "completed" | "error">("generating")
  const [errorMessage, setErrorMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const previousActiveGeneratorRef = useRef<typeof activeGenerator>(null)
  const isRestoringRef = useRef(false)
  const lastContextInputRef = useRef("")
  const lastContextOutputRef = useRef("")
  const printRef = useRef<HTMLDivElement>(null)

  // Inicializar estado do contexto apenas quando a aba se torna ativa
  useEffect(() => {
    const wasOtherTab = previousActiveGeneratorRef.current !== "designer"
    const isNowDesigner = activeGenerator === "designer"
    
    // Só restaurar quando mudar de outra aba para designer
    if (isNowDesigner && wasOtherTab) {
      isRestoringRef.current = true
      // Acessar valores do contexto diretamente sem incluí-los nas dependências
      const contextInput = generatorStates.designer.input || ""
      const contextOutput = generatorStates.designer.output || ""
      
      setInput(contextInput)
      setOutput(contextOutput)
      
      // Atualizar refs para evitar salvamento desnecessário
      lastContextInputRef.current = contextInput
      lastContextOutputRef.current = contextOutput
      
      // Resetar flag após atualização
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
    
    previousActiveGeneratorRef.current = activeGenerator
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenerator])

  // Salvar input no contexto quando o usuário digitar (debounce)
  useEffect(() => {
    // Não salvar se estamos restaurando do contexto
    if (isRestoringRef.current) {
      return
    }
    
    // Não salvar se não estamos na aba designer
    if (activeGenerator !== "designer") {
      return
    }
    
    // Não salvar se o valor não mudou desde a última vez
    if (input === lastContextInputRef.current) {
      return
    }
    
    const timeoutId = setTimeout(() => {
      // Verificar novamente antes de salvar
      if (!isRestoringRef.current && activeGenerator === "designer" && input !== lastContextInputRef.current) {
        lastContextInputRef.current = input
        updateGeneratorState("designer", { input })
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [input, activeGenerator, updateGeneratorState])

  // Salvar output no contexto quando mudar
  useEffect(() => {
    // Não salvar se estamos restaurando do contexto
    if (isRestoringRef.current) {
      return
    }
    
    // Não salvar se não estamos na aba designer ou se output está vazio
    if (activeGenerator !== "designer" || !output) {
      return
    }
    
    // Não salvar se o valor não mudou desde a última vez
    if (output === lastContextOutputRef.current) {
      return
    }
    
    lastContextOutputRef.current = output
    updateGeneratorState("designer", { output })
  }, [output, activeGenerator, updateGeneratorState])

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error("Descreva o sistema de design", {
        description: "Por favor, descreva o sistema de design que deseja criar.",
      })
      return
    }

    // Salvar input antes de iniciar geração
    updateGeneratorState("designer", { input })

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setLoading(true)
    setModalOpen(true)
    setModalStatus("generating")
    setErrorMessage("")
    
    // Criar novo AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch("/api/generate/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input,
          projectContext: projectData 
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 402 && errorData.code === "SUBSCRIPTION_REQUIRED") {
          throw new Error("SUBSCRIPTION_REQUIRED")
        }
        // Usar error ou details, o que estiver disponível
        const errorMessage = errorData.error || errorData.message || errorData.details || "Erro ao gerar sistema de design"
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Atualizar output tanto no estado local quanto no contexto
      setOutput(data.content)
      updateGeneratorState("designer", { output: data.content })
      setModalStatus("completed")
      toast.success("Sistema de design gerado com sucesso!")
    } catch (error: any) {
      // Ignorar erro se foi cancelado manualmente
      if (error.name === "AbortError") {
        setModalOpen(false)
        setLoading(false)
        abortControllerRef.current = null
        return
      }
      console.error(error)
      
      setModalStatus("error")
      if (error.message === "SUBSCRIPTION_REQUIRED") {
        setErrorMessage("Assinatura necessária para usar a chave de IA do servidor. Configure sua própria chave nas configurações ou assine um plano.")
        toast.error("Assinatura necessária", {
          description: "Configure sua chave de API ou assine um plano para continuar.",
          action: {
            label: "Ver Planos",
            onClick: () => window.location.href = "/subscription"
          }
        })
      } else {
        setErrorMessage(error.message || "Erro ao gerar sistema de design. Tente novamente.")
        toast.error("Erro ao gerar sistema de design", {
          description: "Tente novamente ou verifique sua conexão.",
        })
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copiado!", {
      description: "Sistema de design copiado para a área de transferência.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMD = () => {
    const blob = new Blob([output], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const projectName = projectData.projectName || "system-designer"
    a.download = `${projectName}-design-system.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${projectData.projectName || "system-designer"}-design-system`,
  })

  // Handler para evitar fechar modal durante geração
  const handleModalOpenChange = (open: boolean) => {
    // Não permitir fechar durante geração (dupla verificação: loading e status)
    if ((loading || modalStatus === "generating") && !open) {
      return
    }
    setModalOpen(open)
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-600" />
            Descreva o Sistema de Design
          </CardTitle>
          <CardDescription>
            Descreva o tipo de aplicativo e contexto para criar um sistema de design personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Exemplo: Preciso de um sistema de design para um aplicativo de saúde mental que seja acolhedor, calmo e inspire confiança. O público-alvo são pessoas que buscam apoio emocional..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] resize-none"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
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
                Gerar System Designer com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Sistema de Design Preview
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
              <div className="border rounded-lg p-6 bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-gray-900 dark:via-pink-900/10 dark:to-rose-900/10 max-h-[600px] overflow-y-auto shadow-inner">
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
            </>
          ) : (
            <div className="border rounded-md p-8 text-center text-gray-400 dark:text-gray-600">
              O sistema de design aparecerá aqui após a geração
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
