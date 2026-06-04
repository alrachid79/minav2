"use client";

import { useEffect, useState } from "react";

import { transferOnboardingToDatabase } from "@/app/actions/transfer-onboarding";
import type { TransferOnboardingResult } from "@/app/actions/transfer-onboarding";
import {
  clearAllGuestOnboardingStorage,
  loadPendingTransferSession,
} from "@/lib/onboarding/session";

type TransferUiState =
  | { phase: "idle" }
  | { phase: "transferring" }
  | { phase: "done"; result: TransferOnboardingResult }
  | { phase: "error"; message: string };

export function OnboardingTransferStatus() {
  const [state, setState] = useState<TransferUiState>({ phase: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function runTransfer() {
      const pending = loadPendingTransferSession();

      if (!pending.session) {
        return;
      }

      if (pending.expired || pending.invalid) {
        clearAllGuestOnboardingStorage();
        return;
      }

      if (pending.session.transfer_status === "completed") {
        return;
      }

      setState({ phase: "transferring" });

      const result = await transferOnboardingToDatabase(pending.session);

      if (cancelled) {
        return;
      }

      if (result.status === "error") {
        setState({ phase: "error", message: result.message });
        return;
      }

      clearAllGuestOnboardingStorage();
      setState({ phase: "done", result });
    }

    void runTransfer();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === "idle") {
    return null;
  }

  if (state.phase === "transferring") {
    return (
      <div className="rounded-xl border border-[#0F172A]/10 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
        Saving your onboarding to your account...
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
        {state.message}
      </div>
    );
  }

  const { result } = state;
  const isSuccess = result.status === "success";
  const isDuplicate = result.status === "already_transferred";

  return (
    <div
      className={`rounded-xl border px-5 py-4 ${
        isSuccess
          ? "border-[#14B8A6]/30 bg-[#14B8A6]/5"
          : "border-[#D4A017]/30 bg-[#D4A017]/5"
      }`}
    >
      <p className="text-sm font-semibold text-[#0F172A]">
        {isSuccess
          ? "Onboarding saved to your account"
          : "Onboarding already linked to your account"}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
        {isSuccess
          ? "Your guest onboarding was transferred successfully."
          : "We found an existing onboarding session and skipped a duplicate transfer."}
      </p>
      {(isSuccess || isDuplicate) && (
        <dl className="mt-4 space-y-2 text-xs text-[#6B7280]">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-36 shrink-0 font-medium text-[#0F172A]">
              Session ID
            </dt>
            <dd className="font-mono break-all">{result.sessionId}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-36 shrink-0 font-medium text-[#0F172A]">
              Answers saved
            </dt>
            <dd>{result.answerCount}</dd>
          </div>
          {"intelligenceSeeded" in result && result.intelligenceSeeded ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="w-36 shrink-0 font-medium text-[#0F172A]">
                Intelligence layers
              </dt>
              <dd>Seeded (profile, debt, stress, recovery, memory, recommendations)</dd>
            </div>
          ) : null}
          {result.guestSessionId ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="w-36 shrink-0 font-medium text-[#0F172A]">
                Guest session ID
              </dt>
              <dd className="font-mono break-all">{result.guestSessionId}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}
