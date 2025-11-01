"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download } from "lucide-react"
import { useProject } from "@/components/providers/project-context"
import { useGeneration } from "@/components/providers/generation-context"
import { GenerationModalGeneric } from "@/components/ui/generation-modal-generic"
import { toast } from "sonner"

export function FeatureGenerator() {
  const { projectData } = useProject()
  const { activeGenerator, generatorStates, updateGeneratorState } = useGeneration()
  const [input, setInput] = useState(() => generatorStates.feature.input)
  const [output, setOutput] = useState(() => generatorStates.feature.output)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<"generating" | "completed" | "error">("generating")
  const [errorMessage, setErrorMessage] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const isActiveRef = useRef(false)

  // Atualizar ref quando activeGenerator mudar
  useEffect(() => {
    isActiveRef.current = activeGenerator === "feature"
    
    if (!isActiveRef.current && loading) {
      // Forçar reset imediato quando não está ativo
      setLoading(false)
      // Cancelar requisição em andamento se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      // Fechar modal se estiver aberto
      if (modalOpen) {
        setModalOpen(false)
      }
    }
  }, [activeGenerator, loading, modalOpen])

  // Sincronizar estado local com contexto quando voltar para a aba
  useEffect(() => {
    if (activeGenerator === "feature") {
      // Só atualizar se os valores forem diferentes para evitar loops
      if (input !== generatorStates.feature.input) {
        setInput(generatorStates.feature.input)
      }
      if (output !== generatorStates.feature.output) {
        setOutput(generatorStates.feature.output)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenerator])

  // Salvar input no contexto quando mudar (debounce para evitar muitas atualizações)
  useEffect(() => {
    if (activeGenerator === "feature") {
      const timeoutId = setTimeout(() => {
        updateGeneratorState("feature", { input })
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [input, activeGenerator, updateGeneratorState])

  // Salvar output no contexto quando mudar
  useEffect(() => {
    if (activeGenerator === "feature") {
      updateGeneratorState("feature", { output })
    }
  }, [output, activeGenerator, updateGeneratorState])

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error("Descreva a feature", {
        description: "Por favor, descreva a feature que deseja criar.",
      })
      return
    }

    // Verificar se ainda está na aba correta antes de iniciar
    if (activeGenerator !== "feature") {
      return
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setLoading(true)
    setModalOpen(true)
    setModalStatus("generating")
    
    // Criar novo AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch("/api/generate/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input,
          projectContext: projectData 
        }),
        signal: abortController.signal,
      })

      // Verificar novamente se ainda está na aba correta usando ref
      if (!isActiveRef.current) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 402 && errorData.code === "SUBSCRIPTION_REQUIRED") {
          throw new Error("SUBSCRIPTION_REQUIRED")
        }
        // Usar error ou details, o que estiver disponível
        const errorMessage = errorData.error || errorData.message || errorData.details || "Erro ao gerar descrição"
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Verificar uma última vez antes de atualizar UI
      if (!isActiveRef.current) {
        return
      }
      
      setOutput(data.content)
      updateGeneratorState("feature", { output: data.content })
      setModalStatus("completed")
      toast.success("Descrição gerada com sucesso!")
    } catch (error: any) {
      // Ignorar erro se foi cancelado por mudança de aba
      if (error.name === "AbortError" || !isActiveRef.current) {
        setModalOpen(false)
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
        setErrorMessage(error.message || "Erro ao gerar descrição. Tente novamente.")
        toast.error("Erro ao gerar descrição", {
          description: "Tente novamente ou verifique sua conexão.",
        })
      }
    } finally {
      // Só atualizar loading se ainda estiver na aba correta
      if (isActiveRef.current) {
        setLoading(false)
        abortControllerRef.current = null
      }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copiado!", {
      description: "Descrição copiada para a área de transferência.",
    })
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "feature-description.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <GenerationModalGeneric
        open={modalOpen}
        onOpenChange={setModalOpen}
        status={modalStatus}
        errorMessage={errorMessage}
        title="Gerando Descrição com IA"
        description="Aguarde enquanto geramos a descrição completa da feature"
        warningMessage="Não feche esta janela ou troque de aba até a geração ser concluída, pois isso pode cancelar o processo."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Descreva a Feature
          </CardTitle>
          <CardDescription>
            Descreva a funcionalidade que deseja documentar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Exemplo: Preciso criar uma feature de notificações push que permite aos usuários receberem alertas em tempo real sobre atualizações importantes do projeto..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] resize-none"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {loading ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Gerando Descrição...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Descrição com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Descrição Gerada</CardTitle>
          <CardDescription>
            Documentação completa da feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {output ? (
            <>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 max-h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {output}
                </pre>
              </div>
            </>
          ) : (
            <div className="border rounded-md p-8 text-center text-gray-400 dark:text-gray-600">
              A descrição aparecerá aqui após a geração
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
