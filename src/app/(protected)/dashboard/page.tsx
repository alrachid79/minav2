import { redirect } from "next/navigation";

import { OnboardingTransferStatus } from "@/components/dashboard/OnboardingTransferStatus";
import { DashboardExperience } from "@/components/dashboard/DashboardExperience";
import { DemoExperiencePrompt } from "@/components/dashboard/DemoExperiencePrompt";
import { ensureDemoExperience } from "@/lib/demo/seed-demo-experience";
import { loadDashboardSnapshot } from "@/lib/dashboard/load-dashboard-snapshot";
import { createClient } from "@/lib/supabase/server";

async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  await ensureDemoExperience(supabase, user.id);
  const snapshot = await loadDashboardSnapshot(supabase, user.id);

  const { count: activeSituationCount } = await supabase
    .from("debt_situations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 border-b border-[#0F172A]/10 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">Mina</p>
            <p className="truncate text-xs text-[#6B7280]">Command center</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-xl border border-[#0F172A]/15 px-3.5 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <OnboardingTransferStatus />
          <DemoExperiencePrompt visible={(activeSituationCount ?? 0) === 0} />
          <DashboardExperience snapshot={snapshot} />
        </div>
      </main>
    </div>
  );
}
