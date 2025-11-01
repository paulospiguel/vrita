import { NextRequest, NextResponse } from "next/server"
import { getAvailablePlans } from "@/lib/subscription/subscription"

export async function GET(request: NextRequest) {
  try {
    const plans = await getAvailablePlans()
    return NextResponse.json({ plans })
  } catch (error: any) {
    console.error("Erro ao obter planos:", error)
    return NextResponse.json(
      { error: "Erro ao obter planos" },
      { status: 500 }
    )
  }
}

