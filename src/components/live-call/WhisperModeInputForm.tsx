"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitLiveCallInput } from "@/app/actions/live-call";

interface WhisperModeInputFormProps {
  sessionId: string;
  disabled?: boolean;
}

export function WhisperModeInputForm({ sessionId, disabled = false }: WhisperModeInputFormProps) {
  const router = useRouter();
  const [collectorSaid, setCollectorSaid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = collectorSaid.trim();

    if (!trimmed) {
      setError("Enter what the collector said.");
      return;
    }

    startTransition(async () => {
      const result = await submitLiveCallInput({
        sessionId,
        collectorSaid: trimmed,
      });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      setCollectorSaid("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 shrink-0 space-y-2.5 border-t border-white/8 bg-[#0F172A] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
    >
      <label htmlFor="collector-said" className="sr-only">
        What the collector said
      </label>
      <textarea
        id="collector-said"
        value={collectorSaid}
        onChange={(event) => setCollectorSaid(event.target.value)}
        disabled={disabled || isPending}
        rows={2}
        placeholder="What did they just say?"
        className="w-full rounded-xl border border-white/12 bg-[#162033] px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/20 disabled:opacity-60"
      />

      {error ? (
        <p className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-white">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="w-full rounded-xl bg-[#D4A017] px-4 py-3.5 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Whispering…" : "Whisper next line"}
      </button>
    </form>
  );
}
