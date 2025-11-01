import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generatePRD(input: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Voc? ? um especialista em Product Requirement Documents (PRD) com experi?ncia em design, desenvolvimento, gest?o de projetos, UI/UX, psicologia de sistemas e arquitetura de produtos.

Crie um PRD completo e estruturado baseado na seguinte descri??o:

${input}

O PRD deve seguir este formato estruturado:

# Product Requirement Document (PRD)

## 1. Vis?o Geral do Produto
### 1.1 Objetivo
### 1.2 Problema a Resolver
### 1.3 P?blico-Alvo
### 1.4 Proposta de Valor

## 2. Requisitos Funcionais
### 2.1 Funcionalidades Principais
### 2.2 Fluxos de Usu?rio
### 2.3 Casos de Uso

## 3. Requisitos N?o-Funcionais
### 3.1 Performance
### 3.2 Seguran?a
### 3.3 Escalabilidade
### 3.4 Acessibilidade

## 4. Design e Experi?ncia do Usu?rio
### 4.1 Princ?pios de Design
### 4.2 Arquitetura de Informa??o
### 4.3 Wireframes e Mockups (descri??o detalhada)
### 4.4 Sistema de Design
- Cores (baseado em teoria das cores e psicologia)
- Tipografia
- Componentes UI
- Espa?amento e Grid

## 5. Arquitetura T?cnica
### 5.1 Stack Tecnol?gico
- Frontend: Next.js 14+ com TypeScript
- Estiliza??o: Tailwind CSS
- Componentes: shadcn/ui
- Backend: [especificar conforme necess?rio]
- Banco de Dados: Supabase
- Autentica??o: Supabase Auth

### 5.2 Estrutura de Componentes
### 5.3 API e Integra??es
### 5.4 Estado e Gerenciamento de Dados

## 6. M?tricas e Sucesso
### 6.1 KPIs
### 6.2 M?tricas de Engajamento
### 6.3 Crit?rios de Aceita??o

## 7. Roadmap e Fases
### 7.1 MVP (Minimum Viable Product)
### 7.2 Fases Futuras

## 8. Riscos e Mitiga??es
### 8.1 Riscos T?cnicos
### 8.2 Riscos de Produto
### 8.3 Plano de Mitiga??o

## 9. Considera??es de Implementa??o
### 9.1 Componentiza??o
- Todos os componentes devem ser reutiliz?veis e modulares
- Uso de TypeScript para type safety
- Padr?es de design consistentes

### 9.2 Design System
- Design moderno e coerente
- Cores cognitivamente compat?veis com o neg?cio
- Teoria das cores aplicada para m?xima efic?cia psicol?gica

### 9.3 Boas Pr?ticas
- C?digo limpo e manuten?vel
- Documenta??o adequada
- Testes quando aplic?vel

Retorne o PRD completo e detalhado no formato acima.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generateFeatureDescription(input: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Voc? ? um especialista em documenta??o de features de produtos digitais.

Crie uma descri??o detalhada e estruturada de uma feature baseada na seguinte descri??o:

${input}

A descri??o deve incluir:

## Descri??o da Feature

### Nome da Feature
### Objetivo
### Problema que Resolve
### Benef?cios para o Usu?rio

## Especifica??es T?cnicas

### Requisitos Funcionais
### Requisitos N?o-Funcionais
### Fluxo de Usu?rio
### Componentes Necess?rios

## Design e UX

### Interface do Usu?rio
### Intera??es
### Estados da Interface
### Feedback Visual

## Implementa??o

### Stack Tecnol?gico
- Next.js 14+ com TypeScript
- Tailwind CSS para estiliza??o
- shadcn/ui para componentes
- Componentiza??o completa

### Considera??es de Desenvolvimento
### Depend?ncias
### Integra??es Necess?rias

## Crit?rios de Aceita??o
## M?tricas de Sucesso

Retorne a descri??o completa e detalhada.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generateSystemDesigner(input: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Voc? ? um especialista em Design Systems, UI/UX, teoria das cores e psicologia visual.

Crie um sistema de design completo baseado na seguinte descri??o:

${input}

O sistema de design deve incluir:

# Sistema de Design - UI/UX

## 1. Filosofia de Design
### Princ?pios Fundamentais
### Vis?o de Marca
### Personalidade Visual

## 2. Teoria das Cores e Psicologia Visual
### Paleta Principal
- Cores prim?rias (com justificativa psicol?gica)
- Cores secund?rias
- Cores de destaque
- Cores neutras

### Significado Psicol?gico das Cores
- Como cada cor afeta emocionalmente o usu?rio
- Aplica??o cognitiva das cores no contexto do neg?cio
- Contraste e acessibilidade

### Tokens de Cor
- Cores de fundo
- Cores de texto
- Cores de borda
- Estados (hover, active, disabled, error, success)

## 3. Tipografia
### Hierarquia Tipogr?fica
### Fontes
### Tamanhos e Escalas
### Pesos e Estilos
### Espa?amento de Linha

## 4. Espa?amento e Layout
### Grid System
### Espa?amento (Spacing Scale)
### Breakpoints Responsivos
### Princ?pios de Layout

## 5. Componentes UI
### Componentes Base
- Bot?es (variantes, estados)
- Inputs e Formul?rios
- Cards
- Modais e Dialogs
- Navega??o
- Feedback Visual (toasts, alerts)

### Padr?es de Componentes
### Estados dos Componentes
### Varia??es e Modificadores

## 6. Iconografia
### Estilo de ?cones
### Tamanhos
### Uso Contextual

## 7. Anima??es e Transi??es
### Princ?pios de Anima??o
### Dura??es
### Easing Functions
### Micro-intera??es

## 8. Acessibilidade
### Contraste de Cores (WCAG)
### Navega??o por Teclado
### Screen Readers
### Foco Visual

## 9. Design Responsivo
### Mobile First
### Breakpoints
### Adapta??es por Dispositivo

## 10. Implementa??o T?cnica
### Tecnologias
- Tailwind CSS
- shadcn/ui
- TypeScript
- Next.js

### Estrutura de Arquivos
### Configura??o do Tailwind
### Vari?veis CSS Customizadas

## 11. Guia de Uso
### Quando Usar Cada Componente
### Boas Pr?ticas
### Padr?es de Composi??o

Retorne o sistema de design completo e detalhado, com foco especial na teoria das cores e psicologia visual aplicada ao contexto do neg?cio.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
