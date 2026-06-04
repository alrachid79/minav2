import "server-only";

import { readConfirmedFieldValue } from "@/lib/documents/integration/confirmed-field-utils";
import {
  DOCUMENT_ANALYSIS_SOURCE_FEATURE,
  TIMELINE_EVENT_TYPE_LABELS,
  type TimelineEventSeverity,
  type TimelineEventType,
} from "@/lib/documents/integration/timeline/constants";
import {
  isFutureTimelineDate,
  parseTimelineDate,
} from "@/lib/documents/integration/timeline/parse-date";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentType } from "@/lib/documents/intelligence/types";

export interface TimelineEventDraft {
  eventType: TimelineEventType;
  title: string;
  summary: string;
  occurredAt: string;
  eventCategory: "past_event" | "upcoming_deadline";
  severity: TimelineEventSeverity;
}

export interface BuildTimelineEventDraftsInput {
  documentId: string;
  originalFilename: string;
  documentCreatedAt: string;
  analysisCompletedAt: string | null;
  confirmedAt: string;
  integratedAt: string;
  confirmedData: DocumentConfirmedData;
  collectorId: string | null;
}

function baseDraft(input: {
  eventType: TimelineEventType;
  summary: string;
  occurredAt: string;
  eventCategory: "past_event" | "upcoming_deadline";
  severity: TimelineEventSeverity;
}): TimelineEventDraft {
  return {
    eventType: input.eventType,
    title: TIMELINE_EVENT_TYPE_LABELS[input.eventType],
    summary: input.summary,
    occurredAt: input.occurredAt,
    eventCategory: input.eventCategory,
    severity: input.severity,
  };
}

function hasDeadlineInformation(confirmedData: DocumentConfirmedData): boolean {
  return (
    readConfirmedFieldValue(confirmedData.response_deadline) !== null ||
    readConfirmedFieldValue(confirmedData.court_date) !== null
  );
}

function buildDeadlineSummary(confirmedData: DocumentConfirmedData): string {
  const responseDeadline = readConfirmedFieldValue(confirmedData.response_deadline);
  const courtDate = readConfirmedFieldValue(confirmedData.court_date);
  const parts: string[] = [];

  if (responseDeadline) {
    parts.push(`Response deadline: ${responseDeadline}`);
  }

  if (courtDate) {
    parts.push(`Court date: ${courtDate}`);
  }

  return parts.join(" · ");
}

function resolveDeadlineOccurredAt(confirmedData: DocumentConfirmedData): string | null {
  const responseDeadline = readConfirmedFieldValue(confirmedData.response_deadline);
  const courtDate = readConfirmedFieldValue(confirmedData.court_date);

  const parsedResponse = responseDeadline
    ? parseTimelineDate(responseDeadline)
    : null;
  const parsedCourt = courtDate ? parseTimelineDate(courtDate) : null;
  const candidate = parsedResponse ?? parsedCourt;

  return candidate;
}

export function buildTimelineEventDrafts(
  input: BuildTimelineEventDraftsInput,
): TimelineEventDraft[] {
  const drafts: TimelineEventDraft[] = [];
  const documentType = input.confirmedData.document_type;

  drafts.push(
    baseDraft({
      eventType: "document_uploaded",
      summary: `Uploaded ${input.originalFilename}.`,
      occurredAt: input.documentCreatedAt,
      eventCategory: "past_event",
      severity: "info",
    }),
  );

  if (input.analysisCompletedAt) {
    drafts.push(
      baseDraft({
        eventType: "document_analyzed",
        summary: `Mina analyzed ${input.originalFilename}.`,
        occurredAt: input.analysisCompletedAt,
        eventCategory: "past_event",
        severity: "info",
      }),
    );
  }

  drafts.push(
    baseDraft({
      eventType: "document_confirmed",
      summary: `You confirmed the details Mina found in ${input.originalFilename}.`,
      occurredAt: input.confirmedAt,
      eventCategory: "past_event",
      severity: "info",
    }),
  );

  drafts.push(
    baseDraft({
      eventType: "document_integrated",
      summary: `Document linked to Mina shared records for ${input.originalFilename}.`,
      occurredAt: input.integratedAt,
      eventCategory: "past_event",
      severity: "info",
    }),
  );

  if (hasDeadlineInformation(input.confirmedData)) {
    const deadlineAt = resolveDeadlineOccurredAt(input.confirmedData);

    if (deadlineAt) {
      drafts.push(
        baseDraft({
          eventType: "deadline_detected",
          summary: buildDeadlineSummary(input.confirmedData),
          occurredAt: deadlineAt,
          eventCategory: isFutureTimelineDate(deadlineAt)
            ? "upcoming_deadline"
            : "past_event",
          severity: "attention",
        }),
      );
    }
  }

  if (documentType === "settlement_offer") {
    drafts.push(
      baseDraft({
        eventType: "settlement_offer_detected",
        summary: `Settlement offer identified in ${input.originalFilename}.`,
        occurredAt: input.confirmedAt,
        eventCategory: "past_event",
        severity: "attention",
      }),
    );
  }

  if (
    documentType === "court_lawsuit_notice" ||
    readConfirmedFieldValue(input.confirmedData.court_date) !== null
  ) {
    drafts.push(
      baseDraft({
        eventType: "court_notice_detected",
        summary: `Court or lawsuit language identified in ${input.originalFilename}.`,
        occurredAt: input.confirmedAt,
        eventCategory: "past_event",
        severity: "attention",
      }),
    );
  }

  if (documentType === "irs_notice") {
    drafts.push(
      baseDraft({
        eventType: "irs_notice_detected",
        summary: `IRS notice identified in ${input.originalFilename}.`,
        occurredAt: input.confirmedAt,
        eventCategory: "past_event",
        severity: "attention",
      }),
    );
  }

  return drafts;
}

export function getTimelineSourceFeature(): string {
  return DOCUMENT_ANALYSIS_SOURCE_FEATURE;
}

export type { DocumentType };
