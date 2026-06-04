"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createLiveCallSession } from "@/app/actions/live-call";

export function LiveCallStartButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);

    startTransition(async () => {
      const result = await createLiveCallSession();

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      router.push(`/live-call/${result.sessionId}`);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="w-full rounded-xl bg-[#D4A017] px-4 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-[#E4B429] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Starting session…" : "Start call session"}
      </button>
      {error ? (
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
