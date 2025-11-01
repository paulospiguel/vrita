"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { User } from "@supabase/supabase-js"
import { User as UserIcon, Mail, Key } from "lucide-react"
import Image from "next/image"

interface SettingsContentProps {
  user: User
}

export function SettingsContent({ user }: SettingsContentProps) {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configura??es
        </h1>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Perfil do Usu?rio
              </CardTitle>
              <CardDescription>
                Informa??es da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configura??es da API
              </CardTitle>
              <CardDescription>
                Configure suas chaves de API para uso das funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> As chaves de API s?o configuradas atrav?s de vari?veis de ambiente no servidor.
                  Entre em contato com o administrador para configurar:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li>GEMINI_API_KEY - Para gera??o de conte?do com IA</li>
                  <li>NEXT_PUBLIC_SUPABASE_URL - URL do seu projeto Supabase</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY - Chave an?nima do Supabase</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Sobre o vRita AI</CardTitle>
              <CardDescription>
                Informa??es sobre a aplica??o
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Vers?o:</strong> 1.0.0</p>
                <p><strong>Descri??o:</strong> Gerador de PRD estruturado para cria??o de apps e aplica??es</p>
                <p><strong>Stack:</strong> Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Gemini AI</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
