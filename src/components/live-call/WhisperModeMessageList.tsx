import { WhisperModeGuidanceCard } from "@/components/live-call/WhisperModeGuidanceCard";
import { isLegacyGuidance, isWhisperGuidance } from "@/lib/live-call/generate-guidance";
import type {
  LiveCallMessageRecord,
  LiveCallUserMessageContent,
} from "@/types/live-call";

interface WhisperModeMessageListProps {
  messages: LiveCallMessageRecord[];
  isActive: boolean;
}

export function WhisperModeMessageList({ messages, isActive }: WhisperModeMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D4A017]/25 bg-[#162033]/60 px-4 py-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
          Awaiting input
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Type what the collector just said. Mina returns one line to read aloud.
        </p>
      </div>
    );
  }

  const minaMessages = messages.filter((message) => message.role === "mina");
  const latestGuidance = minaMessages.at(-1)?.content;
  const lastUserMessage = messages.filter((message) => message.role === "user").at(-1);
  const hasGuidance =
    latestGuidance &&
    (isWhisperGuidance(latestGuidance) || isLegacyGuidance(latestGuidance));

  const historyMessages = isActive && hasGuidance ? messages.slice(0, -2) : messages.slice(0, -2);

  return (
    <div className="space-y-4">
      {hasGuidance ? (
        <WhisperModeGuidanceCard guidance={latestGuidance} messages={messages} />
      ) : null}

      {isActive && lastUserMessage ? (
        <article className="rounded-xl border border-white/8 bg-[#162033]/80 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
            Last heard
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-white/65">
            {(lastUserMessage.content as LiveCallUserMessageContent).text}
          </p>
        </article>
      ) : null}

      {historyMessages.length > 0 && !isActive ? (
        <details className="rounded-xl border border-white/8 bg-[#162033]/50 px-3 py-2">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            Call transcript ({historyMessages.length} entries)
          </summary>
          <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
            {historyMessages.map((message) => {
              if (message.role === "user") {
                const content = message.content as LiveCallUserMessageContent;
                return (
                  <p key={message.id} className="text-xs text-white/55">
                    <span className="text-white/35">Collector:</span> {content.text}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
