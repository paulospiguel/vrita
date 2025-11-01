"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Check, Sparkles, Crown, Rocket } from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan } from "@/lib/subscription/subscription"

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch("/api/subscription/plans")
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        }
      } catch (error) {
        console.error("Erro ao carregar planos:", error)
        toast.error("Erro ao carregar planos")
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  const handleSubscribe = async (planId: string) => {
    // TODO: Integrar com Stripe
    toast.info("Integração com Stripe em desenvolvimento", {
      description: "Em breve você poderá assinar diretamente aqui.",
    })
  }

  const getPrice = (plan: SubscriptionPlan) => {
    return billingPeriod === "yearly" && plan.priceYearly
      ? plan.priceYearly
      : plan.priceMonthly
  }

  const getPriceLabel = (plan: SubscriptionPlan) => {
    const price = getPrice(plan)
    return `R$ ${price.toFixed(2)}/${billingPeriod === "yearly" ? "ano" : "mês"}`
  }

  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Sparkles className="h-6 w-6 text-blue-600" />
      case 1:
        return <Crown className="h-6 w-6 text-purple-600" />
      case 2:
        return <Rocket className="h-6 w-6 text-pink-600" />
      default:
        return <Sparkles className="h-6 w-6" />
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Escolha seu Plano
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Use sua própria chave de IA gratuitamente ou assine para usar a chave do servidor
            </p>

            <div className="inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === "yearly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Anual
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">-17%</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando planos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`shadow-lg transition-all hover:shadow-xl ${
                    index === 1
                      ? "border-2 border-purple-500 scale-105"
                      : "border"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      {getIcon(index)}
                      {index === 1 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{getPriceLabel(plan)}</span>
                      {billingPeriod === "yearly" && plan.priceYearly && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Economia de R$ {((plan.priceMonthly * 12) - plan.priceYearly).toFixed(2)}/ano
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full ${
                        index === 1
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          : ""
                      }`}
                      variant={index === 1 ? "default" : "outline"}
                    >
                      Assinar Agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-12 max-w-3xl mx-auto">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">
                  💡 Como funciona?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    <strong>Gratuito:</strong> Configure sua própria chave de API nas configurações e use sem limites ou custos adicionais.
                  </li>
                  <li>
                    <strong>Assinatura:</strong> Use a chave de IA do servidor sem precisar configurar nada. Ideal para quem quer simplicidade.
                  </li>
                  <li>
                    <strong>Flexibilidade:</strong> Você pode alternar entre usar sua própria chave ou a do servidor a qualquer momento.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

