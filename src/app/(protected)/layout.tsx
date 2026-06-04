import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  await supabase
    .from("profiles")
    .select("id, email, state")
    .eq("id", user.id)
    .maybeSingle();

  return <div className="flex min-h-full flex-col">{children}</div>;
}
