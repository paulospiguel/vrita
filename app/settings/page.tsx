import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsContent } from "@/components/settings/settings-content"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth")
    }

    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <SettingsContent user={user} />
        </div>
      </main>
    )
  } catch (error) {
    redirect("/auth")
  }
}
