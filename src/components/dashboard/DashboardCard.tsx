import type { ReactNode } from "react";

interface DashboardCardProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  accent?: "gold" | "teal" | "navy" | "amber";
  variant?: "default" | "featured" | "alert" | "nested";
  className?: string;
}

const ACCENT_STYLES = {
  gold: "text-[#D4A017]",
  teal: "text-[#14B8A6]",
  navy: "text-[#0F172A]",
  amber: "text-[#F59E0B]",
};

const VARIANT_STYLES = {
  default: "rounded-2xl border border-[#0F172A]/10 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6",
  featured:
    "rounded-3xl border border-[#14B8A6]/20 bg-gradient-to-br from-white via-white to-[#F0FDFA] px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-6 sm:py-7",
  alert:
    "rounded-3xl border-2 border-[#F59E0B]/40 bg-gradient-to-br from-[#FFFBEB] via-white to-[#FFFBEB] px-5 py-5 shadow-[0_8px_30px_rgba(245,158,11,0.12)] sm:px-6 sm:py-6",
  nested: "rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-4",
};

export function DashboardCard({
  eyebrow,
  title,
  children,
  accent = "gold",
  variant = "default",
  className = "",
}: DashboardCardProps) {
  return (
    <section className={`${VARIANT_STYLES[variant]} ${className}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${ACCENT_STYLES[accent]}`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#0F172A] sm:text-xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DashboardEmptyState({ message }: { message: string }) {
  return <p className="text-sm leading-relaxed text-[#6B7280]">{message}</p>;
}

export function formatDashboardDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function DashboardSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D4A017]">
        {eyebrow}
      </p>
      <h2 className="text-xl font-semibold tracking-tight text-[#0F172A] sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-relaxed text-[#6B7280]">{description}</p>
      ) : null}
    </div>
  );
}
