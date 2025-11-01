# vRita AI - Gerador de PRD Estruturado

Gerador de Product Requirement Document (PRD) estruturado para cria??o de apps e aplica??es, integrado com IA (Gemini) e Supabase.

## ?? Funcionalidades

- **Gerador de PRD**: Cria documentos PRD completos e estruturados
- **Gerador de Descri??o de Feature**: Documenta??o detalhada de funcionalidades
- **System Designer**: Sistema de design completo com teoria das cores e psicologia visual
- **Autentica??o Social**: Login com Google via Supabase
- **Interface Moderna**: Design system coerente com Tailwind CSS e shadcn/ui

## ??? Stack Tecnol?gico

- **Frontend**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estiliza??o**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Autentica??o**: Supabase Auth
- **IA**: Google Gemini API
- **Banco de Dados**: Supabase

## ?? Pr?-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Chave de API do Google Gemini

## ?? Instala??o

1. Clone o reposit?rio:
```bash
git clone <repository-url>
cd vrita-ai-prd-generator
```

2. Instale as depend?ncias:
```bash
npm install
```

3. Configure as vari?veis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Configure o Supabase:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Ative o provider de autentica??o Google
   - Configure a URL de redirecionamento: `http://localhost:3000/auth/callback`

5. Execute o projeto:
```bash
npm run dev
```

Acesse `http://localhost:3000`

## ?? Estrutura do Projeto

```
/workspace
??? app/                    # Next.js App Router
?   ??? api/               # API Routes
?   ??? auth/              # P?ginas de autentica??o
?   ??? settings/          # P?gina de configura??es
?   ??? layout.tsx         # Layout raiz
?   ??? page.tsx           # P?gina principal
?   ??? globals.css        # Estilos globais
??? components/            # Componentes React
?   ??? ui/               # Componentes shadcn/ui
?   ??? auth/             # Componentes de autentica??o
?   ??? generators/       # Geradores (PRD, Feature, Designer)
?   ??? layout/           # Componentes de layout
?   ??? providers/        # Context providers
?   ??? settings/         # Componentes de settings
??? lib/                  # Utilit?rios e configura??es
?   ??? supabase/         # Clientes Supabase
?   ??? gemini.ts         # Integra??o com Gemini AI
?   ??? utils.ts          # Fun??es utilit?rias
??? middleware.ts         # Middleware Next.js
```

## ?? Design System

O projeto utiliza um design system moderno baseado em:
- **Teoria das Cores**: Cores cognitivamente compat?veis com o neg?cio
- **Componentiza??o**: Todos os componentes s?o reutiliz?veis e modulares
- **Acessibilidade**: Seguindo padr?es WCAG
- **Responsividade**: Mobile-first approach

## ?? Autentica??o

A autentica??o ? feita atrav?s do Supabase Auth com login social via Google. O middleware protege as rotas autenticadas automaticamente.

## ?? Integra??o com IA

O projeto utiliza a API do Google Gemini para gerar:
- PRDs estruturados
- Descri??es de features
- Sistemas de design com teoria das cores

## ?? Scripts Dispon?veis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produ??o
- `npm run start` - Inicia o servidor de produ??o
- `npm run lint` - Executa o linter

## ?? Deploy

O projeto pode ser deployado em:
- Vercel (recomendado para Next.js)
- Netlify
- Qualquer plataforma que suporte Next.js

## ?? Licen?a

ISC

## ?? Contribui??o

Contribui??es s?o bem-vindas! Sinta-se ? vontade para abrir issues e pull requests.
