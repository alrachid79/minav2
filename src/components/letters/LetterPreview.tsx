import { formatLetterPreview } from "@/lib/letters/templates";
import type { LetterVersionContent } from "@/types/letters";

interface LetterPreviewProps {
  content: LetterVersionContent;
  generatedAt: string;
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function LetterPreview({ content, generatedAt }: LetterPreviewProps) {
  const previewText = formatLetterPreview(content);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Letter type
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
              {content.letter_type_label}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Generated
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
              {formatDisplayDate(generatedAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          Preview
        </p>
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-[#111827]">
          {previewText}
        </pre>
      </div>

      <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-6 py-5">
        <p className="text-sm leading-relaxed text-[#92400E]">{content.disclaimer}</p>
      </div>
    </div>
  );
}
