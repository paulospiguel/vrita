import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProjectsContent } from "@/components/projects/projects-content"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth")
    }

    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ProjectsContent />
        </div>
      </main>
    )
  } catch (error) {
    redirect("/auth")
  }
}

