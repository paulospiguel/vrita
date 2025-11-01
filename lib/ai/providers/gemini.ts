import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProviderInterface, AIGenerateOptions, AIGenerateResult } from "../types"

// Preços aproximados por 1M tokens (em USD) - atualizar conforme necessário
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash-exp": { input: 0.075, output: 0.30 },
  "gemini-2.0-flash-thinking-exp": { input: 0.075, output: 0.30 },
  "gemini-1.5-pro": { input: 1.25, output: 5.00 },
  "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  "gemini-2.5-flash": { input: 0.075, output: 0.30 },
  "gemini-1.5-flash-8b": { input: 0.0375, output: 0.15 },
}

function getGeminiPricing(modelName: string): { input: number; output: number } {
  return GEMINI_PRICING[modelName] || { input: 0.075, output: 0.30 } // Default para modelos não listados
}

export class GeminiProvider implements AIProviderInterface {
  private genAI: GoogleGenerativeAI
  private modelName: string

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.modelName = modelName
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    })

    const result = await model.generateContent(options.prompt)
    const response = await result.response
    
    // Obter informações de tokens da resposta
    const usageMetadata = (response as any).usageMetadata as {
      promptTokenCount?: number
      candidatesTokenCount?: number
      totalTokenCount?: number
    } | undefined
    const promptTokens = usageMetadata?.promptTokenCount || 0
    const completionTokens = usageMetadata?.candidatesTokenCount || (usageMetadata?.totalTokenCount ? 
      (usageMetadata.totalTokenCount - (usageMetadata.promptTokenCount || 0)) : 0)
    const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens)

    // Calcular custo estimado
    const pricing = getGeminiPricing(this.modelName)
    const costUsd = totalTokens > 0 
      ? ((promptTokens / 1_000_000) * pricing.input) + ((completionTokens / 1_000_000) * pricing.output)
      : undefined

    return {
      content: response.text(),
      tokensUsed: totalTokens,
      promptTokens,
      completionTokens,
      costUsd: costUsd ? Number(costUsd.toFixed(6)) : undefined,
    }
  }
}

