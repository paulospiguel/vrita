import OpenAI from "openai"
import type { AIProviderInterface, AIGenerateOptions, AIGenerateResult } from "../types"
import { RetryableError } from "../errors"

export class OpenRouterProvider implements AIProviderInterface {
  private client: OpenAI
  private modelName: string

  constructor(apiKey: string, modelName: string) {
    this.modelName = modelName
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "vRita AI PRD Generator",
      },
    })
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: options.prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      })

      if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error("Resposta inválida do OpenRouter:", completion)
        throw new Error("Resposta inválida da API OpenRouter. A resposta não contém o formato esperado.")
      }

      const content = completion.choices[0].message.content
      if (!content || typeof content !== "string") {
        throw new Error("A resposta da API não contém conteúdo válido.")
      }

      // Obter informações de tokens da resposta
      const usage = completion.usage
      const promptTokens = usage?.prompt_tokens || 0
      const completionTokens = usage?.completion_tokens || 0
      const totalTokens = usage?.total_tokens || (promptTokens + completionTokens)

      // Obter custo da resposta (OpenRouter retorna em headers ou no body)
      // O OpenRouter às vezes retorna o custo, mas como não está sempre disponível,
      // vamos calcular um estimativo baseado em preços médios conhecidos
      let costUsd: number | undefined
      if (totalTokens > 0) {
        // Tentar obter custo real da resposta se disponível
        // Nota: OpenRouter pode retornar custo em diferentes formatos
        const responseCost = (completion as any).usage?.cost
        if (responseCost !== undefined) {
          costUsd = Number(responseCost.toFixed(6))
        }
        // Se não houver custo na resposta, deixar undefined (pode ser calculado depois)
      }

      return {
        content,
        tokensUsed: totalTokens,
        promptTokens,
        completionTokens,
        costUsd,
      }
    } catch (error: any) {
      // Verificar se é um erro do tipo OpenAI (resposta com error no body)
      if (error?.error?.code || error?.error?.message) {
        const errorCode = error.error.code
        const errorMessage = error.error.message || "Erro desconhecido"
        const providerName = error.error.metadata?.provider_name || "provedor"
        
        console.error("OpenRouter API Error:", {
          code: errorCode,
          message: errorMessage,
          provider: providerName,
          model: this.modelName,
        })

        // Erro 502 - Bad Gateway (geralmente temporário, pode ser retentado)
        if (errorCode === 502) {
          throw new RetryableError(
            `Ocorreu um erro temporário ao processar sua solicitação. O provedor ${providerName} está enfrentando problemas técnicos. Por favor, tente novamente em alguns instantes.`,
            true
          )
        }

        // Outros erros de código
        throw new Error(`Erro na API OpenRouter (${providerName}): ${errorMessage}`)
      }

      // Tratamento de erros específicos da biblioteca OpenAI
      if (error?.status || error?.code) {
        const status = error.status
        const message = error.message || "Erro desconhecido"
        
        console.error("OpenRouter API Error:", {
          status,
          code: error.code,
          type: error.type,
          message,
          model: this.modelName,
          ...(status === 429 && {
            retryAfter: error.response?.headers?.get?.("retry-after") || 
                       error.response?.headers?.["retry-after"] || 
                       error.headers?.["retry-after"],
            isFreeModel: this.modelName.includes(":free")
          })
        })

        // Mensagens de erro mais específicas baseadas no status
        if (status === 401) {
          throw new Error("Chave de API do OpenRouter inválida ou não autorizada. Verifique suas credenciais.")
        } else if (status === 402) {
          throw new Error("Saldo insuficiente na conta do OpenRouter. Adicione créditos para continuar.")
        } else if (status === 404) {
          throw new Error(`Modelo "${this.modelName}" não encontrado no OpenRouter. Verifique se o ID do modelo está correto.`)
        } else if (status === 429) {
          // Erro 429 - Rate Limit
          const isFreeModel = this.modelName.includes(":free")
          
          // Tentar acessar Retry-After de diferentes formas
          let retryAfter: string | undefined
          if (error.response?.headers) {
            retryAfter = error.response.headers.get?.("retry-after") || 
                        error.response.headers["retry-after"] || 
                        error.response.headers["Retry-After"]
          } else if (error.headers) {
            retryAfter = error.headers["retry-after"] || error.headers["Retry-After"]
          }
          
          let errorMessage = "Limite de requisições excedido."
          
          if (isFreeModel) {
            errorMessage += " Modelos gratuitos têm limites mais restritivos. Considere usar um modelo pago ou aguarde alguns minutos antes de tentar novamente."
          } else {
            errorMessage += " Aguarde um momento e tente novamente."
          }
          
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10)
            if (!isNaN(seconds)) {
              const minutes = Math.ceil(seconds / 60)
              errorMessage += ` Aguarde aproximadamente ${minutes} minuto${minutes > 1 ? 's' : ''} antes de tentar novamente.`
            }
          }
          
          throw new RetryableError(errorMessage, true)
        } else if (status === 502 || status === 503) {
          // Erros 502/503 - Bad Gateway / Service Unavailable (geralmente temporários)
          throw new RetryableError(
            "O serviço de IA está temporariamente indisponível. Por favor, tente novamente em alguns instantes.",
            true
          )
        } else {
          throw new Error(`Erro na API OpenRouter: ${message}`)
        }
      }

      // Se já é um erro nosso (já formatado), apenas relançar
      if (error.message && error.message.startsWith("Erro")) {
        throw error
      }

      // Caso contrário, envolver em um erro mais claro
      throw new Error(`Erro ao comunicar com OpenRouter: ${error.message || "Erro desconhecido"}`)
    }
  }
}


