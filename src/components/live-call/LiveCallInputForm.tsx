"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitLiveCallInput } from "@/app/actions/live-call";

interface LiveCallInputFormProps {
  sessionId: string;
  disabled?: boolean;
}

export function LiveCallInputForm({ sessionId, disabled = false }: LiveCallInputFormProps) {
  const router = useRouter();
  const [collectorSaid, setCollectorSaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = collectorSaid.trim();

    if (!trimmed) {
      setError("Enter what the caller said before submitting.");
      return;
    }

    startTransition(async () => {
      const result = await submitLiveCallInput({
        sessionId,
        collectorSaid: trimmed,
        notes: notes.trim() || undefined,
      });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      setCollectorSaid("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-4">
      <div className="space-y-2">
        <label htmlFor="collector-said" className="block text-sm font-medium text-[#0F172A]">
          What was said
        </label>
        <textarea
          id="collector-said"
          value={collectorSaid}
          onChange={(event) => setCollectorSaid(event.target.value)}
          disabled={disabled || isPending}
          rows={4}
          placeholder="Type or paste what the caller or collector said…"
          className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 disabled:bg-[#F8FAFC]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="call-notes" className="block text-sm font-medium text-[#0F172A]">
          Your notes <span className="font-normal text-[#64748B]">(optional)</span>
        </label>
        <textarea
          id="call-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={disabled || isPending}
          rows={2}
          placeholder="How you're feeling, context, or anything you want Mina to consider…"
          className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 disabled:bg-[#F8FAFC]"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="w-full rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Getting guidance…" : "Get Mina guidance"}
      </button>
    </form>
  );
}
