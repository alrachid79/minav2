import Link from "next/link";
import { redirect } from "next/navigation";

import { RecoveryPlanView } from "@/components/recovery/RecoveryPlanView";
import { logProductEvent } from "@/lib/analytics/log-product-event";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { loadRecoveryPlanSnapshot } from "@/lib/recovery/load-recovery-plan-snapshot";
import { createClient } from "@/lib/supabase/server";

export default async function RecoveryPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/recovery");
  }

  const snapshot = await loadRecoveryPlanSnapshot(supabase, user.id);

  await logProductEvent(supabase, {
    userId: user.id,
    eventType: PRODUCT_EVENTS.RECOVERY_PLAN_OPENED,
    payload: { recoveryScore: snapshot.recoveryScore },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0F172A]">
      <header className="border-b border-white/8 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017] transition hover:text-white"
          >
            ← Dashboard
          </Link>
          <div className="rounded-2xl border border-white/8 bg-[#162033] px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
              Financial Stress Recovery Coach
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mina Recovery Plan
            </h1>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-white/60">
              A calm plan to move from pressure to control.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-8 sm:px-6">
        <RecoveryPlanView snapshot={snapshot} />
      </main>
    </div>
  );
}
