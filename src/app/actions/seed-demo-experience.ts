"use server";

import { revalidatePath } from "next/cache";

import { seedDemoExperience } from "@/lib/demo/seed-demo-experience";
import { createClient } from "@/lib/supabase/server";

export type LoadDemoExperienceResult =
  | { status: "success"; message: string }
  | { status: "skipped"; message: string }
  | { status: "error"; message: string };

export async function loadDemoExperience(): Promise<LoadDemoExperienceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to load the sample experience." };
  }

  const result = await seedDemoExperience(supabase, user.id);

  if (!result.seeded) {
    if (result.reason.includes("already exists")) {
      return { status: "skipped", message: "Sample data is already on your account." };
    }

    return {
      status: "error",
      message: "We couldn't load the sample experience right now. Try again in a moment.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/situations");
  revalidatePath("/recovery");
  revalidatePath("/live-call");

  return {
    status: "success",
    message: "Sample situation and call history loaded. Open My Situation to explore.",
  };
}
