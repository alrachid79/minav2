export const WHISPER_COLORS = {
  background: "#0F172A",
  card: "#162033",
  gold: "#D4A017",
  success: "#22C55E",
  attention: "#F59E0B",
  legal: "#EF4444",
} as const;

export const WHISPER_PRESSURE_COLORS = {
  Low: WHISPER_COLORS.success,
  Medium: WHISPER_COLORS.attention,
  High: WHISPER_COLORS.legal,
} as const;
