import { getDocumentLines } from "@/lib/documents/intelligence/normalize";
import type { ExtractedEntities } from "@/lib/documents/intelligence/types";

const PHONE_PATTERN =
  /(?:\+?1[\s.-]?)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const MONEY_PATTERN = /\$\s*[\d,]+(?:\.\d{2})?/g;

const DATE_PATTERN =
  /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4})\b/gi;

const ACCOUNT_PATTERN =
  /(?:account|reference|file|case)\s*(?:number|#|no\.?)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/i;

const ADDRESS_PATTERN =
  /\d{1,6}\s+[A-Za-z0-9.\s,'-]+,\s*[A-Za-z.\s'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;

const COLLECTOR_PATTERN =
  /\b([A-Z][A-Za-z0-9&.,'\- ]{2,60}(?:Collection|Collections|Recovery|Receivables|Credit Services|Agency|Financial|Capital|Portfolio))\b/;

const CREDITOR_PATTERN =
  /(?:original creditor|creditor)\s*[:\-]\s*([^\n\r]{3,80})/i;

const SENDER_PATTERN = /(?:from|sender|return address)\s*[:\-]\s*([^\n\r]{3,80})/i;

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[0]?.trim() ?? null;
}

function findDateNearKeywords(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword);
    if (index === -1) {
      continue;
    }

    const window = text.slice(index, index + 120);
    const dateMatch = window.match(DATE_PATTERN);
    if (dateMatch?.[0]) {
      return dateMatch[0].trim();
    }
  }

  return null;
}

function findLetterheadSender(lines: string[]): string | null {
  for (const line of lines.slice(0, 8)) {
    if (line.length < 4 || line.length > 80) {
      continue;
    }

    if (DATE_PATTERN.test(line) || PHONE_PATTERN.test(line)) {
      continue;
    }

    const alphaRatio =
      (line.match(/[A-Za-z]/g)?.length ?? 0) / Math.max(line.length, 1);

    if (alphaRatio > 0.6 && /[A-Za-z]/.test(line)) {
      return line.replace(/\s{2,}/g, " ").trim();
    }
  }

  return null;
}

function findLargestBalance(text: string): string | null {
  const matches = text.match(MONEY_PATTERN);

  if (!matches || matches.length === 0) {
    return null;
  }

  const nearBalance = text.match(
    /(?:balance|amount due|total due|you owe|pay)\s*(?:of|:)?\s*(\$\s*[\d,]+(?:\.\d{2})?)/i,
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

export function extractEntities(rawText: string): ExtractedEntities {
  const lines = getDocumentLines(rawText);
  const text = rawText.replace(/\s+/g, " ").trim();

  const senderFromLabel = SENDER_PATTERN.exec(text)?.[1]?.trim() ?? null;
  const collectorFromPattern = COLLECTOR_PATTERN.exec(text)?.[1]?.trim() ?? null;
  const creditorFromPattern = CREDITOR_PATTERN.exec(text)?.[1]?.trim() ?? null;
  const accountReference = ACCOUNT_PATTERN.exec(text)?.[1]?.trim() ?? null;

  const phones = text.match(PHONE_PATTERN) ?? [];
  const emails = text.match(EMAIL_PATTERN) ?? [];
  const addresses = text.match(ADDRESS_PATTERN) ?? [];
  const dates = text.match(DATE_PATTERN) ?? [];

  const documentDate = dates[0]?.trim() ?? null;
  const responseDeadline = findDateNearKeywords(text, [
    "respond by",
    "response due",
    "due by",
    "within",
    "deadline",
    "must respond",
  ]);
  const courtDate = findDateNearKeywords(text, [
    "court date",
    "hearing",
    "appear on",
    "trial date",
    "appearance date",
  ]);

  const balanceAmount = findLargestBalance(text);

  return {
    senderName: senderFromLabel ?? findLetterheadSender(lines),
    collectorName: collectorFromPattern,
    creditorName: creditorFromPattern,
    balanceAmount,
    balanceCurrency: balanceAmount ? "USD" : null,
    accountReference,
    documentDate,
    responseDeadline,
    courtDate,
    contactPhone: phones[0]?.trim() ?? null,
    contactEmail: emails[0]?.trim() ?? null,
    contactAddress: addresses[0]?.trim() ?? null,
  };
}
