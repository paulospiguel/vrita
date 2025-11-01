import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ProjectData } from "@/components/providers/project-context"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ projects: data || [] })
  } catch (error: any) {
    console.error("Erro ao buscar projetos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar projetos" },
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

    const { projectData, prdContent, name } = await request.json()

    if (!projectData || typeof projectData !== "object") {
      return NextResponse.json(
        { error: "Dados do projeto são obrigatórios" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name || projectData.projectName || "Projeto sem nome",
        project_data: projectData as ProjectData,
        prd_content: prdContent || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project: data })
  } catch (error: any) {
    console.error("Erro ao salvar projeto:", error)
    return NextResponse.json(
      { error: "Erro ao salvar projeto" },
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

    const { id, projectData, prdContent, name } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (projectData) updateData.project_data = projectData
    if (prdContent !== undefined) updateData.prd_content = prdContent

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project: data })
  } catch (error: any) {
    console.error("Erro ao atualizar projeto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar projeto" },
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
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao deletar projeto:", error)
    return NextResponse.json(
      { error: "Erro ao deletar projeto" },
      { status: 500 }
    )
  }
}

