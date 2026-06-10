import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SituationDetailView } from "@/components/situations/SituationDetailView";
import { logProductEvent } from "@/lib/analytics/log-product-event";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { loadSituationDetail } from "@/lib/situations/load-situation-detail";
import { createClient } from "@/lib/supabase/server";

interface SituationDetailPageProps {
  params: Promise<{ situationId: string }>;
}

export default async function SituationDetailPage({ params }: SituationDetailPageProps) {
  const { situationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/situations/${situationId}`);
  }

  const situation = await loadSituationDetail(supabase, user.id, situationId);

  if (!situation) {
    notFound();
  }

  await logProductEvent(supabase, {
    userId: user.id,
    eventType: PRODUCT_EVENTS.SITUATION_OPENED,
    payload: { view: "detail", situationId },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0F172A]">
      <header className="border-b border-white/8 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <Link
            href="/situations"
            className="mb-4 inline-flex text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017] transition hover:text-white"
          >
            ← My Situation
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6 pb-10 sm:px-6">
        <SituationDetailView situation={situation} />
      </main>
    </div>
  );
}
