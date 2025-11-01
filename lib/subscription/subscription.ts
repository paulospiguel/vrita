import { createClient } from "@/lib/supabase/server"

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "trialing" | null

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  priceYearly?: number
  features: string[]
  isActive: boolean
}

/**
 * Verifica se o usuário tem uma assinatura ativa
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (error || !data) {
      return false
    }

    // Verificar se o período ainda é válido
    if (data.current_period_end) {
      const periodEnd = new Date(data.current_period_end)
      if (periodEnd < new Date()) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)
    return false
  }
}

/**
 * Obtém a assinatura do usuário
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      status: data.status,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
      cancelAtPeriodEnd: data.cancel_at_period_end,
    }
  } catch (error) {
    console.error("Erro ao obter assinatura:", error)
    return null
  }
}

/**
 * Verifica se o usuário pode usar a chave de IA do servidor
 * Retorna true se:
 * - O usuário tem sua própria chave de API configurada, OU
 * - O usuário tem uma assinatura ativa
 */
export async function canUseServerAIKey(userId: string, hasUserApiKey: boolean): Promise<boolean> {
  // Se o usuário tem sua própria chave, pode usar
  if (hasUserApiKey) {
    return true
  }

  // Se não tem chave própria, precisa de assinatura ativa
  return await hasActiveSubscription(userId)
}

/**
 * Obtém todos os planos disponíveis
 */
export async function getAvailablePlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: parseFloat(plan.price_monthly),
      priceYearly: plan.price_yearly ? parseFloat(plan.price_yearly) : undefined,
      features: plan.features || [],
      isActive: plan.is_active,
    }))
  } catch (error) {
    console.error("Erro ao obter planos:", error)
    return []
  }
}

