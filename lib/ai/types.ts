export type AIProvider = "gemini" | "openrouter"

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description?: string
}

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey?: string
}

export interface AIGenerateOptions {
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface AIProviderInterface {
  generate(options: AIGenerateOptions): Promise<string>
}

