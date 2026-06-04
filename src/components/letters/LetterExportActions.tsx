"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { exportLetter } from "@/app/actions/export-letter";
import type { LetterExportFormat, LetterExportMetadata } from "@/lib/letters/export/types";

interface LetterExportActionsProps {
  letterId: string;
  exportMetadata: LetterExportMetadata;
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

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function LetterExportActions({
  letterId,
  exportMetadata: initialExportMetadata,
}: LetterExportActionsProps) {
  const router = useRouter();
  const [exportMetadata, setExportMetadata] = useState(initialExportMetadata);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport(format: LetterExportFormat) {
    setError(null);

    startTransition(async () => {
      const result = await exportLetter({ letterId, format });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      setExportMetadata(result.exportMetadata);
      triggerDownload(result.downloadUrl, result.fileName);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          Export
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
          Download your draft
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Export a copy for your records. DOCX files can be edited in Word or
          Google Docs before you send anything on your own.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={isPending}
            className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Preparing..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={isPending}
            className="rounded-xl border border-[#0F172A]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] transition hover:border-[#14B8A6] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Preparing..." : "Download DOCX"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Export count
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
              {exportMetadata.count}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Last export
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
              {exportMetadata.last_exported_at
                ? formatDisplayDate(exportMetadata.last_exported_at)
                : "Not exported yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Last format
            </dt>
            <dd className="mt-1 text-sm font-semibold uppercase text-[#0F172A]">
              {exportMetadata.last_export_format ?? "—"}
            </dd>
          </div>
        </dl>

        {exportMetadata.history.length > 0 ? (
          <div className="mt-6 border-t border-[#0F172A]/10 pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
              Export history
            </p>
            <ul className="mt-3 space-y-2">
              {exportMetadata.history
                .slice()
                .reverse()
                .map((entry) => (
                  <li
                    key={`${entry.exported_at}-${entry.format}-${entry.storage_path}`}
                    className="flex items-center justify-between gap-3 text-sm text-[#111827]"
                  >
                    <span className="uppercase text-[#6B7280]">{entry.format}</span>
                    <span>{formatDisplayDate(entry.exported_at)}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
