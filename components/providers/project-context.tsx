"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface ProjectData {
  projectName: string
  description: string
  vision: string
  objectives: string
  strategy: string
  targetAudience: string
  features: string
  technicalRequirements: string[]
  designSystem: string
}

interface ProjectContextType {
  projectData: ProjectData
  currentProjectId: string | null
  updateProjectData: (data: Partial<ProjectData>) => void
  setCurrentProjectId: (id: string | null) => void
  clearProjectData: () => void
}

const defaultProjectData: ProjectData = {
  projectName: "",
  description: "",
  vision: "",
  objectives: "",
  strategy: "",
  targetAudience: "",
  features: "",
  technicalRequirements: [],
  designSystem: "",
}

const ProjectContext = createContext<ProjectContextType>({
  projectData: defaultProjectData,
  currentProjectId: null,
  updateProjectData: () => {},
  setCurrentProjectId: () => {},
  clearProjectData: () => {},
})

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectData, setProjectData] = useState<ProjectData>(defaultProjectData)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const updateProjectData = (data: Partial<ProjectData>) => {
    setProjectData((prev) => ({ ...prev, ...data }))
  }

  const clearProjectData = () => {
    setProjectData(defaultProjectData)
    setCurrentProjectId(null)
  }

  return (
    <ProjectContext.Provider
      value={{ 
        projectData, 
        currentProjectId,
        updateProjectData, 
        setCurrentProjectId,
        clearProjectData 
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => useContext(ProjectContext)

