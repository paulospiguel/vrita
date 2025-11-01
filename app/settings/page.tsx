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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <SettingsContent user={user} />
        </div>
      </main>
    )
  } catch (error) {
    redirect("/auth")
  }
}
