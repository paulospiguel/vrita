import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generatePRD } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "N?o autorizado" }, { status: 401 })
    }

    const { input } = await request.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Input ? obrigat?rio" },
        { status: 400 }
      )
    }

    const content = await generatePRD(input)

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("Erro ao gerar PRD:", error)
    return NextResponse.json(
      { error: "Erro ao gerar PRD" },
      { status: 500 }
    )
  }
}
