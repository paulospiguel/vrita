"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export function AuthForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Bem-vindo ao vRita AI
        </CardTitle>
        <CardDescription className="text-center">
          Fa?a login para come?ar a gerar PRDs estruturados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base"
          size="lg"
        >
          <Chrome className="mr-2 h-5 w-5" />
          {loading ? "Carregando..." : "Continuar com Google"}
        </Button>
      </CardContent>
    </Card>
  )
}
