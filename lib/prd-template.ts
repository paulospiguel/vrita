import { ProjectData } from "@/components/providers/project-context"

export function generatePRDTemplate(data: ProjectData): string {
  const {
    projectName,
    description,
    vision,
    objectives,
    strategy,
    targetAudience,
    features,
    technicalRequirements,
    designSystem,
  } = data

  let template = `# Product Requirement Document (PRD)\n\n`
  
  if (projectName) {
    template += `## Nome do Projeto\n${projectName}\n\n`
  }

  template += `## 1. Visão Geral do Produto\n\n`

  if (vision) {
    template += `### 1.1 Visão Geral\n${vision}\n\n`
  }

  if (description) {
    template += `### 1.2 Descrição\n${description}\n\n`
  }

  if (objectives || strategy) {
    template += `## 2. Objetivos & Estratégia\n\n`
    
    if (objectives) {
      template += `### 2.1 Objetivos\n${objectives}\n\n`
    }
    
    if (strategy) {
      template += `### 2.2 Estratégia\n${strategy}\n\n`
    }
  }

  if (targetAudience || features) {
    template += `## 3. Público-Alvo & Features\n\n`
    
    if (targetAudience) {
      template += `### 3.1 Público-Alvo\n${targetAudience}\n\n`
    }
    
    if (features) {
      template += `### 3.2 Features Principais\n${features}\n\n`
    }
  }

  if (technicalRequirements && technicalRequirements.length > 0) {
    template += `## 4. Requisitos Técnicos\n\n`
    if (Array.isArray(technicalRequirements)) {
      technicalRequirements.forEach((req, index) => {
        template += `${index + 1}. ${req}\n`
      })
      template += `\n`
    } else {
      template += `${technicalRequirements}\n\n`
    }
  }

  if (designSystem) {
    template += `## 5. Design System\n\n${designSystem}\n\n`
  }

  // Seções adicionais que serão preenchidas pela IA
  template += `## 6. Requisitos Funcionais\n\n### 6.1 Funcionalidades Principais\n*[A ser preenchido pela IA]*\n\n### 6.2 Fluxos de Usuário\n*[A ser preenchido pela IA]*\n\n### 6.3 Casos de Uso\n*[A ser preenchido pela IA]*\n\n`

  template += `## 7. Requisitos Não-Funcionais\n\n### 7.1 Performance\n*[A ser preenchido pela IA]*\n\n### 7.2 Segurança\n*[A ser preenchido pela IA]*\n\n### 7.3 Escalabilidade\n*[A ser preenchido pela IA]*\n\n### 7.4 Acessibilidade\n*[A ser preenchido pela IA]*\n\n`

  template += `## 8. Design e Experiência do Usuário\n\n### 8.1 Princípios de Design\n*[A ser preenchido pela IA]*\n\n### 8.2 Arquitetura de Informação\n*[A ser preenchido pela IA]*\n\n### 8.3 Wireframes e Mockups\n*[A ser preenchido pela IA]*\n\n`

  template += `## 9. Arquitetura Técnica\n\n### 9.1 Stack Tecnológico\n*[A ser preenchido pela IA]*\n\n### 9.2 Estrutura de Componentes\n*[A ser preenchido pela IA]*\n\n### 9.3 API e Integrações\n*[A ser preenchido pela IA]*\n\n`

  template += `## 10. Métricas e Sucesso\n\n### 10.1 KPIs\n*[A ser preenchido pela IA]*\n\n### 10.2 Métricas de Engajamento\n*[A ser preenchido pela IA]*\n\n### 10.3 Critérios de Aceitação\n*[A ser preenchido pela IA]*\n\n`

  template += `## 11. Roadmap e Fases\n\n### 11.1 MVP (Minimum Viable Product)\n*[A ser preenchido pela IA]*\n\n### 11.2 Fases Futuras\n*[A ser preenchido pela IA]*\n\n`

  template += `## 12. Riscos e Mitigações\n\n### 12.1 Riscos Técnicos\n*[A ser preenchido pela IA]*\n\n### 12.2 Riscos de Produto\n*[A ser preenchido pela IA]*\n\n### 12.3 Plano de Mitigação\n*[A ser preenchido pela IA]*\n\n`

  return template
}

