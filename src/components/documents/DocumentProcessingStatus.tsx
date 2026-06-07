"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { getDocumentProcessingStatus } from "@/app/actions/get-document-processing";
import { processDocument } from "@/app/actions/process-document";
import { DocumentAnalysisCardsView } from "@/components/documents/DocumentAnalysisCards";
import { DocumentConfirmForm } from "@/components/documents/DocumentConfirmForm";
import { DocumentIntegrationPrompt } from "@/components/documents/DocumentIntegrationPrompt";
import { DocumentIntegrationSuccess } from "@/components/documents/DocumentIntegrationSuccess";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import type { DocumentType } from "@/lib/documents/intelligence/types";
import { getEntityIntegrationSummaryFromConfirmedData } from "@/lib/documents/integration/entity-summary";
import { getProcessingStateLabel } from "@/lib/documents/processing-state";
import { formatFileSize } from "@/lib/documents/upload-client";
import type { DocumentProcessingSnapshot } from "@/types/documents";

type ReviewView = "analysis" | "confirm";

interface DocumentProcessingStatusProps {
  documentId: string;
  /** When true, analysis was already kicked off after upload — UI only tracks status. */
  analysisTriggeredExternally?: boolean;
  autoStart?: boolean;
  onReset?: () => void;
}

function shouldPollProcessingState(
  processingState: DocumentProcessingSnapshot["processingState"],
): boolean {
  return processingState === "uploaded" || processingState === "processing";
}

export function DocumentProcessingStatus({
  documentId,
  analysisTriggeredExternally = false,
  autoStart = true,
  onReset,
}: DocumentProcessingStatusProps) {
  const [snapshot, setSnapshot] = useState<DocumentProcessingSnapshot | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasStarted, setHasStarted] = useState(false);
  const [reviewView, setReviewView] = useState<ReviewView>("analysis");

  const refreshStatus = useCallback(async () => {
    const result = await getDocumentProcessingStatus(documentId);

    if (result.status === "success") {
      setSnapshot(result.snapshot);
      return result.snapshot;
    }

    setError(result.message);
    return null;
  }, [documentId]);

  const runProcessing = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await processDocument(documentId);

      if (result.snapshot) {
        setSnapshot(result.snapshot);
      }

      if (result.status === "error") {
        setError(result.message);
      }
    });
  }, [documentId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!autoStart || hasStarted || !snapshot || analysisTriggeredExternally) {
      return;
    }

    const shouldStart =
      snapshot.processingState === "uploaded" ||
      (snapshot.processingState === "failed" && !snapshot.latestRun);

    if (shouldStart) {
      setHasStarted(true);
      runProcessing();
    }
  }, [
    analysisTriggeredExternally,
    autoStart,
    hasStarted,
    runProcessing,
    snapshot,
  ]);

  useEffect(() => {
    if (!snapshot || !shouldPollProcessingState(snapshot.processingState)) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshStatus, snapshot?.processingState]);

  useEffect(() => {
    if (!analysisTriggeredExternally || hasStarted || !snapshot) {
      return;
    }

    if (snapshot.processingState !== "uploaded" || snapshot.latestRun) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void refreshStatus().then((refreshed) => {
        if (
          refreshed?.processingState === "uploaded" &&
          !refreshed.latestRun
        ) {
          setHasStarted(true);
          runProcessing();
        }
      });
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    analysisTriggeredExternally,
    hasStarted,
    refreshStatus,
    runProcessing,
    snapshot,
  ]);

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-sm font-medium text-[#0F172A]">Loading status…</p>
      </div>
    );
  }

  const { document, latestRun, processingState, cards, legalAttentionRequired } =
    snapshot;
  const stateLabel = getProcessingStateLabel(processingState);
  const isProcessing =
    isPending ||
    processingState === "processing" ||
    processingState === "uploaded";
  const canRetry = processingState === "failed" && !isPending;
  const documentTypeLabel =
    document.document_type &&
    document.document_type in DOCUMENT_TYPE_LABELS
      ? DOCUMENT_TYPE_LABELS[document.document_type as DocumentType]
      : null;

  if (processingState === "integrated") {
    return (
      <div className="space-y-4">
        <DocumentIntegrationSuccess
          entities={getEntityIntegrationSummaryFromConfirmedData(
            document.confirmed_data,
          )}
          onUploadAnother={onReset}
        />
      </div>
    );
  }

  if (processingState === "confirmed") {
    return (
      <div className="space-y-4">
        <DocumentIntegrationPrompt
          documentId={documentId}
          onIntegrated={() => {
            void refreshStatus();
          }}
          onUploadAnother={onReset}
        />
      </div>
    );
  }

  if (reviewView === "confirm" && processingState === "analyzed") {
    return (
      <DocumentConfirmForm
        snapshot={snapshot}
        onBack={() => setReviewView("analysis")}
        onConfirmed={() => {
          setReviewView("analysis");
          void refreshStatus();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B7280]">
          Processing status
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">{stateLabel}</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          {isProcessing
            ? "Mina is reading your document, extracting text, and preparing a structured review."
            : processingState === "analyzed"
              ? "Review the analysis below, then confirm the details Mina found."
              : processingState === "extracted"
                ? "Text was extracted but analysis is not yet available."
                : processingState === "failed"
                  ? "Processing did not complete. You can try again."
                  : "Your file is saved securely."}
        </p>

        <dl className="mt-5 space-y-2 rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="font-medium text-[#6B7280]">Filename</dt>
            <dd className="text-[#0F172A]">{document.original_filename}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="font-medium text-[#6B7280]">Size</dt>
            <dd className="text-[#0F172A]">
              {formatFileSize(document.file_size_bytes)}
            </dd>
          </div>
          {document.page_count ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="font-medium text-[#6B7280]">Pages</dt>
              <dd className="text-[#0F172A]">{document.page_count}</dd>
            </div>
          ) : null}
          {documentTypeLabel ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="font-medium text-[#6B7280]">Classification</dt>
              <dd className="text-[#0F172A]">{documentTypeLabel}</dd>
            </div>
          ) : null}
          {latestRun?.run_number ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="font-medium text-[#6B7280]">Processing attempt</dt>
              <dd className="text-[#0F172A]">{latestRun.run_number}</dd>
            </div>
          ) : null}
        </dl>

        {isProcessing ? (
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0F172A]/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#D4A017]" />
            </div>
            <span className="text-xs font-medium text-[#6B7280]">Working…</span>
          </div>
        ) : null}
      </div>

      {processingState === "analyzed" && cards ? (
        <DocumentAnalysisCardsView
          cards={cards}
          extractedFields={snapshot.extractedFields}
          legalAttentionRequired={legalAttentionRequired}
          documentTypeLabel={documentTypeLabel}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {processingState === "analyzed" ? (
          <button
            type="button"
            onClick={() => setReviewView("confirm")}
            className="min-h-[48px] rounded-lg bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B]"
          >
            Review and confirm
          </button>
        ) : null}
        {canRetry ? (
          <button
            type="button"
            onClick={runProcessing}
            disabled={isPending}
            className="min-h-[44px] rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60"
          >
            Retry processing
          </button>
        ) : null}
        {processingState === "analyzed" || processingState === "failed" ? (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[44px] rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
          >
            Upload another document
          </button>
        ) : null}
      </div>
    </div>
  );
}
