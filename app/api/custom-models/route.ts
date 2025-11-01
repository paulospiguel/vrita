import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getUserCustomModels,
  createCustomModel,
  updateCustomModel,
  deleteCustomModel,
} from "@/lib/ai/custom-models"
import type { AIProvider } from "@/lib/ai/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const models = await getUserCustomModels(user.id)
    return NextResponse.json({ models })
  } catch (error: any) {
    console.error("Erro ao obter modelos personalizados:", error)
    return NextResponse.json(
      { error: "Erro ao obter modelos personalizados" },
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

    const { name, modelId, provider, description } = await request.json()

    // Validações
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome do modelo é obrigatório" },
        { status: 400 }
      )
    }

    if (!modelId || typeof modelId !== "string" || modelId.trim().length === 0) {
      return NextResponse.json(
        { error: "ID do modelo é obrigatório" },
        { status: 400 }
      )
    }

    if (!provider || !["gemini", "openrouter"].includes(provider)) {
      return NextResponse.json(
        { error: "Provedor inválido" },
        { status: 400 }
      )
    }

    const model = await createCustomModel(user.id, {
      name: name.trim(),
      modelId: modelId.trim(),
      provider: provider as AIProvider,
      description: description?.trim() || undefined,
    })

    return NextResponse.json({ model })
  } catch (error: any) {
    console.error("Erro ao criar modelo personalizado:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar modelo personalizado" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, name, modelId, provider, description } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "ID do modelo é obrigatório" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (modelId !== undefined) updateData.modelId = modelId.trim()
    if (provider !== undefined) {
      if (!["gemini", "openrouter"].includes(provider)) {
        return NextResponse.json(
          { error: "Provedor inválido" },
          { status: 400 }
        )
      }
      updateData.provider = provider as AIProvider
    }
    if (description !== undefined) updateData.description = description?.trim() || undefined

    await updateCustomModel(user.id, id, updateData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao atualizar modelo personalizado:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar modelo personalizado" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do modelo é obrigatório" },
        { status: 400 }
      )
    }

    await deleteCustomModel(user.id, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao deletar modelo personalizado:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao deletar modelo personalizado" },
      { status: 500 }
    )
  }
}

