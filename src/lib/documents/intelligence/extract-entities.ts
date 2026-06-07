import { getDocumentLines } from "@/lib/documents/intelligence/normalize";
import {
  createEmptyConfidenceMap,
  setConfidence,
  type EntityConfidenceMap,
} from "@/lib/documents/intelligence/entity-confidence";
import type { ExtractedEntities } from "@/lib/documents/intelligence/types";

const PHONE_PATTERN =
  /(?:\+?1[\s.-]?)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const MONEY_PATTERN = /\$\s*[\d,]+(?:\.\d{2})?/g;

const DATE_PATTERN =
  /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4})\b/gi;

const CITY_STATE_ZIP_PATTERN =
  /\d{1,6}\s+[A-Za-z0-9.\s,'#-]+,\s*[A-Za-z.\s'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;

const PO_BOX_PATTERN =
  /P\.?\s*O\.?\s*Box\s+\d+[A-Za-z0-9\s,#-]*/gi;

const STREET_ADDRESS_PATTERN =
  /\d{1,6}\s+(?:[A-Za-z0-9.'#-]+\s+){1,8}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Circle|Cir|Parkway|Pkwy)(?:\s+(?:Suite|Ste|#|Apt|Apartment|Unit)\s*[#\w-]+)?/gi;

const COLLECTOR_SUFFIX_PATTERN =
  /\b([A-Z][A-Za-z0-9&.,'\- ]{2,80}(?:Collection|Collections|Recovery|Receivables|Credit Services|Agency|Financial|Capital|Portfolio|LLC|L\.L\.C\.|Inc|Corp))\b/;

const ACCOUNT_INLINE_PATTERN =
  /(?:account|reference|acct|ref|file|case)\s*(?:number|#|no\.?)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/i;

export interface EntityExtractionResult {
  entities: ExtractedEntities;
  confidences: EntityConfidenceMap;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanValue(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s:;#\-]+/, "")
    .replace(/[\s,;]+$/, "")
    .trim();
}

function toFlatText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[0]?.trim() ?? null;
}

function firstCapture(text: string, pattern: RegExp): string | null {
  const match = pattern.exec(text);
  return match?.[1] ? cleanValue(match[1]) : null;
}

function findAllDates(text: string): string[] {
  return [...text.matchAll(DATE_PATTERN)].map((match) => match[0].trim());
}

function findDateNearKeywords(
  text: string,
  keywords: string[],
  windowSize = 140,
): { value: string; confidence: number } | null {
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword);

    if (index === -1) {
      continue;
    }

    const window = text.slice(index, index + windowSize);
    const dateMatch = window.match(DATE_PATTERN);

    if (dateMatch?.[0]) {
      return { value: dateMatch[0].trim(), confidence: 0.72 };
    }
  }

  return null;
}

function extractLabeledField(
  lines: string[],
  labels: string[],
): { value: string; confidence: number } | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const label of labels) {
      const inlinePattern = new RegExp(
        `^${escapeRegex(label)}\\s*[:#\\-]?\\s*(.+)$`,
        "i",
      );
      const inlineMatch = line.match(inlinePattern);

      if (inlineMatch?.[1]) {
        const value = cleanValue(inlineMatch[1]);

        if (value.length > 0) {
          return { value, confidence: 0.88 };
        }
      }

      const labelOnlyPattern = new RegExp(
        `^${escapeRegex(label)}\\s*[:#\\-]?\\s*$`,
        "i",
      );

      if (labelOnlyPattern.test(line) && lines[index + 1]) {
        const value = cleanValue(lines[index + 1]);

        if (value.length > 0) {
          return { value, confidence: 0.76 };
        }
      }
    }
  }

  return null;
}

function extractBlockAfterLabel(
  lines: string[],
  labels: string[],
  maxLines = 3,
): { value: string; confidence: number } | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const label of labels) {
      const startsBlock = new RegExp(`^${escapeRegex(label)}\\s*[:#\\-]?\\s*(.*)$`, "i");
      const match = line.match(startsBlock);

      if (!match) {
        continue;
      }

      const block: string[] = [];

      if (match[1]?.trim()) {
        block.push(cleanValue(match[1]));
      }

      for (let offset = 1; offset <= maxLines && index + offset < lines.length; offset += 1) {
        const nextLine = lines[index + offset];

        if (
          /^(date|account|reference|creditor|phone|email|balance|amount)\s*[:#]/i.test(
            nextLine,
          )
        ) {
          break;
        }

        block.push(nextLine);
      }

      const value = cleanValue(block.join(", "));

      if (value.length > 0) {
        return { value, confidence: 0.74 };
      }
    }
  }

  return null;
}

function findLetterheadSender(lines: string[]): { value: string; confidence: number } | null {
  for (const line of lines.slice(0, 10)) {
    if (line.length < 4 || line.length > 90) {
      continue;
    }

    if (DATE_PATTERN.test(line) || PHONE_PATTERN.test(line) || EMAIL_PATTERN.test(line)) {
      continue;
    }

    if (/^(re|attn|attention|dear|date|account|reference)\s*[:#]/i.test(line)) {
      continue;
    }

    const alphaRatio =
      (line.match(/[A-Za-z]/g)?.length ?? 0) / Math.max(line.length, 1);

    if (alphaRatio > 0.55 && /[A-Za-z]/.test(line)) {
      return { value: line.replace(/\s{2,}/g, " ").trim(), confidence: 0.58 };
    }
  }

  return null;
}

function findRecipientName(lines: string[]): { value: string; confidence: number } | null {
  const labeled = extractLabeledField(lines, [
    "re",
    "attn",
    "attention",
    "account holder",
    "customer",
    "consumer",
  ]);

  if (labeled) {
    return { ...labeled, confidence: 0.7 };
  }

  for (const line of lines) {
    const dearMatch = line.match(/^dear\s+(.+)$/i);

    if (dearMatch?.[1]) {
      const value = cleanValue(dearMatch[1]);

      if (value.length > 0) {
        return { value, confidence: 0.62 };
      }
    }
  }

  return null;
}

function findAddresses(text: string, lines: string[]): { value: string; confidence: number } | null {
  const labeled = extractBlockAfterLabel(lines, ["mail to", "mailing address", "address", "remit to"]);

  if (labeled) {
    return labeled;
  }

  const poBox = firstMatch(text, PO_BOX_PATTERN);

  if (poBox) {
    return { value: poBox, confidence: 0.78 };
  }

  const cityStateZip = firstMatch(text, CITY_STATE_ZIP_PATTERN);

  if (cityStateZip) {
    return { value: cityStateZip, confidence: 0.82 };
  }

  const street = firstMatch(text, STREET_ADDRESS_PATTERN);

  if (street) {
    return { value: street, confidence: 0.68 };
  }

  return null;
}

function findLargestBalance(text: string): string | null {
  const matches = text.match(MONEY_PATTERN);

  if (!matches || matches.length === 0) {
    return null;
  }

  const nearBalance = text.match(
    /(?:balance|amount due|total due|you owe|pay|current balance)\s*(?:of|:)?\s*(\$\s*[\d,]+(?:\.\d{2})?)/i,
  );

  if (nearBalance?.[1]) {
    return nearBalance[1].replace(/\s+/g, "");
  }

  let largest = matches[0];
  let largestValue = 0;

  for (const amount of matches) {
    const numeric = Number(amount.replace(/[^\d.]/g, ""));

    if (numeric > largestValue) {
      largestValue = numeric;
      largest = amount;
    }
  }

  return largest.replace(/\s+/g, "");
}

function assignField(
  entities: ExtractedEntities,
  confidences: EntityConfidenceMap,
  key: keyof ExtractedEntities,
  candidate: { value: string; confidence: number } | null,
): void {
  if (!candidate?.value) {
    return;
  }

  const existingConfidence = confidences[key];

  if (entities[key] === null || (existingConfidence ?? 0) < candidate.confidence) {
    entities[key] = candidate.value;
    confidences[key] = candidate.confidence;
  }
}

export function extractEntities(rawText: string): EntityExtractionResult {
  const lines = getDocumentLines(rawText);
  const flatText = toFlatText(rawText);
  const entities: ExtractedEntities = {
    senderName: null,
    collectorName: null,
    creditorName: null,
    balanceAmount: null,
    balanceCurrency: null,
    accountReference: null,
    documentDate: null,
    responseDeadline: null,
    courtDate: null,
    contactPhone: null,
    contactEmail: null,
    contactAddress: null,
  };
  const confidences = createEmptyConfidenceMap();

  const documentDateLabeled = extractLabeledField(lines, [
    "notice date",
    "letter date",
    "document date",
    "date of notice",
    "date",
  ]);
  const allDates = findAllDates(flatText);

  assignField(entities, confidences, "documentDate", documentDateLabeled);

  if (!entities.documentDate && allDates[0]) {
    entities.documentDate = allDates[0];
    setConfidence(confidences, "documentDate", 0.52);
  }

  assignField(
    entities,
    confidences,
    "responseDeadline",
    extractLabeledField(lines, [
      "response due",
      "respond by",
      "response deadline",
      "deadline",
      "due by",
      "must respond by",
      "last day to respond",
    ]) ??
      findDateNearKeywords(flatText, [
        "respond by",
        "response due",
        "due by",
        "within",
        "deadline",
        "must respond",
      ]),
  );

  assignField(
    entities,
    confidences,
    "courtDate",
    findDateNearKeywords(flatText, [
      "court date",
      "hearing",
      "appear on",
      "trial date",
      "appearance date",
    ]),
  );

  const creditorInline = firstCapture(
    flatText,
    /(?:original creditor|current creditor|creditor)\s*[:\-]\s*([^\n\r]{3,120})/i,
  );

  assignField(
    entities,
    confidences,
    "creditorName",
    extractLabeledField(lines, [
      "original creditor",
      "current creditor",
      "creditor",
      "original account creditor",
    ]) ??
      (creditorInline ? { value: creditorInline, confidence: 0.7 } : null),
  );

  assignField(
    entities,
    confidences,
    "accountReference",
    extractLabeledField(lines, [
      "account number",
      "reference number",
      "account #",
      "reference #",
      "acct #",
      "ref #",
      "file number",
      "case number",
      "account no",
      "reference no",
    ]) ??
      (firstCapture(flatText, ACCOUNT_INLINE_PATTERN)
        ? {
            value: firstCapture(flatText, ACCOUNT_INLINE_PATTERN)!,
            confidence: 0.7,
          }
        : null),
  );

  assignField(
    entities,
    confidences,
    "collectorName",
    (firstCapture(flatText, COLLECTOR_SUFFIX_PATTERN)
      ? {
          value: firstCapture(flatText, COLLECTOR_SUFFIX_PATTERN)!,
          confidence: 0.66,
        }
      : null),
  );

  assignField(
    entities,
    confidences,
    "senderName",
    extractLabeledField(lines, ["from", "sender", "return address", "sent by"]) ??
      findLetterheadSender(lines),
  );

  const recipient = findRecipientName(lines);

  if (!entities.senderName && recipient) {
    assignField(entities, confidences, "senderName", recipient);
  }

  assignField(entities, confidences, "contactAddress", findAddresses(flatText, lines));

  const phones = flatText.match(PHONE_PATTERN) ?? [];
  const emails = flatText.match(EMAIL_PATTERN) ?? [];

  if (phones[0]) {
    entities.contactPhone = phones[0].trim();
    setConfidence(confidences, "contactPhone", 0.85);
  }

  if (emails[0]) {
    entities.contactEmail = emails[0].trim();
    setConfidence(confidences, "contactEmail", 0.88);
  }

  const balanceAmount = findLargestBalance(flatText);

  if (balanceAmount) {
    entities.balanceAmount = balanceAmount;
    entities.balanceCurrency = "USD";
    setConfidence(confidences, "balanceAmount", 0.75);
    setConfidence(confidences, "balanceCurrency", 0.9);
  }

  return { entities, confidences };
}
