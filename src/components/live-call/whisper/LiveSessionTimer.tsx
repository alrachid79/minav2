"use client";

import { useEffect, useState } from "react";

interface LiveSessionTimerProps {
  startedAt: string;
  isActive: boolean;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function LiveSessionTimer({ startedAt, isActive }: LiveSessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const startMs = new Date(startedAt).getTime();

    function tick() {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">
          Live call active
        </p>
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-wider text-white">
          {formatElapsed(elapsed)}
        </p>
      </div>
    </div>
  );
}
