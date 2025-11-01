import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabsLayout } from "@/components/layout/tabs-layout";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth");
    }

    return (
      <main className="min-h-screen bg-gray-50/50">
        <TabsLayout />
      </main>
    );
  } catch (error) {
    redirect("/auth");
  }
}
