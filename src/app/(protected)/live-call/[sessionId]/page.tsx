import { notFound } from "next/navigation";

import { getLiveCallSession } from "@/app/actions/live-call";
import { WhisperModeConversation } from "@/components/live-call/WhisperModeConversation";

interface LiveCallSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LiveCallSessionPage({ params }: LiveCallSessionPageProps) {
  const { sessionId } = await params;
  const snapshot = await getLiveCallSession({ sessionId });

  if ("error" in snapshot) {
    notFound();
  }

  return <WhisperModeConversation snapshot={snapshot} />;
}
