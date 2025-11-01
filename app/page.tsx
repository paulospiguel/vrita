import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TabsLayout } from "@/components/layout/tabs-layout"

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth")
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <TabsLayout />
      </main>
    )
  } catch (error) {
    redirect("/auth")
  }
}
