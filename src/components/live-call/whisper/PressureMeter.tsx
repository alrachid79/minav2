"use client";

import type { LiveCallMinaGuidanceContent } from "@/types/live-call";

interface PressureMeterProps {
  pressure: LiveCallMinaGuidanceContent["pressure"];
}

const LEVELS: LiveCallMinaGuidanceContent["pressure"][] = ["Low", "Medium", "High"];

const LEVEL_COLORS = {
  Low: "#22C55E",
  Medium: "#F59E0B",
  High: "#EF4444",
} as const;

export function PressureMeter({ pressure }: PressureMeterProps) {
  const activeIndex = LEVELS.indexOf(pressure);

  return (
    <div className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          Pressure meter
        </p>
        <span
          className="text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-500"
          style={{ color: LEVEL_COLORS[pressure] }}
        >
          {pressure}
        </span>
      </div>

      <div className="flex gap-2">
        {LEVELS.map((level, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = level === pressure;

          return (
            <div key={level} className="flex-1 space-y-1.5">
              <div
                className="h-2.5 overflow-hidden rounded-full bg-white/8 transition-all duration-500"
                aria-hidden
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: isActive ? "100%" : "0%",
                    backgroundColor: LEVEL_COLORS[level],
                    opacity: isCurrent ? 1 : isActive ? 0.55 : 0,
                    boxShadow: isCurrent ? `0 0 12px ${LEVEL_COLORS[level]}88` : undefined,
                  }}
                />
              </div>
              <p
                className="text-center text-[9px] font-semibold uppercase tracking-[0.08em] transition-colors duration-500"
                style={{ color: isCurrent ? LEVEL_COLORS[level] : "rgba(255,255,255,0.35)" }}
              >
                {level}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
