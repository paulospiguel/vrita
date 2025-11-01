"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download } from "lucide-react"

export function FeatureGenerator() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) {
      alert("Por favor, descreva a feature que deseja criar")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) throw new Error("Erro ao gerar descri??o")

      const data = await response.json()
      setOutput(data.content)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar descri??o. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    alert("Descri??o copiada para a ?rea de transfer?ncia!")
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
            placeholder="Exemplo: Preciso criar uma feature de notifica??es push que permite aos usu?rios receberem alertas em tempo real sobre atualiza??es importantes do projeto..."
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
                Gerando Descri??o...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Descri??o com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Descri??o Gerada</CardTitle>
          <CardDescription>
            Documenta??o completa da feature
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
              A descri??o aparecer? aqui ap?s a gera??o
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
