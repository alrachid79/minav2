import Link from "next/link";

import type { LetterListItem } from "@/types/letters";

interface LetterListProps {
  letters: LetterListItem[];
}

function formatDisplayDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function statusClassName(status: LetterListItem["status"]): string {
  switch (status) {
    case "exported":
      return "bg-[#F0FDFA] text-[#0F766E]";
    case "sent":
      return "bg-[#EFF6FF] text-[#1D4ED8]";
    case "finalized":
      return "bg-[#FFFBEB] text-[#92400E]";
    default:
      return "bg-[#F3F4F6] text-[#374151]";
  }
}

export function LetterList({ letters }: LetterListProps) {
  if (letters.length === 0) {
    return (
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm leading-relaxed text-[#6B7280]">
          You have not created any letters yet.
        </p>
        <Link
          href="/letters"
          className="mt-4 inline-block text-sm font-semibold text-[#14B8A6] hover:text-[#0F172A]"
        >
          Draft your first letter
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {letters.map((letter) => (
        <li key={letter.id}>
          <Link
            href={`/letters/${letter.id}`}
            className="block rounded-2xl border border-[#0F172A]/10 bg-white px-5 py-5 shadow-sm transition hover:border-[#14B8A6]/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0F172A]">
                  {letter.letter_type_label}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Created {formatDisplayDate(letter.created_at)} · Version{" "}
                  {letter.current_version}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName(letter.status)}`}
              >
                {letter.status_label}
              </span>
            </div>

            <dl className="mt-4 grid gap-2 text-xs text-[#6B7280] sm:grid-cols-2">
              <div>
                <dt className="font-medium uppercase tracking-[0.08em]">
                  Last exported
                </dt>
                <dd className="mt-1 text-sm text-[#111827]">
                  {formatDisplayDate(letter.last_exported_at)}
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-[0.08em]">
                  Linked document
                </dt>
                <dd className="mt-1 text-sm text-[#111827]">
                  {letter.document_filename ?? "None linked"}
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}
