"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loadDemoExperience } from "@/app/actions/seed-demo-experience";

interface DemoExperiencePromptProps {
  visible: boolean;
}

export function DemoExperiencePrompt({ visible }: DemoExperiencePromptProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!visible) {
    return null;
  }

  function handleLoadDemo() {
    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      const result = await loadDemoExperience();

      setMessage(result.message);
      setIsError(result.status === "error");

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#D4A017]/30 bg-[#FFFBEB] px-4 py-4 sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
        First time here?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#78350F]">
        Load a sample situation with a settlement offer and call history so you can explore Mina
        immediately.
      </p>
      <button
        type="button"
        onClick={handleLoadDemo}
        disabled={isPending}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429] disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Loading sample…" : "Load sample experience"}
      </button>
      {message ? (
        <p
          className={`mt-3 text-sm ${isError ? "text-[#991B1B]" : "text-[#166534]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
