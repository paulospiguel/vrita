"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { FolderOpen, Trash2, Eye, Calendar, Loader2, Brain } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { generatePRDTemplate } from "@/lib/prd-template"
import type { ProjectData } from "@/components/providers/project-context"

interface Project {
  id: string
  name: string
  project_data: ProjectData
  prd_content: string | null
  created_at: string
  updated_at: string
}

export function ProjectsContent() {
  const router = useRouter()
  const { canCreateQuiz, loading: roleLoading } = useUserRole()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creatingQuizFromProject, setCreatingQuizFromProject] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Erro ao carregar projetos")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar projetos", {
        description: "Tente recarregar a página.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    const projectName = project?.name || "este projeto"

    setDeletingId(id)

    toast.promise(
      async () => {
        const response = await fetch(`/api/projects?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Erro ao deletar projeto")

        setProjects(projects.filter((p) => p.id !== id))
        setDeletingId(null)
        return projectName
      },
      {
        loading: "Deletando projeto...",
        success: (name) => `"${name}" foi deletado com sucesso!`,
        error: () => {
          setDeletingId(null)
          return "Erro ao deletar projeto. Tente novamente."
        },
      }
    )
  }

  const handleViewProject = (project: Project) => {
    // Salvar projeto e ID no localStorage para carregar na página principal
    localStorage.setItem("selectedProject", JSON.stringify(project.project_data))
    localStorage.setItem("selectedProjectId", project.id)
    toast.success("Projeto carregado!", {
      description: `"${project.name}" foi carregado com sucesso.`,
    })
    router.push("/")
  }

  const handleCreateQuizFromProject = async (project: Project) => {
    if (!canCreateQuiz) {
      toast.error("Apenas administradores e gerentes podem criar quizzes")
      return
    }

    setCreatingQuizFromProject(project.id)

    try {
      // Usar prd_content se existir, senão gerar template a partir dos dados do projeto
      let documentsContent = project.prd_content

      if (!documentsContent || documentsContent.trim().length < 500) {
        // Gerar conteúdo a partir dos dados do projeto
        documentsContent = generatePRDTemplate(project.project_data)
      }

      // Salvar dados no sessionStorage para pré-preencher o formulário de quiz
      sessionStorage.setItem("quizFromProject", JSON.stringify({
        title: `Quiz: ${project.name}`,
        description: `Quiz baseado no projeto "${project.name}"`,
        documents_content: documentsContent,
        project_id: project.id,
        project_name: project.name
      }))

      // Redirecionar para página de criação de quiz
      router.push("/quiz/create")
      toast.success("Redirecionando para criação de quiz...", {
        description: `Usando informações do projeto "${project.name}"`,
      })
    } catch (error: any) {
      console.error("Erro ao preparar quiz:", error)
      toast.error("Erro ao criar quiz a partir do projeto")
    } finally {
      setCreatingQuizFromProject(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto pt-6">
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-bold mb-2 text-foreground flex items-center gap-2">
            <FolderOpen className="h-8 w-8" />
            Meus Projetos
          </h1>
          <p className="text-muted-foreground">
            Gerencie e visualize seus projetos salvos
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="shadow-lg mx-2">
            <CardContent className="py-16 text-center px-6">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum projeto salvo</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando um novo projeto na página principal
              </p>
              <Button onClick={() => router.push("/")}>
                Criar Projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 pb-6">
            {projects.map((project) => (
              <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.project_data.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.project_data.description}
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewProject(project)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                    <Button
                      onClick={() => handleDelete(project.id)}
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                    </div>
                    {canCreateQuiz && (
                      <Button
                        onClick={() => handleCreateQuizFromProject(project)}
                        variant="outline"
                        size="sm"
                        disabled={creatingQuizFromProject === project.id}
                        className="w-full"
                      >
                        {creatingQuizFromProject === project.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Preparando...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Criar Quiz
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

