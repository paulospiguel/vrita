import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SubscriptionPlans } from "@/components/subscription/subscription-plans"

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return <SubscriptionPlans />
}

