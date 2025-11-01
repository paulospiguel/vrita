import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ProjectProvider } from "@/components/providers/project-context";
import { GenerationProvider } from "@/components/providers/generation-context";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "vRita AI - Gerador de Documentação Técnica com IA",
  description:
    "Plataforma SaaS para geração inteligente de PRDs, documentação de features e sistemas de design com Inteligência Artificial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProjectProvider>
              <GenerationProvider>
                {children}
                <Toaster position="top-right" richColors />
              </GenerationProvider>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
