import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserSubscription, hasActiveSubscription } from "@/lib/subscription/subscription"
import { getUserAIConfig } from "@/lib/ai/config"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const subscription = await getUserSubscription(user.id)
    const isActive = await hasActiveSubscription(user.id)
    const aiConfig = await getUserAIConfig(user.id)
    const hasUserApiKey = !!aiConfig.apiKey

    return NextResponse.json({
      subscription,
      hasActiveSubscription: isActive,
      hasUserApiKey,
      canUseServerAIKey: hasUserApiKey || isActive,
    })
  } catch (error: any) {
    console.error("Erro ao obter status de assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao obter status de assinatura" },
      { status: 500 }
    )
  }
}

