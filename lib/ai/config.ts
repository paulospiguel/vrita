import { createClient } from "@/lib/supabase/server"
import type { AIConfig } from "./types"
import { getModelById } from "./models"
import { getUserCustomModels } from "./custom-models"

const DEFAULT_CONFIG: AIConfig = {
  provider: "gemini",
  model: "gemini-2.5-flash",
}

export async function getUserAIConfig(userId: string): Promise<AIConfig> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("ai_config")
      .select("provider, model, api_key")
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      // Retornar configuração padrão se não houver configuração salva
      return DEFAULT_CONFIG
    }

    // Validar se o modelo ainda existe (pode ser um modelo padrão ou personalizado)
    const model = getModelById(data.model)
    const customModels = await getUserCustomModels(userId)
    const isCustomModel = customModels.some(m => m.modelId === data.model)
    
    // Se não é um modelo padrão nem personalizado, usar padrão
    if (!model && !isCustomModel) {
      return DEFAULT_CONFIG
    }

    return {
      provider: data.provider as "gemini" | "openrouter",
      model: data.model,
      apiKey: data.api_key || undefined,
    }
  } catch (error) {
    console.error("Erro ao obter configuração de IA:", error)
    return DEFAULT_CONFIG
  }
}

export async function saveUserAIConfig(
  userId: string,
  config: Omit<AIConfig, "apiKey"> & { apiKey?: string }
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("ai_config")
      .upsert({
        user_id: userId,
        provider: config.provider,
        model: config.model,
        api_key: config.apiKey || null,
      }, {
        onConflict: "user_id",
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Erro ao salvar configuração de IA:", error)
    throw error
  }
}

