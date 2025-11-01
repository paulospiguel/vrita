import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserAIConfig, saveUserAIConfig } from "@/lib/ai/config"
import { getModelById } from "@/lib/ai/models"
import { getUserCustomModels } from "@/lib/ai/custom-models"
import type { AIProvider } from "@/lib/ai/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const config = await getUserAIConfig(user.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error("Erro ao obter configuração de IA:", error)
    return NextResponse.json(
      { error: "Erro ao obter configuração de IA" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { provider, model, apiKey } = await request.json()

    // Validações
    if (!provider || !["gemini", "openrouter"].includes(provider)) {
      return NextResponse.json(
        { error: "Provedor inválido" },
        { status: 400 }
      )
    }

    if (!model || typeof model !== "string") {
      return NextResponse.json(
        { error: "Modelo é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o modelo existe (pode ser padrão ou personalizado)
    const modelInfo = getModelById(model)
    const customModels = await getUserCustomModels(user.id)
    const customModel = customModels.find(m => m.modelId === model)

    // Se não é modelo padrão, verificar se é personalizado
    if (!modelInfo && !customModel) {
      return NextResponse.json(
        { error: "Modelo não encontrado. Adicione como modelo personalizado se necessário." },
        { status: 400 }
      )
    }

    // Verificar se o provedor corresponde
    const modelProvider = modelInfo?.provider || customModel?.provider
    if (modelProvider !== provider) {
      return NextResponse.json(
        { error: "Modelo não pertence ao provedor selecionado" },
        { status: 400 }
      )
    }

    // Salvar configuração
    await saveUserAIConfig(user.id, {
      provider: provider as AIProvider,
      model,
      apiKey: apiKey || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao salvar configuração de IA:", error)
    return NextResponse.json(
      { error: "Erro ao salvar configuração de IA" },
      { status: 500 }
    )
  }
}

