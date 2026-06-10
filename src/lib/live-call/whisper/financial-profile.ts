import type {
  EmergencySavingsFeel,
  ExpenseRange,
  FinancialSnapshotAnswer,
  IncomeRange,
} from "@/types/onboarding";

export interface WhisperFinancialProfile {
  available_savings: number;
  emergency_fund: number;
  monthly_flexibility: number;
  is_complete: boolean;
  source: "onboarding_financial_snapshot" | "none";
}

const INCOME_MIDPOINTS: Record<IncomeRange, number | null> = {
  under_2000: 1500,
  "2000_4000": 3000,
  "4000_6000": 5000,
  "6000_10000": 8000,
  over_10000: 12000,
  prefer_not_to_say: null,
};

const SAVINGS_BY_FEEL: Record<
  Exclude<EmergencySavingsFeel, "prefer_not_to_say">,
  { savings: number; emergency: number; flexibility: number }
> = {
  very_difficult: { savings: 700, emergency: 300, flexibility: 150 },
  manageable_but_tight: { savings: 2500, emergency: 1000, flexibility: 350 },
  comfortable: { savings: 8000, emergency: 3000, flexibility: 800 },
};

export function buildFinancialProfileFromSnapshot(
  snapshot: FinancialSnapshotAnswer | null | undefined,
): WhisperFinancialProfile {
  if (!snapshot) {
    return emptyProfile();
  }

  if (
    snapshot.income_range === "prefer_not_to_say" ||
    snapshot.expense_range === "prefer_not_to_say" ||
    snapshot.emergency_savings_feel === "prefer_not_to_say"
  ) {
    return emptyProfile();
  }

  const feelProfile = SAVINGS_BY_FEEL[snapshot.emergency_savings_feel];
  const incomeMid = INCOME_MIDPOINTS[snapshot.income_range];
  const expenseMid = INCOME_MIDPOINTS[snapshot.expense_range];

  let monthlyFlexibility = feelProfile.flexibility;

  if (incomeMid !== null && expenseMid !== null) {
    const surplus = Math.max(0, incomeMid - expenseMid);
    monthlyFlexibility = Math.min(feelProfile.flexibility, surplus);
    if (monthlyFlexibility <= 0) {
      monthlyFlexibility = feelProfile.flexibility;
    }
  }

  return {
    available_savings: feelProfile.savings,
    emergency_fund: feelProfile.emergency,
    monthly_flexibility: monthlyFlexibility,
    is_complete: true,
    source: "onboarding_financial_snapshot",
  };
}

export function emptyProfile(): WhisperFinancialProfile {
  return {
    available_savings: 0,
    emergency_fund: 0,
    monthly_flexibility: 0,
    is_complete: false,
    source: "none",
  };
}

export function parseMoneyValue(amount: string | null | undefined): number | null {
  if (!amount) {
    return null;
  }

  const cleaned = amount.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(cleaned);

  return Number.isFinite(value) ? value : null;
}

export function formatMoneyValue(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
