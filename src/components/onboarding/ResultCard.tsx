import type { ReactNode } from "react";

interface ResultCardProps {
  title: string;
  children: ReactNode;
  accent?: "gold" | "teal" | "navy";
  className?: string;
}

const accentStyles = {
  gold: "bg-[#D4A017]",
  teal: "bg-[#14B8A6]",
  navy: "bg-[#0F172A]",
};

export function ResultCard({
  title,
  children,
  accent = "gold",
  className = "",
}: ResultCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#0F172A]/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${accentStyles[accent]}`}
        aria-hidden
      />
      <div className="px-5 py-4 pl-6">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-[#0F172A]">
          {title}
        </h3>
        <div className="text-[15px] leading-relaxed text-[#111827]">
          {children}
        </div>
      </div>
    </div>
  );
}
