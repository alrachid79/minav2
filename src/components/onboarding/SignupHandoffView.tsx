"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MinaReflection } from "@/components/onboarding/MinaReflection";
import { SIGNUP_HANDOFF_SCREEN } from "@/lib/onboarding/questions";
import {
  copyGuestSessionToPendingTransfer,
  setGuestConsents,
} from "@/lib/onboarding/session";
import type { OnboardingConsents } from "@/types/onboarding";

interface SignupHandoffViewProps {
  initialConsents: OnboardingConsents;
}

export function SignupHandoffView({ initialConsents }: SignupHandoffViewProps) {
  const router = useRouter();
  const [consents, setConsents] = useState<OnboardingConsents>(initialConsents);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue =
    consents.data_storage && consents.guidance_disclaimer && !isSubmitting;

  function updateConsent(key: keyof OnboardingConsents, checked: boolean) {
    setConsents((previous) => ({ ...previous, [key]: checked }));
    setError(null);
  }

  function handleContinue(destination: "signup" | "login") {
    setError(null);

    if (!consents.data_storage || !consents.guidance_disclaimer) {
      setError("Please accept both agreements to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      setGuestConsents(consents);
      copyGuestSessionToPendingTransfer();

      if (destination === "signup") {
        router.push("/signup?from=onboarding");
        return;
      }

      router.push("/login?next=/dashboard&from=onboarding");
    } catch (continueError) {
      setError(
        continueError instanceof Error
          ? continueError.message
          : "Unable to prepare your onboarding for transfer.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {SIGNUP_HANDOFF_SCREEN.minaReflection ? (
        <MinaReflection message={SIGNUP_HANDOFF_SCREEN.minaReflection} />
      ) : null}

      <div className="space-y-4 rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-5 py-4">
        <p className="text-sm font-semibold text-[#0F172A]">What gets saved</p>
        <ul className="space-y-2 text-sm leading-relaxed text-[#6B7280]">
          <li>Your onboarding answers (5 steps)</li>
          <li>Your onboarding session record</li>
          <li>Saved securely to your account after you verify email and log in</li>
        </ul>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#0F172A]/8 bg-white px-4 py-3 shadow-sm">
          <input
            type="checkbox"
            checked={consents.data_storage}
            onChange={(event) =>
              updateConsent("data_storage", event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-[#0F172A]/20 text-[#0F172A] focus:ring-[#14B8A6]"
          />
          <span className="text-sm leading-relaxed text-[#111827]">
            I agree to store my onboarding answers securely in my account.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#0F172A]/8 bg-white px-4 py-3 shadow-sm">
          <input
            type="checkbox"
            checked={consents.guidance_disclaimer}
            onChange={(event) =>
              updateConsent("guidance_disclaimer", event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-[#0F172A]/20 text-[#0F172A] focus:ring-[#14B8A6]"
          />
          <span className="text-sm leading-relaxed text-[#111827]">
            I understand Mina provides guidance and support, not legal, tax, or
            financial advice.
          </span>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          {error}
        </p>
      ) : null}

      <div className="space-y-3 border-t border-[#0F172A]/6 pt-2">
        <button
          type="button"
          onClick={() => handleContinue("signup")}
          disabled={!canContinue}
          className="min-h-[48px] w-full rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] transition hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Preparing..." : "Create free account"}
        </button>

        <button
          type="button"
          onClick={() => handleContinue("login")}
          disabled={!canContinue}
          className="min-h-[48px] w-full rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] transition hover:border-[#0F172A]/25 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          I already have an account
        </button>

        <p className="text-center text-xs leading-relaxed text-[#6B7280]">
          Your progress stays on this device for 7 days if you don&apos;t create
          an account.{" "}
          <Link href="/login" className="font-medium text-[#14B8A6]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
