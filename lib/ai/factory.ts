import type { AIConfig, AIProviderInterface } from "./types"
import { GeminiProvider } from "./providers/gemini"
import { OpenRouterProvider } from "./providers/openrouter"

export function createAIProvider(config: AIConfig): AIProviderInterface {
  const apiKey = config.apiKey || getDefaultApiKey(config.provider)

  switch (config.provider) {
    case "gemini":
      return new GeminiProvider(apiKey, config.model)
    case "openrouter":
      return new OpenRouterProvider(apiKey, config.model)
    default:
      throw new Error(`Provedor não suportado: ${config.provider}`)
  }
}

function getDefaultApiKey(provider: "gemini" | "openrouter"): string {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY || ""
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || ""
    default:
      return ""
  }
}

