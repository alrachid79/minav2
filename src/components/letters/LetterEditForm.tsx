"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveLetterEdits } from "@/app/actions/letter-management";
import { LETTER_EDUCATIONAL_DISCLAIMER } from "@/lib/letters/constants";
import type { LetterVersionContent } from "@/types/letters";

interface LetterEditFormProps {
  letterId: string;
  content: LetterVersionContent;
}

export function LetterEditForm({ letterId, content }: LetterEditFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(content.subject);
  const [greeting, setGreeting] = useState(content.greeting);
  const [body, setBody] = useState(content.body);
  const [closing, setClosing] = useState(content.closing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);

    startTransition(async () => {
      const result = await saveLetterEdits({
        letterId,
        subject,
        greeting,
        body,
        closing,
      });

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
        Edit before export
      </p>
      <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
        Update the current draft
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
        Saving creates a new version. Previous versions stay in history.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#0F172A]">Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-xl border border-[#0F172A]/15 px-4 py-3 text-sm text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#0F172A]">Greeting</span>
          <input
            value={greeting}
            onChange={(event) => setGreeting(event.target.value)}
            className="w-full rounded-xl border border-[#0F172A]/15 px-4 py-3 text-sm text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#0F172A]">Body</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            className="w-full rounded-xl border border-[#0F172A]/15 px-4 py-3 text-sm leading-6 text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#0F172A]">Closing</span>
          <textarea
            value={closing}
            onChange={(event) => setClosing(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[#0F172A]/15 px-4 py-3 text-sm leading-6 text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
          />
        </label>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
        {LETTER_EDUCATIONAL_DISCLAIMER}
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-6 w-full rounded-xl bg-[#14B8A6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving new version..." : "Save as new version"}
      </button>
    </div>
  );
}
