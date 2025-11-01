"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download, Palette } from "lucide-react"

export function SystemDesignerGenerator() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) {
      alert("Por favor, descreva o sistema de design que deseja criar")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) throw new Error("Erro ao gerar sistema de design")

      const data = await response.json()
      setOutput(data.content)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar sistema de design. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    alert("Sistema de design copiado para a ?rea de transfer?ncia!")
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "system-designer.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
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
            placeholder="Exemplo: Preciso de um sistema de design para um aplicativo de sa?de mental que seja acolhedor, calmo e inspire confian?a. O p?blico-alvo s?o pessoas que buscam apoio emocional..."
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
          <CardTitle>Sistema de Design Gerado</CardTitle>
          <CardDescription>
            Guia completo de UI/UX com teoria das cores
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
              O sistema de design aparecer? aqui ap?s a gera??o
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
