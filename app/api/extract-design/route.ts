import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserAIConfig } from "@/lib/ai/config"
import { createAIProvider } from "@/lib/ai/factory"
import { canUseServerAIKey } from "@/lib/subscription/subscription"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
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

    // Criar provider de IA
    const provider = createAIProvider(aiConfig)

    // Extrair domínio para contexto
    const domain = new URL(url).hostname

    // Prompt para a IA extrair elementos de design do site
    const extractionPrompt = `Você é um especialista em análise de design de interfaces web com conhecimento profundo sobre padrões de design modernos e tendências de UI/UX.

Analise o design do site: ${url} (domínio: ${domain})

INSTRUÇÕES:
- Baseie-se no tipo de site, domínio e suas tendências conhecidas para inferir elementos de design
- Se for um site conhecido (ex: Airbnb, Stripe, GitHub, Notion, etc.), use seu conhecimento sobre o design deles
- Para sites desconhecidos, analise pelo contexto do domínio e tipo de negócio
- Seja específico e detalhado - forneça valores exatos quando possível

Extraia e documente os seguintes elementos de design de forma estruturada:

## 1. PALETA DE CORES
- Cores primárias (forneça valores hex/rgb)
- Cores secundárias
- Cores de destaque/accent
- Cores neutras (backgrounds, textos, bordas)
- Padrões de uso (onde cada cor é aplicada)
- Contraste e acessibilidade

## 2. TIPOGRAFIA
- Família de fontes (nomes específicos se conhecido, caso contrário estilo geral)
- Hierarquia tipográfica:
  * Tamanhos de heading (h1, h2, h3, etc.)
  * Tamanho de body text
  * Tamanhos para labels, captions, etc.
- Pesos de fonte utilizados (300, 400, 500, 600, 700, etc.)
- Espaçamento entre linhas (line-height)
- Letter-spacing quando relevante

## 3. ESPAÇAMENTO E LAYOUT
- Sistema de espaçamento (múltiplos de 4px, 8px, etc.)
- Grid system utilizado
- Margens e paddings padrão
- Breakpoints responsivos (mobile, tablet, desktop)
- Max-width de containers

## 4. COMPONENTES UI
- Botões:
  * Estilo (filled, outlined, ghost, etc.)
  * Tamanhos
  * Bordas (arredondadas, quadradas)
  * Sombras e efeitos hover
- Inputs e Formulários:
  * Estilo de campos
  * Labels e placeholders
  * Estados (focus, error, disabled)
- Cards e Containers:
  * Estilo de bordas
  * Sombras
  * Backgrounds
- Navegação:
  * Estilo de menu
  * Links e estados hover
- Outros componentes visíveis

## 5. ESTILO VISUAL GERAL
- Estilo geral (minimalista, moderno, clássico, bold, etc.)
- Bordas e border-radius padrão
- Sombras e profundidade (elevation)
- Efeitos visuais (gradientes, blur, etc.)
- Ícones (estilo, tamanhos)
- Imagens e tratamento de imagens

## 6. PSICOLOGIA VISUAL E PERSONALIDADE
- Sensação transmitida pelo design
- Personalidade da marca inferida
- Público-alvo provável
- Tom visual (profissional, casual, moderno, tradicional, etc.)

Retorne uma análise extremamente detalhada e estruturada que possa ser usada diretamente como base para criar um sistema de design completo. Seja o mais específico possível sobre valores, padrões e decisões de design.`

    const analysis = await provider.generate({ 
      prompt: extractionPrompt, 
      maxTokens: 4096 
    })

    return NextResponse.json({ 
      analysis,
      url 
    })
  } catch (error: any) {
    console.error("Erro ao extrair design:", error)
    
    const errorMessage = error.message || "Erro ao extrair design do site"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    )
  }
}

