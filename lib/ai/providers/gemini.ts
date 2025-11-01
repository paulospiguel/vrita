import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProviderInterface, AIGenerateOptions } from "../types"

export class GeminiProvider implements AIProviderInterface {
  private genAI: GoogleGenerativeAI
  private modelName: string

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.modelName = modelName
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    })

    const result = await model.generateContent(options.prompt)
    const response = await result.response
    return response.text()
  }
}

