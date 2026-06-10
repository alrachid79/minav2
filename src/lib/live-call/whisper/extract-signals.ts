import { normalizeCallInput } from "@/lib/live-call/detect-pressure";

export interface WhisperExtractedSignals {
  normalized: string;
  amounts: string[];
  balanceAmount: string | null;
  offerAmount: string | null;
  deadline: string | null;
  callerIdentification: boolean;
  accountIdentification: boolean;
  balanceDiscussion: boolean;
  settlementMention: boolean;
  settlementDetails: boolean;
  monthlyPayment: boolean;
  paymentPressure: boolean;
  legalMention: boolean;
  callClosing: boolean;
}

const AMOUNT_PATTERN = /\$[\d,]+(?:\.\d{2})?|\b[\d,]+(?:\.\d{2})?\s*dollars?\b/gi;

const DEADLINE_PATTERN =
  /\b(?:by\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?|\bby\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\bwithin\s+\d+\s+(?:day|days|hours?)\b/gi;

function extractAmounts(text: string): string[] {
  const matches = text.match(AMOUNT_PATTERN) ?? [];
  return matches.map((match) => match.replace(/\s+/g, " ").trim());
}

function extractDeadline(text: string): string | null {
  const match = text.match(DEADLINE_PATTERN);
  if (!match) {
    return null;
  }

  return match[0].replace(/\s+/g, " ").trim();
}

function formatAmountLabel(amount: string): string {
  const normalized = amount.startsWith("$") ? amount : `$${amount.replace(/\s*dollars?/i, "").trim()}`;
  return normalized.replace(/\$/g, "$").replace(/(\d),(\d{3})/g, "$1,$2");
}

export function extractWhisperSignals(text: string): WhisperExtractedSignals {
  const normalized = normalizeCallInput(text);
  const amounts = extractAmounts(text);
  const deadline = extractDeadline(text);

  const settlementMention =
    normalized.includes("settlement") ||
    normalized.includes("settle") ||
    normalized.includes("offer you") ||
    normalized.includes("lump sum");

  const balanceDiscussion =
    normalized.includes("balance") ||
    normalized.includes("owe") ||
    normalized.includes("amount due") ||
    (amounts.length > 0 && !settlementMention);

  const settlementDetails =
    settlementMention &&
    amounts.length >= 1 &&
    (amounts.length >= 2 || normalized.includes("balance") || Boolean(deadline));

  const monthlyPayment =
    normalized.includes("monthly") ||
    normalized.includes("payment plan") ||
    normalized.includes("installment") ||
    normalized.includes("per month");

  const paymentPressure =
    normalized.includes("must pay") ||
    normalized.includes("pay today") ||
    normalized.includes("pay now") ||
    normalized.includes("today only") ||
    normalized.includes("right now") ||
    normalized.includes("no, you must") ||
    (normalized.includes("no,") && normalized.includes("pay"));

  const legalMention =
    normalized.includes("lawsuit") ||
    normalized.includes("legal action") ||
    normalized.includes("court") ||
    normalized.includes("attorney") ||
    normalized.includes("sue you") ||
    normalized.includes("garnish") ||
    normalized.includes("summons") ||
    normalized.includes("judgment");

  const callerIdentification =
    normalized.includes("this is") ||
    normalized.includes("my name is") ||
    normalized.includes("calling from") ||
    normalized.includes("i'm calling from") ||
    normalized.includes("represent");

  const accountIdentification =
    normalized.includes("account number") ||
    normalized.includes("account reference") ||
    normalized.includes("file number") ||
    normalized.includes("reference number") ||
    normalized.includes("regarding your account") ||
    normalized.includes("original creditor");

  const callClosing =
    normalized.includes("goodbye") ||
    normalized.includes("have a nice day") ||
    normalized.includes("thank you for your time") ||
    normalized.includes("anything else") ||
    normalized.includes("end of call") ||
    normalized.includes("talk to you later");

  let balanceAmount: string | null = null;
  let offerAmount: string | null = null;

  if (amounts.length >= 2 && settlementDetails) {
    balanceAmount = formatAmountLabel(amounts[0]);
    offerAmount = formatAmountLabel(amounts[1]);
  } else if (amounts.length === 1 && balanceDiscussion) {
    balanceAmount = formatAmountLabel(amounts[0]);
  }

  return {
    normalized,
    amounts: amounts.map(formatAmountLabel),
    balanceAmount,
    offerAmount,
    deadline: deadline ? deadline.replace(/\bby\s+/i, "").replace(/^./, (char) => char.toUpperCase()) : null,
    callerIdentification,
    accountIdentification,
    balanceDiscussion,
    settlementMention,
    settlementDetails,
    monthlyPayment,
    paymentPressure,
    legalMention,
    callClosing,
  };
}
