"use client";

import { useRef, useState } from "react";

import { processDocument } from "@/app/actions/process-document";
import { DocumentProcessingStatus } from "@/components/documents/DocumentProcessingStatus";
import { ACCEPTED_FILE_INPUT } from "@/lib/documents/constants";
import { MINA_GETTING_STARTED_COPY } from "@/lib/ui/empty-state-copy";
import {
  uploadDocument,
  validateDocumentFile,
} from "@/lib/documents/upload-client";
import { createClient } from "@/lib/supabase/client";

type UploadPhase = "idle" | "uploading" | "processing" | "error";

export function DocumentUploadArea() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const validation = validateDocumentFile(file);

    if (!validation.valid) {
      setPhase("error");
      setError(validation.message);
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setDocumentId(null);

    try {
      const supabase = createClient();
      const document = await uploadDocument({
        supabase,
        file,
        onProgress: setProgress,
      });

      // Start analysis on the server as soon as upload is ready. The server action
      // continues even if the user navigates away before the status UI mounts.
      console.info("[MINA_DIAG] processDocument client call attempted", {
        documentId: document.id,
        uploadStatus: document.upload_status,
      });
      void processDocument(document.id).catch((error: unknown) => {
        console.error("[MINA_DIAG] processDocument client rejection", {
          documentId: document.id,
          error,
        });
      });

      setDocumentId(document.id);
      setPhase("processing");
    } catch (uploadError) {
      setPhase("error");
      const rawMessage =
        uploadError instanceof Error ? uploadError.message : "Something went wrong during upload.";
      setError(
        rawMessage.toLowerCase().includes("network") ||
          rawMessage.toLowerCase().includes("fetch")
          ? "Upload failed — check your connection and try again."
          : rawMessage.toLowerCase().includes("storage")
            ? "We couldn't save your file. Try a smaller PDF or image."
            : "We couldn't upload that file. Try again or choose a different format.",
      );
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  function resetUpload() {
    setPhase("idle");
    setProgress(0);
    setError(null);
    setDocumentId(null);
  }

  return (
    <div className="space-y-6">
      {phase === "idle" || phase === "error" ? (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? "border-[#14B8A6] bg-[#14B8A6]/5"
              : "border-[#0F172A]/15 bg-[#F8FAFC]"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A]/5">
            <span className="text-2xl text-[#0F172A]" aria-hidden>
              ↑
            </span>
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Upload a document
          </h2>
          <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-[#6B7280]">
            {MINA_GETTING_STARTED_COPY} Upload a PDF, JPG, PNG, or HEIC up to 25 MB.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 min-h-[48px] rounded-lg bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] transition hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FILE_INPUT}
            capture="environment"
            className="sr-only"
            onChange={handleInputChange}
          />
          <p className="mt-4 text-xs text-[#6B7280]">
            On mobile, you can take a photo or pick from your library.
          </p>
        </div>
      ) : null}

      {phase === "uploading" ? (
        <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
          <p className="text-sm font-medium text-[#0F172A]">Uploading…</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Securely saving your file to Mina.
          </p>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#0F172A]/10">
            <div
              className="h-full rounded-full bg-[#D4A017] transition-all duration-300 ease-out"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-[#6B7280]">{progress}%</p>
        </div>
      ) : null}

      {phase === "processing" && documentId ? (
        <DocumentProcessingStatus
          documentId={documentId}
          analysisTriggeredExternally
          onReset={resetUpload}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
