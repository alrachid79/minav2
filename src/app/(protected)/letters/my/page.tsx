import Link from "next/link";

import { listMyLetters } from "@/app/actions/letter-management";
import { LetterList } from "@/components/letters/LetterList";

export default async function MyLettersPage() {
  const result = await listMyLetters();

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-[#0F172A] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              ← Dashboard
            </Link>
            <Link
              href="/letters"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              New letter
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#D4A017]">
              Letter Generator
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              My Letters
            </h1>
            <p className="max-w-[36ch] text-sm leading-relaxed text-white/75">
              Review your drafts, version history, and exports in one place.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-8 sm:px-6">
        {result.status === "error" ? (
          <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {result.message}
          </p>
        ) : (
          <LetterList letters={result.letters} />
        )}
      </main>
    </div>
  );
}
