import { normalizeCallInput } from "@/lib/live-call/detect-pressure";

export interface ParsedCallInput {
  normalized: string;
  dollarAmounts: string[];
  bareAmount: string | null;
  settlementOfferAmount: string | null;
  balanceAmount: string | null;
  monthlyPaymentAmount: string | null;
  deadline: string | null;
  expiresToday: boolean;
  noMonthlyPayments: boolean;
  writtenOfferMention: boolean;
  monthlyPaymentMention: boolean;
  settlementMention: boolean;
  paymentDemand: boolean;
  legalThreat: boolean;
  lawsuitMention: boolean;
  garnishmentMention: boolean;
  courtMention: boolean;
  accountMention: boolean;
  identityMention: boolean;
  wrapUpMention: boolean;
  collectorName: string | null;
  creditorName: string | null;
  accountReference: string | null;
}

const DOLLAR_PATTERN = /\$[\d,]+(?:\.\d{2})?/g;
const BARE_AMOUNT_PATTERN =
  /\b(?:settle(?:ment)?(?:\s+offer)?|offer|for)\s+(?:of\s+)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/gi;
const STANDALONE_AMOUNT_PATTERN = /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g;

function formatMoney(raw: string): string {
  const cleaned = raw.replace(/,/g, "");
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) {
    return raw.startsWith("$") ? raw : `$${raw}`;
  }
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function extractBareSettlementAmount(text: string): string | null {
  const match = text.match(BARE_AMOUNT_PATTERN);
  if (match) {
    const digits = match[0].match(/\d[\d,]*(?:\.\d{2})?/);
    return digits ? formatMoney(digits[0]) : null;
  }

  if (/settlement\s+offer\s+\d/i.test(text)) {
    const digits = text.match(/settlement\s+offer\s+(\d[\d,]*)/i);
    return digits?.[1] ? formatMoney(digits[1]) : null;
  }

  return null;
}

function extractCollectorName(normalized: string): string | null {
  const patterns = [
    /this is ([a-z][a-z\s.'-]{1,40}?)(?: from| with| at|$)/,
    /my name is ([a-z][a-z\s.'-]{1,40}?)(?: from| with| at|$)/,
    /calling from ([a-z][a-z\s.'&-]{1,50})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  return null;
}

function extractCreditorName(normalized: string): string | null {
  const patterns = [
    /original creditor(?: is|:)? ([a-z0-9][a-z0-9\s.'&-]{1,40})/,
    /account with ([a-z0-9][a-z0-9\s.'&-]{1,40})/,
    /creditor(?: is|:)? ([a-z0-9][a-z0-9\s.'&-]{1,40})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  return null;
}

function extractAccountReference(normalized: string): string | null {
  const patterns = [
    /account (?:number|#|reference)(?: is|:)? ([a-z0-9-]{4,})/,
    /reference (?:number|#)(?: is|:)? ([a-z0-9-]{4,})/,
    /file number(?: is|:)? ([a-z0-9-]{4,})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

function extractDeadline(normalized: string): string | null {
  if (normalized.includes("expires today") || normalized.includes("offer expires today")) {
    return "Today";
  }

  const monthMatch = normalized.match(
    /\b(?:by\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}/,
  );
  if (monthMatch) {
    return monthMatch[0].replace(/^by\s+/, "").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const isPaymentUrgency =
    normalized.includes("pay today") ||
    normalized.includes("must pay") ||
    normalized.includes("due today") ||
    normalized.includes("pay now");

  if (!isPaymentUrgency && normalized.includes("today")) {
    return "Today";
  }

  return null;
}

const MONTHLY_PAYMENT_PATTERN =
  /\$?\s*([\d,]+(?:\.\d{2})?)\s*(?:per month|\/month|a month|monthly)/i;

function extractMonthlyPaymentAmount(text: string, normalized: string): string | null {
  const match = text.match(MONTHLY_PAYMENT_PATTERN);
  if (match?.[1]) {
    return formatMoney(match[1]);
  }

  if (normalized.includes("per month") || normalized.includes("monthly")) {
    const dollarMatch = text.match(/\$[\d,]+(?:\.\d{2})?/);
    if (dollarMatch) {
      return formatMoney(dollarMatch[0]);
    }
  }

  return null;
}

function extractBalanceAndOffer(
  normalized: string,
  dollarAmounts: string[],
): { balanceAmount: string | null; settlementOfferAmount: string | null } {
  if (dollarAmounts.length >= 2 && normalized.includes("balance")) {
    return {
      balanceAmount: dollarAmounts[0],
      settlementOfferAmount: dollarAmounts[1],
    };
  }

  if (dollarAmounts.length >= 2 && (normalized.includes("settle") || normalized.includes("settlement"))) {
    return {
      balanceAmount: dollarAmounts[0],
      settlementOfferAmount: dollarAmounts[dollarAmounts.length - 1],
    };
  }

  return {
    balanceAmount: normalized.includes("balance") && dollarAmounts[0] ? dollarAmounts[0] : null,
    settlementOfferAmount: null,
  };
}

export function parseCallInput(text: string): ParsedCallInput {
  const normalized = normalizeCallInput(text);
  const dollarAmounts = (text.match(DOLLAR_PATTERN) ?? []).map(formatMoney);
  const bareAmount = extractBareSettlementAmount(text);
  const balanceOffer = extractBalanceAndOffer(normalized, dollarAmounts);
  const monthlyPaymentAmount = extractMonthlyPaymentAmount(text, normalized);

  const settlementOfferAmount =
    balanceOffer.settlementOfferAmount ?? bareAmount ?? dollarAmounts.at(-1) ?? null;

  const balanceAmount = balanceOffer.balanceAmount;

  const settlementMention =
    normalized.includes("settlement") ||
    normalized.includes("settle") ||
    normalized.includes("lump sum") ||
    Boolean(bareAmount) ||
    /offer\s+\d/.test(normalized);

  return {
    normalized,
    dollarAmounts,
    bareAmount,
    settlementOfferAmount,
    balanceAmount,
    monthlyPaymentAmount,
    deadline: extractDeadline(normalized),
    expiresToday:
      normalized.includes("expires today") ||
      normalized.includes("offer expires today") ||
      (normalized.includes("expires") && normalized.includes("today")),
    noMonthlyPayments:
      normalized.includes("no monthly") ||
      normalized.includes("no payment plan") ||
      normalized.includes("no installments"),
    writtenOfferMention:
      normalized.includes("in writing") ||
      normalized.includes("written offer") ||
      normalized.includes("send you a letter"),
    monthlyPaymentMention:
      normalized.includes("monthly") ||
      normalized.includes("payment plan") ||
      normalized.includes("installment") ||
      normalized.includes("per month"),
    settlementMention,
    paymentDemand:
      normalized.includes("must pay") ||
      normalized.includes("pay today") ||
      normalized.includes("pay now") ||
      normalized.includes("due today"),
    legalThreat:
      normalized.includes("lawsuit") ||
      normalized.includes("legal action") ||
      normalized.includes("sue you") ||
      normalized.includes("summons") ||
      normalized.includes("judgment") ||
      normalized.includes("attorney"),
    lawsuitMention: normalized.includes("lawsuit"),
    garnishmentMention: normalized.includes("garnish"),
    courtMention: normalized.includes("court"),
    accountMention:
      normalized.includes("balance") ||
      normalized.includes("account") ||
      normalized.includes("owe") ||
      normalized.includes("amount due") ||
      dollarAmounts.length > 0 ||
      Boolean(bareAmount),
    identityMention:
      normalized.includes("this is") ||
      normalized.includes("my name is") ||
      normalized.includes("calling from"),
    wrapUpMention:
      normalized.includes("goodbye") ||
      normalized.includes("have a nice day") ||
      normalized.includes("thank you for your time") ||
      normalized.includes("anything else"),
    collectorName: extractCollectorName(normalized),
    creditorName: extractCreditorName(normalized),
    accountReference: extractAccountReference(normalized),
  };
}

export function extractStandaloneAmounts(text: string): string[] {
  return (text.match(STANDALONE_AMOUNT_PATTERN) ?? []).map(formatMoney);
}
