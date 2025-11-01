import { createClient } from "@/lib/supabase/server"
import type { AIProvider } from "./types"

export interface CustomAIModel {
  id: string
  userId: string
  name: string
  modelId: string
  provider: AIProvider
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Obtém todos os modelos personalizados do usuário
 */
export async function getUserCustomModels(userId: string): Promise<CustomAIModel[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("custom_ai_models")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((model) => ({
      id: model.id,
      userId: model.user_id,
      name: model.name,
      modelId: model.model_id,
      provider: model.provider as AIProvider,
      description: model.description,
      isActive: model.is_active,
      createdAt: new Date(model.created_at),
      updatedAt: new Date(model.updated_at),
    }))
  } catch (error) {
    console.error("Erro ao obter modelos personalizados:", error)
    return []
  }
}

/**
 * Cria um novo modelo personalizado
 */
export async function createCustomModel(
  userId: string,
  data: {
    name: string
    modelId: string
    provider: AIProvider
    description?: string
  }
): Promise<CustomAIModel> {
  try {
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from("custom_ai_models")
      .insert({
        user_id: userId,
        name: data.name,
        model_id: data.modelId,
        provider: data.provider,
        description: data.description || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: result.id,
      userId: result.user_id,
      name: result.name,
      modelId: result.model_id,
      provider: result.provider as AIProvider,
      description: result.description,
      isActive: result.is_active,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    }
  } catch (error) {
    console.error("Erro ao criar modelo personalizado:", error)
    throw error
  }
}

/**
 * Atualiza um modelo personalizado
 */
export async function updateCustomModel(
  userId: string,
  modelId: string,
  data: {
    name?: string
    modelId?: string
    provider?: AIProvider
    description?: string
    isActive?: boolean
  }
): Promise<void> {
  try {
    const supabase = await createClient()

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.modelId !== undefined) updateData.model_id = data.modelId
    if (data.provider !== undefined) updateData.provider = data.provider
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { error } = await supabase
      .from("custom_ai_models")
      .update(updateData)
      .eq("id", modelId)
      .eq("user_id", userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Erro ao atualizar modelo personalizado:", error)
    throw error
  }
}

/**
 * Remove um modelo personalizado (soft delete)
 */
export async function deleteCustomModel(userId: string, modelId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("custom_ai_models")
      .update({ is_active: false })
      .eq("id", modelId)
      .eq("user_id", userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Erro ao deletar modelo personalizado:", error)
    throw error
  }
}

