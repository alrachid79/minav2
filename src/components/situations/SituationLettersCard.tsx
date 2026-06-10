import Link from "next/link";

import type { SituationLetterItem } from "@/types/situations";

interface SituationLettersCardProps {
  letters: SituationLetterItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SituationLettersCard({ letters }: SituationLettersCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Letters</p>

      {letters.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No letters linked yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {letters.map((letter) => (
            <li key={letter.id}>
              <Link
                href={`/letters/${letter.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3 transition hover:border-[#D4A017]/25"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {letter.letterTypeLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">{formatDate(letter.createdAt)}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                  {letter.statusLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
