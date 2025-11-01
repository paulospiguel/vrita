"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Settings, LogOut, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  return (
    <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            vRita AI
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/settings">
            <Button
              variant={pathname === "/settings" ? "default" : "ghost"}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configura??es
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </nav>
      </div>
    </header>
  )
}
