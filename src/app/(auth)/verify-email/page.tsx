"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setSuccessMessage(null);
    setError(null);

    if (!email) {
      setError("Email address is missing. Return to sign up and try again.");
      return;
    }

    setIsResending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setSuccessMessage("Confirmation email sent. Check your inbox.");
    } catch (resendFailure) {
      setError(getErrorMessage(resendFailure));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          We sent a confirmation link
          {email ? (
            <>
              {" "}
              to{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {email}
              </span>
            </>
          ) : (
            " to your email address"
          )}
          . Click the link to verify your account.
        </p>
      </div>

      <div className="space-y-4">
        {successMessage ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isResending ? "Sending..." : "Resend confirmation email"}
        </button>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already verified?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
