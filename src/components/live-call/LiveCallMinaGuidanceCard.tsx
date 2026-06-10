import { LIVE_CALL_EDUCATIONAL_DISCLAIMER } from "@/lib/live-call/constants";
import type { LegacyLiveCallMinaGuidanceContent } from "@/types/live-call";

interface LiveCallMinaGuidanceCardProps {
  guidance: LegacyLiveCallMinaGuidanceContent;
}

const RISK_LABELS = {
  low: "Low pressure",
  elevated: "Elevated pressure",
  legal_attention: "Legal-sounding language",
} as const;

const RISK_STYLES = {
  low: "bg-[#ECFDF5] text-[#047857]",
  elevated: "bg-[#FFFBEB] text-[#B45309]",
  legal_attention: "bg-[#FEF2F2] text-[#991B1B]",
} as const;

export function LiveCallMinaGuidanceCard({ guidance }: LiveCallMinaGuidanceCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[#14B8A6]/20 bg-[#F0FDFA] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F766E]">
          Mina guidance
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[guidance.risk_level]}`}
        >
          {RISK_LABELS[guidance.risk_level]}
        </span>
        {guidance.pressure_tactic ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-[#475569]">
            {guidance.pressure_tactic}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#64748B]">
          What may be happening
        </p>
        <p className="text-sm leading-relaxed text-[#0F172A]">{guidance.what_is_happening}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#64748B]">
          Suggested response
        </p>
        <p className="rounded-xl bg-white px-3 py-3 text-sm leading-relaxed text-[#0F172A]">
          {guidance.suggested_response}
        </p>
      </div>

      {guidance.clarifying_questions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#64748B]">
            Clarifying questions
          </p>
          <ul className="space-y-1.5">
            {guidance.clarifying_questions.map((question) => (
              <li
                key={question}
                className="text-sm leading-relaxed text-[#334155] before:mr-2 before:text-[#14B8A6] before:content-['•']"
              >
                {question}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {guidance.things_to_understand.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#64748B]">
            Things to understand before deciding
          </p>
          <ul className="space-y-1.5">
            {guidance.things_to_understand.map((item) => (
              <li
                key={item}
                className="text-sm leading-relaxed text-[#334155] before:mr-2 before:text-[#D4A017] before:content-['•']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#64748B]">
          Communication guidance
        </p>
        <p className="text-sm leading-relaxed text-[#334155]">{guidance.communication_guidance}</p>
      </div>

      <p className="border-t border-[#14B8A6]/15 pt-3 text-xs leading-relaxed text-[#64748B]">
        {guidance.disclaimer || LIVE_CALL_EDUCATIONAL_DISCLAIMER}
      </p>
    </div>
  );
}
