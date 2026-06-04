interface MinaReflectionProps {
  message: string;
}

export function MinaReflection({ message }: MinaReflectionProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#0F172A]/8 bg-gradient-to-br from-[#F8FAFC] via-white to-[#14B8A6]/5 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
      <div
        className="absolute inset-y-0 left-0 w-1 bg-[#D4A017]"
        aria-hidden
      />
      <div className="px-5 py-4 pl-6">
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F172A] text-[10px] font-bold text-[#D4A017]"
            aria-hidden
          >
            M
          </span>
          <span className="text-xs font-semibold tracking-wide text-[#0F172A]">
            From Mina
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-[#111827]">{message}</p>
      </div>
    </div>
  );
}
