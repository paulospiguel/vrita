import type { AIModel } from "./types"

export const AVAILABLE_MODELS: AIModel[] = [
  // Gemini Models
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Modelo rápido e eficiente do Google",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash Experimental",
    provider: "gemini",
    description: "Versão experimental do Gemini Flash",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    description: "Modelo mais avançado do Google",
  },
  
  // OpenRouter Models - Claude
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    description: "Modelo mais avançado da Anthropic",
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "openrouter",
    description: "Modelo de alta performance da Anthropic",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "openrouter",
    description: "Modelo rápido e eficiente da Anthropic",
  },
  
  // OpenRouter Models - OpenAI
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    description: "Modelo mais avançado da OpenAI",
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openrouter",
    description: "Versão turbo do GPT-4",
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openrouter",
    description: "Modelo rápido e econômico da OpenAI",
  },
  
  // OpenRouter Models - Outros
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5 (via OpenRouter)",
    provider: "openrouter",
    description: "Gemini Pro através do OpenRouter",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "openrouter",
    description: "Modelo open-source da Meta",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "openrouter",
    description: "Modelo avançado da Mistral AI",
  },
]

export function getModelsByProvider(provider: "gemini" | "openrouter"): AIModel[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider)
}

export function getModelById(id: string): AIModel | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id)
}

