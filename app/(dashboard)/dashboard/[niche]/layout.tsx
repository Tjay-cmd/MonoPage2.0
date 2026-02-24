import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VALID_NICHES } from "@/lib/constants";

export default async function NicheDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const nicheLower = niche?.toLowerCase();

  if (!nicheLower || !VALID_NICHES.includes(nicheLower)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
