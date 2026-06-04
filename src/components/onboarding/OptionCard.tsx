interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function OptionCard({ label, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative w-full min-h-[52px] rounded-xl px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 ${
        selected
          ? "border-2 border-[#0F172A] bg-gradient-to-br from-[#14B8A6]/10 via-white to-[#D4A017]/5 text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.1),0_6px_20px_rgba(212,160,23,0.12)]"
          : "border border-[#0F172A]/8 bg-white text-[#111827] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.03)] hover:border-[#0F172A]/18 hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:scale-[0.99]"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span
          className={`text-base leading-snug ${
            selected ? "font-semibold" : "font-medium"
          }`}
        >
          {label}
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-[#14B8A6] bg-[#14B8A6] text-white"
              : "border-[#0F172A]/15 bg-[#F8FAFC] text-transparent group-hover:border-[#0F172A]/25"
          }`}
          aria-hidden
        >
          {selected ? (
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6l2.5 2.5 5-5" />
            </svg>
          ) : null}
        </span>
      </span>
      {selected ? (
        <span
          className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#D4A017]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
