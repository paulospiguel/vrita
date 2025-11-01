import { createClient } from "@/lib/supabase/server"
import type { AIProvider, AIGenerateResult } from "./types"

export type AIEndpoint = "prd" | "designer" | "feature" | "extract-design"

export interface AIUsageHistoryEntry {
  userId: string
  provider: AIProvider
  model: string
  tokensUsed?: number
  promptTokens?: number
  completionTokens?: number
  endpoint: AIEndpoint
  costUsd?: number
}

/**
 * Salva uma entrada no histórico de uso de AI
 */
export async function saveAIUsageHistory(entry: AIUsageHistoryEntry): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("ai_usage_history")
      .insert({
        user_id: entry.userId,
        provider: entry.provider,
        model: entry.model,
        tokens_used: entry.tokensUsed || null,
        prompt_tokens: entry.promptTokens || null,
        completion_tokens: entry.completionTokens || null,
        endpoint: entry.endpoint,
        cost_usd: entry.costUsd || null,
      })

    if (error) {
      console.error("Erro ao salvar histórico de uso de AI:", error)
      // Não lançar erro para não quebrar o fluxo principal
      // Apenas logar o erro
    }
  } catch (error) {
    console.error("Erro ao salvar histórico de uso de AI:", error)
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Salva histórico de uso de AI a partir do resultado de uma geração
 */
export async function saveAIUsageFromResult(
  userId: string,
  provider: AIProvider,
  model: string,
  endpoint: AIEndpoint,
  result: AIGenerateResult
): Promise<void> {
  await saveAIUsageHistory({
    userId,
    provider,
    model,
    tokensUsed: result.tokensUsed,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    endpoint,
    costUsd: result.costUsd,
  })
}

