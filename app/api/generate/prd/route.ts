import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generatePRD } from "@/lib/ai/generators"
import { getUserAIConfig } from "@/lib/ai/config"
import { canUseServerAIKey } from "@/lib/subscription/subscription"
import type { ProjectData } from "@/components/providers/project-context"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { projectData } = await request.json()

    if (!projectData || typeof projectData !== "object") {
      return NextResponse.json(
        { error: "Dados do projeto são obrigatórios" },
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

    const response = await generatePRD(projectData as ProjectData, user.id)
    
    // Tentar parsear como JSON
    let content: string
    let structuredData: Partial<ProjectData> | null = null
    
    try {
      const parsed = JSON.parse(response)
      if (parsed.prdMarkdown && parsed.projectData) {
        content = parsed.prdMarkdown
        structuredData = parsed.projectData
      } else {
        content = response
      }
    } catch {
      // Se não for JSON, usar resposta original
      content = response
    }

    return NextResponse.json({ 
      content,
      structuredData: structuredData || null
    })
  } catch (error: any) {
    console.error("Erro ao gerar PRD:", error)
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error.message || "Erro ao gerar PRD"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    )
  }
}
