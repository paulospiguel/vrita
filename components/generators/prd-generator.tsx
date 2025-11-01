"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download } from "lucide-react"

export function PRDGenerator() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) {
      alert("Por favor, descreva sua ideia de aplicativo")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) throw new Error("Erro ao gerar PRD")

      const data = await response.json()
      setOutput(data.content)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar PRD. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    alert("PRD copiado para a ?rea de transfer?ncia!")
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prd-document.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Descreva sua Ideia
          </CardTitle>
          <CardDescription>
            Forne?a uma descri??o detalhada do aplicativo que deseja criar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Exemplo: Quero criar um aplicativo de gerenciamento de tarefas para equipes remotas que permite colabora??o em tempo real, com chat integrado, videoconfer?ncia e compartilhamento de arquivos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] resize-none"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {loading ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Gerando PRD...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar PRD com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>PRD Gerado</CardTitle>
          <CardDescription>
            Documento estruturado pronto para uso
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
              O PRD aparecer? aqui ap?s a gera??o
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
