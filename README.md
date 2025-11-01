# vRita AI - Gerador de PRD Estruturado

Gerador de Product Requirement Document (PRD) estruturado para criação de apps e aplicações, integrado com IA (Gemini) e Supabase.

## 🚀 Funcionalidades

- **Gerador de PRD**: Cria documentos PRD completos e estruturados
- **Gerador de Descrição de Feature**: Documentação detalhada de funcionalidades
- **System Designer**: Sistema de design completo com teoria das cores e psicologia visual
- **Autenticação Social**: Login com Google via Supabase
- **Interface Moderna**: Design system coerente com Tailwind CSS e shadcn/ui

## 💻 Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Autenticação**: Supabase Auth
- **IA**: Google Gemini API
- **Banco de Dados**: Supabase

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Chave de API do Google Gemini

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd vrita-ai-prd-generator
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
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
   - Ative o provider de autenticação Google
   - Configure a URL de redirecionamento: `http://localhost:3000/auth/callback`

5. Execute o projeto:
```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📁 Estrutura do Projeto

```
/workspace
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── settings/          # Página de configurações
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── auth/             # Componentes de autenticação
│   ├── generators/       # Geradores (PRD, Feature, Designer)
│   ├── layout/           # Componentes de layout
│   ├── providers/        # Context providers
│   └── settings/         # Componentes de settings
├── lib/                  # Utilitários e configurações
│   ├── supabase/         # Clientes Supabase
│   ├── gemini.ts         # Integração com Gemini AI
│   └── utils.ts          # Funções utilitárias
└── middleware.ts         # Middleware Next.js
```

## 🎨 Design System

O projeto utiliza um design system moderno baseado em:
- **Teoria das Cores**: Cores cognitivamente compatíveis com o negócio
- **Componentização**: Todos os componentes são reutilizáveis e modulares
- **Acessibilidade**: Seguindo padrões WCAG
- **Responsividade**: Mobile-first approach

## 🔐 Autenticação

A autenticação é feita através do Supabase Auth com login social via Google. O middleware protege as rotas autenticadas automaticamente.

## 🤖 Integração com IA

O projeto utiliza a API do Google Gemini para gerar:
- PRDs estruturados
- Descrições de features
- Sistemas de design com teoria das cores

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 🚀 Deploy

O projeto pode ser deployado em:
- Vercel (recomendado para Next.js)
- Netlify
- Qualquer plataforma que suporte Next.js

## 📄 Licença

ISC

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
