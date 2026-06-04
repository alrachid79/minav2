import Link from "next/link";
import { notFound } from "next/navigation";

import { getLetter } from "@/app/actions/get-letter-generator-context";
import { LetterEditForm } from "@/components/letters/LetterEditForm";
import { LetterExportActions } from "@/components/letters/LetterExportActions";
import { LetterPreview } from "@/components/letters/LetterPreview";
import { LetterRegenerateButton } from "@/components/letters/LetterRegenerateButton";
import { LetterVersionHistory } from "@/components/letters/LetterVersionHistory";

interface LetterPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function LetterPreviewPage({ params }: LetterPreviewPageProps) {
  const { id } = await params;
  const result = await getLetter({ letterId: id });

  if (result.status === "error") {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-[#0F172A] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link
              href="/letters/my"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              ← My Letters
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
              Letter preview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {result.content.letter_type_label}
            </h1>
            <p className="max-w-[36ch] text-sm leading-relaxed text-white/75">
              Draft version {result.letter.current_version} — review before any
              next step.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <LetterPreview
            content={result.content}
            generatedAt={result.content.generated_at}
          />
          <LetterEditForm
            key={`${result.letter.current_version}-${result.content.generated_at}`}
            letterId={result.letter.id}
            content={result.content}
          />
          <LetterRegenerateButton letterId={result.letter.id} />
          <LetterVersionHistory
            versions={result.versions}
            currentVersion={result.letter.current_version}
          />
          <LetterExportActions
            letterId={result.letter.id}
            exportMetadata={result.exportMetadata}
          />
        </div>
      </main>
    </div>
  );
}
