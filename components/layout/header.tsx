"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Settings, LogOut, FolderOpen, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 sm:space-x-3 min-w-0"
          >
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              <Image
                src="/vrita-logo.png"
                alt="vRita AI Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 32px, 40px"
              />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              AI Project Manager
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link href="/projects">
              <Button
                variant={pathname === "/projects" ? "default" : "ghost"}
                size="sm"
                className="text-sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Meus Projetos</span>
                <span className="lg:hidden">Projetos</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant={pathname === "/settings" ? "default" : "ghost"}
                size="sm"
                className="text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configurações</span>
                <span className="lg:hidden">Config</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Sair</span>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-2 border-t pt-4 space-y-2">
            <Link href="/projects" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/projects" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Meus Projetos
              </Button>
            </Link>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/settings" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
