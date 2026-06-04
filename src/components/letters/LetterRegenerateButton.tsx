"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { regenerateLetter } from "@/app/actions/letter-management";

interface LetterRegenerateButtonProps {
  letterId: string;
}

export function LetterRegenerateButton({ letterId }: LetterRegenerateButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    setError(null);

    startTransition(async () => {
      const result = await regenerateLetter({ letterId });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
        Regenerate
      </p>
      <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
        Create a fresh draft
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
        Mina rebuilds the letter from your linked profile, entities, and document
        intelligence. The current version is preserved in history.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isPending}
        className="mt-6 w-full rounded-xl border border-[#0F172A]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] transition hover:border-[#14B8A6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Regenerating..." : "Regenerate letter"}
      </button>
    </div>
  );
}
