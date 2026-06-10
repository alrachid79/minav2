import "server-only";

import type { ProductEventType } from "@/lib/analytics/product-events";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function logProductEvent(
  supabase: SupabaseClient,
  input: {
    userId: string;
    eventType: ProductEventType;
    payload?: Record<string, unknown>;
    actor?: "user" | "mina" | "system";
  },
): Promise<void> {
  const payload = input.payload ?? {};

  if (process.env.NODE_ENV !== "production") {
    console.info("[MINA_EVENT]", input.eventType, payload);
  }

  const { error } = await supabase.from("audit_events").insert({
    user_id: input.userId,
    event_category: "user_action",
    event_type: input.eventType,
    event_payload: payload,
    actor: input.actor ?? "user",
  });

  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[MINA_EVENT] failed to persist", error.message);
  }
}
