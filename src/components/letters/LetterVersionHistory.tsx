import type { LetterVersionSummary } from "@/types/letters";

interface LetterVersionHistoryProps {
  versions: LetterVersionSummary[];
  currentVersion: number;
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatChangeReason(value: string | null): string {
  switch (value) {
    case "generated":
      return "Generated";
    case "edited":
      return "Edited";
    case "revised":
      return "Regenerated";
    case "finalized":
      return "Finalized";
    default:
      return value ?? "Updated";
  }
}

export function LetterVersionHistory({
  versions,
  currentVersion,
}: LetterVersionHistoryProps) {
  return (
    <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
        Version history
      </p>
      <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
        Immutable draft history
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
        Previous versions are preserved. Exports always use version {currentVersion}.
      </p>

      <ul className="mt-6 space-y-3">
        {versions.map((version) => {
          const isCurrent = version.version_number === currentVersion;

          return (
            <li
              key={version.id}
              className={`rounded-xl border px-4 py-3 ${
                isCurrent
                  ? "border-[#14B8A6] bg-[#F0FDFA]"
                  : "border-[#0F172A]/10 bg-[#F8FAFC]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Version {version.version_number}
                    {isCurrent ? (
                      <span className="ml-2 text-xs font-medium uppercase tracking-[0.08em] text-[#0F766E]">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {formatChangeReason(version.change_reason)} ·{" "}
                    {formatDisplayDate(version.created_at)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
