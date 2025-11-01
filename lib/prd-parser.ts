import type { ProjectData } from "@/components/providers/project-context"

/**
 * Extrai informações estruturadas do PRD gerado e preenche os campos do projeto
 */
export function extractProjectDataFromPRD(prdContent: string): Partial<ProjectData> {
  const extracted: Partial<ProjectData> = {}

  // Extrair nome do projeto (múltiplos padrões)
  const projectNamePatterns = [
    /##\s*Nome do Projeto\s*\n([^\n]+)/i,
    /#\s*Product Requirement Document\s*\(PRD\)\s*\n\n##\s*Nome do Projeto\s*\n([^\n]+)/i,
    /##\s*1\.\s*Visão Geral do Produto\s*\n###\s*1\.1\s*Objetivo\s*\n([^\n]+)/i,
  ]
  
  for (const pattern of projectNamePatterns) {
    const match = prdContent.match(pattern)
    if (match && match[1]) {
      extracted.projectName = match[1].trim()
      break
    }
  }

  // Extrair Visão Geral do Produto (seção 1)
  const visionSectionMatch = prdContent.match(/##\s*1\.\s*Visão Geral do Produto\s*\n([\s\S]*?)(?=##\s*[2-9]\.|$)/i)
  if (visionSectionMatch) {
    const visionContent = visionSectionMatch[1]
    
    // Extrair descrição (1.2 Descrição ou 1.2 Problema a Resolver ou qualquer texto após 1.2)
    const descriptionPatterns = [
      /###\s*1\.2\s*(?:Descrição|Problema a Resolver)\s*\n([\s\S]*?)(?=###|##|$)/i,
      /###\s*1\.2\s*[^\n]+\s*\n([\s\S]*?)(?=###|##|$)/i,
    ]
    
    for (const pattern of descriptionPatterns) {
      const match = visionContent.match(pattern)
      if (match && match[1]) {
        const desc = match[1].trim()
        if (desc && desc.length > 10) {
          extracted.description = desc
          break
        }
      }
    }

    // Extrair visão geral (1.1 Visão Geral ou 1.1 Objetivo)
    const visionPatterns = [
      /###\s*1\.1\s*(?:Visão Geral|Objetivo)\s*\n([\s\S]*?)(?=###|##|$)/i,
      /###\s*1\.1\s*[^\n]+\s*\n([\s\S]*?)(?=###|##|$)/i,
    ]
    
    for (const pattern of visionPatterns) {
      const match = visionContent.match(pattern)
      if (match && match[1]) {
        const vision = match[1].trim()
        if (vision && vision.length > 10) {
          extracted.vision = vision
          break
        }
      }
    }
    
    // Extrair público-alvo (1.3)
    const audienceMatch = visionContent.match(/###\s*1\.3\s*Público-Alvo\s*\n([\s\S]*?)(?=###|##|$)/i)
    if (audienceMatch && audienceMatch[1]) {
      const audience = audienceMatch[1].trim()
      if (audience && audience.length > 5) {
        extracted.targetAudience = audience
      }
    }
  }

  // Extrair Objetivos & Estratégia (seção 2) - Requisitos Funcionais pode conter objetivos
  const objectivesSectionPatterns = [
    /##\s*2\.\s*Objetivos.*?Estratégia\s*\n([\s\S]*?)(?=##\s*[3-9]\.|$)/i,
    /##\s*2\.\s*Requisitos Funcionais\s*\n([\s\S]*?)(?=##\s*[3-9]\.|$)/i,
  ]
  
  for (const pattern of objectivesSectionPatterns) {
    const match = prdContent.match(pattern)
    if (match) {
      const objectivesContent = match[1]
      
      // Extrair objetivos (2.1 Objetivos ou qualquer 2.1)
      const objectivesPatterns = [
        /###\s*2\.1\s*Objetivos\s*\n([\s\S]*?)(?=###|##|$)/i,
        /###\s*2\.1\s*[^\n]+\s*\n([\s\S]*?)(?=###|##|$)/i,
      ]
      
      for (const objPattern of objectivesPatterns) {
        const objMatch = objectivesContent.match(objPattern)
        if (objMatch && objMatch[1]) {
          const obj = objMatch[1].trim()
          if (obj && obj.length > 10) {
            extracted.objectives = obj
            break
          }
        }
      }

      // Extrair estratégia (2.2 Estratégia)
      const strategyMatch = objectivesContent.match(/###\s*2\.2\s*Estratégia\s*\n([\s\S]*?)(?=###|##|$)/i)
      if (strategyMatch && strategyMatch[1]) {
        const strategy = strategyMatch[1].trim()
        if (strategy && strategy.length > 10) {
          extracted.strategy = strategy
        }
      }
      break
    }
  }

  // Extrair Features (seção 2.1 Funcionalidades Principais ou seção 3)
  const featuresPatterns = [
    /###\s*2\.1\s*Funcionalidades Principais\s*\n([\s\S]*?)(?=###|##|$)/i,
    /##\s*3\.\s*Público-Alvo.*?Features\s*\n([\s\S]*?)(?=##\s*[4-9]\.|$)/i,
  ]
  
  for (const pattern of featuresPatterns) {
    const match = prdContent.match(pattern)
    if (match) {
      const featuresContent = match[1]
      const featuresMatch = featuresContent.match(/###\s*(?:3\.2|2\.1)\s*(?:Features Principais|Funcionalidades Principais)\s*\n([\s\S]*?)(?=###|##|$)/i)
      if (featuresMatch && featuresMatch[1]) {
        const features = featuresMatch[1].trim()
        if (features && features.length > 10) {
          extracted.features = features
          break
        }
      }
    }
  }
  
  // Se não encontrou features em seção específica, tentar pegar de qualquer 2.1
  if (!extracted.features) {
    const fallbackFeatures = prdContent.match(/###\s*2\.1\s*[^\n]+\s*\n([\s\S]*?)(?=###|##|$)/i)
    if (fallbackFeatures && fallbackFeatures[1]) {
      const features = fallbackFeatures[1].trim()
      if (features && features.length > 20) {
        extracted.features = features
      }
    }
  }

  // Extrair Requisitos Técnicos (seção 4, 5 ou na seção Arquitetura Técnica)
  const techSectionPatterns = [
    /##\s*(?:4|5)\.\s*Requisitos Técnicos\s*\n([\s\S]*?)(?=##\s*\d+\.|$)/i,
    /##\s*5\.\s*Arquitetura Técnica\s*\n([\s\S]*?)(?=##\s*\d+\.|$)/i,
  ]
  
  for (const pattern of techSectionPatterns) {
    const match = prdContent.match(pattern)
    if (match) {
      const techContent = match[1]
      const techRequirements: string[] = []
      
      // Extrair seção 5.1 Stack Tecnológico especificamente
      const stackMatch = techContent.match(/###\s*5\.1\s*Stack Tecnológico\s*\n([\s\S]*?)(?=###|##|$)/i)
      if (stackMatch && stackMatch[1]) {
        const stackContent = stackMatch[1]
        const lines = stackContent.split('\n')
        lines.forEach((line) => {
          const trimmed = line.trim()
          // Remover números, bullets e hífens iniciais
          const cleanLine = trimmed.replace(/^[\d\-•*]\s*/, '').replace(/^-\s*/, '').trim()
          if (cleanLine && cleanLine.length > 3 && !cleanLine.match(/^\[.*\]$/)) {
            techRequirements.push(cleanLine)
          }
        })
      } else {
        // Fallback: extrair qualquer lista
        const lines = techContent.split('\n')
        lines.forEach((line) => {
          const trimmed = line.trim()
          const cleanLine = trimmed.replace(/^[\d\-•*]\s*/, '').replace(/^-\s*/, '').trim()
          if (cleanLine && cleanLine.length > 3 && !cleanLine.match(/^\[.*\]$/)) {
            techRequirements.push(cleanLine)
          }
        })
      }
      
      if (techRequirements.length > 0) {
        extracted.technicalRequirements = techRequirements.slice(0, 10) // Limitar a 10 itens
        break
      }
    }
  }

  // Extrair Design System (seção 4)
  const designSectionPatterns = [
    /##\s*4\.\s*Design.*?Experiência.*?Usuário\s*\n([\s\S]*?)(?=##\s*\d+\.|$)/i,
    /##\s*4\.\s*Design.*?Sistema\s*\n([\s\S]*?)(?=##\s*\d+\.|$)/i,
  ]
  
  for (const pattern of designSectionPatterns) {
    const match = prdContent.match(pattern)
    if (match) {
      const designContent = match[1]
      
      // Tentar extrair a seção 4.4 Sistema de Design especificamente
      const designSystemMatch = designContent.match(/###\s*4\.4\s*Sistema de Design\s*\n([\s\S]*?)(?=###|##|$)/i)
      if (designSystemMatch && designSystemMatch[1]) {
        const designSystem = designSystemMatch[1].trim()
        if (designSystem && designSystem.length > 20) {
          extracted.designSystem = designSystem
          break
        }
      } else {
        // Se não encontrar subseção específica, usar todo o conteúdo da seção 4
        const fullDesign = designContent.trim()
        if (fullDesign && fullDesign.length > 50) {
          extracted.designSystem = fullDesign.substring(0, 1000) // Limitar tamanho
          break
        }
      }
    }
  }

  // Debug: log para verificar o que foi extraído
  console.log("Dados extraídos do PRD:", extracted)

  return extracted
}

