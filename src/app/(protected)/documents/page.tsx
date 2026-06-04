import Link from "next/link";

import { DocumentUploadArea } from "@/components/documents/DocumentUploadArea";

export default function DocumentsPage() {
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
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#D4A017]">
              Document Analysis
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Upload a document
            </h1>
            <p className="max-w-[36ch] text-sm leading-relaxed text-white/75">
              Letters, notices, and statements — stored securely until Mina
              analyzes them.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-8 sm:px-6">
        <DocumentUploadArea />
      </main>
    </div>
  );
}
