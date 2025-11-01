import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ProjectProvider } from "@/components/providers/project-context"
import { GenerationProvider } from "@/components/providers/generation-context"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "vRita AI - Gerador de PRD",
  description: "Gerador de Product Requirement Document estruturado para criação de apps e aplicações",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ProjectProvider>
            <GenerationProvider>
              {children}
              <Toaster position="top-right" richColors />
            </GenerationProvider>
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
