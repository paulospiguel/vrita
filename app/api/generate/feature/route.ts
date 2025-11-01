import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateFeatureDescriptionWithMetadata } from "@/lib/ai/generators"
import { getUserAIConfig } from "@/lib/ai/config"
import { canUseServerAIKey } from "@/lib/subscription/subscription"
import { saveAIUsageFromResult } from "@/lib/ai/usage-history"
import type { ProjectData } from "@/components/providers/project-context"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { input, projectContext } = await request.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Input é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário pode usar a chave do servidor
    const aiConfig = await getUserAIConfig(user.id)
    const hasUserApiKey = !!aiConfig.apiKey
    const canUseServerKey = await canUseServerAIKey(user.id, hasUserApiKey)

    if (!hasUserApiKey && !canUseServerKey) {
      return NextResponse.json(
        { 
          error: "Assinatura necessária",
          code: "SUBSCRIPTION_REQUIRED",
          message: "Para usar a chave de IA do servidor, você precisa de uma assinatura ativa. Configure sua própria chave de API nas configurações ou assine um plano."
        },
        { status: 402 }
      )
    }

    const { content, result, config } = await generateFeatureDescriptionWithMetadata(
      input, 
      user.id, 
      projectContext as ProjectData | undefined
    )

    // Salvar histórico de uso de AI
    await saveAIUsageFromResult(user.id, config.provider, config.model, "feature", result)

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("Erro ao gerar descrição:", error)
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error.message || "Erro ao gerar descrição"
    const isRetryable = error.name === "RetryableError" || error.isRetryable || false
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        isRetryable
      },
      { status: 500 }
    )
  }
}
