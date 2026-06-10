"use server";

import { logProductEvent } from "@/lib/analytics/log-product-event";
import type { ProductEventType } from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";

export async function trackProductEvent(input: {
  eventType: ProductEventType;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await logProductEvent(supabase, {
    userId: user.id,
    eventType: input.eventType,
    payload: input.payload,
  });
}
