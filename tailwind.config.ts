// Tailwind CSS v4 - Configuração mínima para compatibilidade
// A maioria da configuração agora está em app/globals.css usando @theme
import type { Config } from "tailwindcss"

const config: Config = {
  // Dark mode ainda usa 'class' para compatibilidade com shadcn/ui
  darkMode: "class",
  
  // Content paths - ainda necessário para v4 detectar os arquivos
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
}

export default config