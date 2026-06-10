"use client";

import { useState } from "react";

interface SayNowCardProps {
  sayNow: string;
}

export function SayNowCard({ sayNow }: SayNowCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sayNow);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-[#D4A017]/10 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-3xl border border-[#D4A017]/35 bg-[#162033] shadow-[0_0_48px_rgba(212,160,23,0.12)]">
        <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-5 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4A017]">
            Say now
          </p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-balance break-words text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.65rem]">
            &ldquo;{sayNow}&rdquo;
          </p>
        </div>
        <div className="border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#D4A017] px-4 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429] active:scale-[0.98]"
          >
            {copied ? "Copied — read it aloud" : "Copy line"}
          </button>
        </div>
      </div>
    </section>
  );
}
