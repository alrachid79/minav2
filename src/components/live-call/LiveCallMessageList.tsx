import { LiveCallMinaGuidanceCard } from "@/components/live-call/LiveCallMinaGuidanceCard";
import type {
  LiveCallMessageRecord,
  LiveCallMinaGuidanceContent,
  LiveCallUserMessageContent,
} from "@/types/live-call";

interface LiveCallMessageListProps {
  messages: LiveCallMessageRecord[];
}

function isMinaGuidance(
  content: LiveCallUserMessageContent | LiveCallMinaGuidanceContent,
): content is LiveCallMinaGuidanceContent {
  return "suggested_response" in content;
}

export function LiveCallMessageList({ messages }: LiveCallMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-8 text-center">
        <p className="text-sm text-[#64748B]">
          Enter what the caller said to start your conversation history. Mina will
          suggest responses and questions you can use.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        if (message.role === "user") {
          const content = message.content as LiveCallUserMessageContent;

          return (
            <article
              key={message.id}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                What was said
              </p>
              <p className="text-sm leading-relaxed text-[#0F172A]">{content.text}</p>
              {content.notes ? (
                <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-2">
                  <p className="text-xs font-medium text-[#64748B]">Your notes</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#334155]">{content.notes}</p>
                </div>
              ) : null}
            </article>
          );
        }

        if (isMinaGuidance(message.content)) {
          return <LiveCallMinaGuidanceCard key={message.id} guidance={message.content} />;
        }

        return null;
      })}
    </div>
  );
}
