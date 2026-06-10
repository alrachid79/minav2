import Link from "next/link";

import type { SituationDocumentItem } from "@/types/situations";

interface SituationDocumentsCardProps {
  documents: SituationDocumentItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SituationDocumentsCard({ documents }: SituationDocumentsCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Documents</p>

      {documents.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No documents linked yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href="/documents"
                className="block rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3 transition hover:border-[#D4A017]/25"
              >
                <p className="truncate text-sm font-semibold text-white">{document.label}</p>
                <p className="mt-0.5 text-xs text-white/45">
                  {document.documentTypeLabel} · {formatDate(document.confirmedAt ?? document.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
