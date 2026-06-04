import Link from "next/link";

import { getLetterGeneratorContext } from "@/app/actions/get-letter-generator-context";
import { LetterGeneratorForm } from "@/components/letters/LetterGeneratorForm";

export default async function LettersPage() {
  const context = await getLetterGeneratorContext();

  if ("error" in context) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:px-6">
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {context.error}
        </p>
      </div>
    );
  }

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
              href="/letters/my"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              My Letters
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#D4A017]">
              Letter Generator
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Draft a letter
            </h1>
            <p className="max-w-[36ch] text-sm leading-relaxed text-white/75">
              Choose a letter type and link account context. Mina generates an
              educational draft you can review.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-8 sm:px-6">
        <LetterGeneratorForm context={context} />
      </main>
    </div>
  );
}
