interface ConfirmFieldEditorProps {
  label: string;
  value: string;
  unknown: boolean;
  onValueChange: (value: string) => void;
  onUnknownChange: (unknown: boolean) => void;
  hint?: string;
}

export function ConfirmFieldEditor({
  label,
  value,
  unknown,
  onValueChange,
  onUnknownChange,
  hint,
}: ConfirmFieldEditorProps) {
  return (
    <div className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <label className="text-sm font-medium text-[#0F172A]">{label}</label>
          {hint ? (
            <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-[#6B7280]">
          <input
            type="checkbox"
            checked={unknown}
            onChange={(event) => onUnknownChange(event.target.checked)}
            className="h-4 w-4 rounded border-[#0F172A]/20 text-[#0F172A] focus:ring-[#14B8A6]"
          />
          Mark unknown
        </label>
      </div>
      <input
        type="text"
        value={unknown ? "" : value}
        disabled={unknown}
        placeholder={
          unknown ? "Marked as unknown" : "Not found or needs review — add a value"
        }
        onChange={(event) => onValueChange(event.target.value)}
        className="mt-3 min-h-[44px] w-full rounded-lg border border-[#0F172A]/12 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#6B7280] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#6B7280]"
      />
    </div>
  );
}
