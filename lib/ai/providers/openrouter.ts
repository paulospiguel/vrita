import OpenAI from "openai"
import type { AIProviderInterface, AIGenerateOptions } from "../types"

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

  async generate(options: AIGenerateOptions): Promise<string> {
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

      return content
    } catch (error: any) {
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
          
          throw new Error(errorMessage)
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


