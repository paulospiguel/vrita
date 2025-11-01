import type { ProjectData } from "@/components/providers/project-context"
import { createAIProvider } from "./factory"
import { getUserAIConfig } from "./config"
import type { AIConfig, AIGenerateResult } from "./types"

async function getAIConfigForUser(userId: string): Promise<AIConfig> {
  return await getUserAIConfig(userId)
}

export async function generatePRDWithMetadata(
  projectData: ProjectData,
  userId: string
): Promise<{ content: string; result: AIGenerateResult; config: AIConfig }> {
  const config = await getAIConfigForUser(userId)
  const provider = createAIProvider(config)

  // Construir contexto completo do projeto
  let context = ``

  if (projectData.projectName) {
    context += `Nome do Projeto: ${projectData.projectName}\n\n`
  }

  if (projectData.description) {
    context += `Descrição: ${projectData.description}\n\n`
  }

  if (projectData.vision) {
    context += `Visão Geral: ${projectData.vision}\n\n`
  }

  if (projectData.objectives) {
    context += `Objetivos: ${projectData.objectives}\n\n`
  }

  if (projectData.strategy) {
    context += `Estratégia: ${projectData.strategy}\n\n`
  }

  if (projectData.targetAudience) {
    context += `Público-Alvo: ${projectData.targetAudience}\n\n`
  }

  if (projectData.features) {
    context += `Features Principais: ${projectData.features}\n\n`
  }

  if (
    projectData.technicalRequirements &&
    projectData.technicalRequirements.length > 0
  ) {
    if (Array.isArray(projectData.technicalRequirements)) {
      context += `Requisitos Técnicos: ${projectData.technicalRequirements.join(
        ", "
      )}\n\n`
    } else {
      context += `Requisitos Técnicos: ${projectData.technicalRequirements}\n\n`
    }
  }

  if (projectData.designSystem) {
    context += `Design System: ${projectData.designSystem}\n\n`
  }

  const prompt = `Você é um especialista em Product Requirement Documents (PRD) com experiência em design, desenvolvimento, gestão de projetos, UI/UX, psicologia de sistemas e arquitetura de produtos.

Crie um PRD completo e estruturado baseado nas seguintes informações do projeto:

${context}

O PRD deve seguir este formato estruturado:

# Product Requirement Document (PRD)

## 1. Visão Geral do Produto
### 1.1 Objetivo
### 1.2 Problema a Resolver
### 1.3 Público-Alvo
### 1.4 Proposta de Valor

## 2. Requisitos Funcionais
### 2.1 Funcionalidades Principais
### 2.2 Fluxos de Usuário
### 2.3 Casos de Uso

## 3. Requisitos Não-Funcionais
### 3.1 Performance
### 3.2 Segurança
### 3.3 Escalabilidade
### 3.4 Acessibilidade

## 4. Design e Experiência do Usuário
### 4.1 Princípios de Design
### 4.2 Arquitetura de Informação
### 4.3 Wireframes e Mockups (descrição detalhada)
### 4.4 Sistema de Design
- Cores (baseado em teoria das cores e psicologia)
- Tipografia
- Componentes UI
- Espaçamento e Grid

## 5. Arquitetura Técnica
### 5.1 Stack Tecnológico
- Frontend: Next.js 14+ com TypeScript
- Estilização: Tailwind CSS
- Componentes: shadcn/ui
- Backend: [especificar conforme necessário]
- Banco de Dados: Supabase
- Autenticação: Supabase Auth

### 5.2 Estrutura de Componentes
### 5.3 API e Integrações
### 5.4 Estado e Gerenciamento de Dados

## 6. Métricas e Sucesso
### 6.1 KPIs
### 6.2 Métricas de Engajamento
### 6.3 Critérios de Aceitação

## 7. Roadmap e Fases
### 7.1 MVP (Minimum Viable Product)
### 7.2 Fases Futuras

## 8. Riscos e Mitigações
### 8.1 Riscos Técnicos
### 8.2 Riscos de Produto
### 8.3 Plano de Mitigação

## 9. Considerações de Implementação
### 9.1 Componentização
- Todos os componentes devem ser reutilizáveis e modulares
- Uso de TypeScript para type safety
- Padrões de design consistentes

### 9.2 Design System
- Design moderno e coerente
- Cores cognitivamente compatíveis com o negócio
- Teoria das cores aplicada para máxima eficácia psicológica

### 9.3 Boas Práticas
- Código limpo e manutenível
- Documentação adequada
- Testes quando aplicável

IMPORTANTE: Retorne o PRD em formato JSON estruturado seguindo este schema:

{
  "prdMarkdown": "[O PRD completo em formato Markdown conforme estrutura acima]",
  "projectData": {
    "projectName": "[Nome do projeto extraído ou gerado]",
    "description": "[Descrição completa do projeto]",
    "vision": "[Visão geral do produto da seção 1.1]",
    "objectives": "[Objetivos do projeto da seção 2.1]",
    "strategy": "[Estratégia do projeto da seção 2.2]",
    "targetAudience": "[Público-alvo da seção 1.3]",
    "features": "[Features principais da seção 2.1 Funcionalidades]",
    "technicalRequirements": ["Requisito 1", "Requisito 2", "..."],
    "designSystem": "[Sistema de design da seção 4.4]"
  }
}

Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`

  const result = await provider.generate({ prompt, maxTokens: 8192 })
  const text = result.content

  // Tentar extrair JSON da resposta
  let finalContent: string
  try {
    // Remover markdown code blocks se existirem
    const jsonMatch =
      text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
      text.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[1]
      const parsed = JSON.parse(jsonStr)
      finalContent = JSON.stringify(parsed)
    } else {
      // Se não encontrar JSON, retornar texto original para compatibilidade
      finalContent = text
    }
  } catch (error) {
    console.error("Erro ao parsear JSON da resposta:", error)
    // Retornar texto original se falhar
    finalContent = text
  }

  return { content: finalContent, result, config }
}

export async function generatePRD(
  projectData: ProjectData,
  userId: string
): Promise<string> {
  const { content } = await generatePRDWithMetadata(projectData, userId)
  return content
}

export async function generateFeatureDescriptionWithMetadata(
  input: string,
  userId: string,
  projectContext?: ProjectData
): Promise<{ content: string; result: AIGenerateResult; config: AIConfig }> {
  const config = await getAIConfigForUser(userId)
  const provider = createAIProvider(config)

  let contextInfo = ""
  if (projectContext) {
    if (projectContext.projectName)
      contextInfo += `\nContexto do Projeto: ${projectContext.projectName}\n`
    if (projectContext.description)
      contextInfo += `Descrição do Projeto: ${projectContext.description}\n`
    if (projectContext.features)
      contextInfo += `Features Existentes: ${projectContext.features}\n`
    if (
      projectContext.technicalRequirements &&
      projectContext.technicalRequirements.length > 0
    ) {
      if (Array.isArray(projectContext.technicalRequirements)) {
        contextInfo += `Requisitos Técnicos: ${projectContext.technicalRequirements.join(
          ", "
        )}\n`
      } else {
        contextInfo += `Requisitos Técnicos: ${projectContext.technicalRequirements}\n`
      }
    }
  }

  const prompt = `Você é um especialista em documentação de features de produtos digitais.

Crie uma descrição detalhada e estruturada de uma feature baseada na seguinte descrição:

${input}${contextInfo ? `\n\n${contextInfo}` : ""}

A descrição deve incluir:

## Descrição da Feature

### Nome da Feature
### Objetivo
### Problema que Resolve
### Benefícios para o Usuário

## Especificações Técnicas

### Requisitos Funcionais
### Requisitos Não-Funcionais
### Fluxo de Usuário
### Componentes Necessários

## Design e UX

### Interface do Usuário
### Interações
### Estados da Interface
### Feedback Visual

## Implementação

### Stack Tecnológico
- Next.js 14+ com TypeScript
- Tailwind CSS para estilização
- shadcn/ui para componentes
- Componentização completa

### Considerações de Desenvolvimento
### Dependências
### Integrações Necessárias

## Critérios de Aceitação
## Métricas de Sucesso

Retorne a descrição completa e detalhada.`

  const result = await provider.generate({ prompt, maxTokens: 4096 })
  return { content: result.content, result, config }
}

export async function generateFeatureDescription(
  input: string,
  userId: string,
  projectContext?: ProjectData
): Promise<string> {
  const { content } = await generateFeatureDescriptionWithMetadata(input, userId, projectContext)
  return content
}

export async function generateSystemDesignerWithMetadata(
  input: string,
  userId: string,
  projectContext?: ProjectData,
  importedDesignData?: string
): Promise<{ content: string; result: AIGenerateResult; config: AIConfig }> {
  const config = await getAIConfigForUser(userId)
  const provider = createAIProvider(config)

  let contextInfo = ""
  if (projectContext) {
    if (projectContext.projectName)
      contextInfo += `\nContexto do Projeto: ${projectContext.projectName}\n`
    if (projectContext.description)
      contextInfo += `Descrição do Projeto: ${projectContext.description}\n`
    if (projectContext.targetAudience)
      contextInfo += `Público-Alvo: ${projectContext.targetAudience}\n`
    if (projectContext.designSystem)
      contextInfo += `Requisitos de Design: ${projectContext.designSystem}\n`
    if (projectContext.vision)
      contextInfo += `Visão do Projeto: ${projectContext.vision}\n`
  }

  let designAnalysisSection = ""
  if (importedDesignData) {
    designAnalysisSection = `\n\n## ANÁLISE DE DESIGN IMPORTADO\n\nAbaixo está uma análise detalhada dos elementos de design extraídos de um site:\n\n${importedDesignData}\n\n**INSTRUÇÕES IMPORTANTES:**\n- Use esta análise como BASE FUNDAMENTAL para criar o sistema de design\n- Mantenha a essência, personalidade e identidade visual do design original\n- Se o usuário solicitou modificações ou ajustes específicos, aplique-os de forma inteligente preservando a harmonia do design\n- Combine os elementos do design original com as modificações solicitadas de forma coerente\n- Se não houver modificações específicas, crie um sistema de design completo baseado na análise fornecida\n`
  }

  const userInstructions = input.trim() || (importedDesignData ? "Crie um sistema de design completo baseado na análise fornecida." : "")

  const prompt = `Você é um especialista em Design Systems, UI/UX, teoria das cores e psicologia visual.

${importedDesignData 
  ? `Você recebeu uma análise detalhada de design extraída de um site. ${input.trim() ? 'O usuário também forneceu instruções específicas para modificações ou ajustes.' : 'Crie um sistema de design completo baseado nesta análise.'}`
  : `Crie um sistema de design completo baseado na seguinte descrição:`
}

${userInstructions}${contextInfo ? `\n\n${contextInfo}` : ""}${designAnalysisSection}

O sistema de design deve incluir:

# Sistema de Design - UI/UX

## 1. Filosofia de Design
### Princípios Fundamentais
### Visão de Marca
### Personalidade Visual

## 2. Teoria das Cores e Psicologia Visual
### Paleta Principal
- Cores primárias (com justificativa psicológica)
- Cores secundárias
- Cores de destaque
- Cores neutras

### Significado Psicológico das Cores
- Como cada cor afeta emocionalmente o usuário
- Aplicação cognitiva das cores no contexto do negócio
- Contraste e acessibilidade

### Tokens de Cor
- Cores de fundo
- Cores de texto
- Cores de borda
- Estados (hover, active, disabled, error, success)

## 3. Tipografia
### Hierarquia Tipográfica
### Fontes
### Tamanhos e Escalas
### Pesos e Estilos
### Espaçamento de Linha

## 4. Espaçamento e Layout
### Grid System
### Espaçamento (Spacing Scale)
### Breakpoints Responsivos
### Princípios de Layout

## 5. Componentes UI
### Componentes Base
- Botões (variantes, estados)
- Inputs e Formulários
- Cards
- Modais e Dialogs
- Navegação
- Feedback Visual (toasts, alerts)

### Padrões de Componentes
### Estados dos Componentes
### Variações e Modificadores

## 6. Iconografia
### Estilo de Ícones
### Tamanhos
### Uso Contextual

## 7. Animações e Transições
### Princípios de Animação
### Durações
### Easing Functions
### Micro-interações

## 8. Acessibilidade
### Contraste de Cores (WCAG)
### Navegação por Teclado
### Screen Readers
### Foco Visual

## 9. Design Responsivo
### Mobile First
### Breakpoints
### Adaptações por Dispositivo

## 10. Implementação Técnica
### Tecnologias
- Tailwind CSS
- shadcn/ui
- TypeScript
- Next.js

### Estrutura de Arquivos
### Configuração do Tailwind
### Variáveis CSS Customizadas

## 11. Guia de Uso
### Quando Usar Cada Componente
### Boas Práticas
### Padrões de Composição

Retorne o sistema de design completo e detalhado, com foco especial na teoria das cores e psicologia visual aplicada ao contexto do negócio.`

  const result = await provider.generate({ prompt, maxTokens: 8192 })
  return { content: result.content, result, config }
}

export async function generateSystemDesigner(
  input: string,
  userId: string,
  projectContext?: ProjectData,
  importedDesignData?: string
): Promise<string> {
  const { content } = await generateSystemDesignerWithMetadata(input, userId, projectContext, importedDesignData)
  return content
}

