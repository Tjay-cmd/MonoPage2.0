import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSideNav from "@/components/DashboardSideNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("niche, is_admin, plan")
    .eq("id", user.id)
    .single();

  const niche = profile?.niche?.toLowerCase() ?? null;
  const nicheLabel = niche
    ? `${niche.charAt(0).toUpperCase() + niche.slice(1)} Dashboard`
    : "Get Started";
  const plan = profile?.plan ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSideNav
        userEmail={user.email ?? ""}
        niche={niche}
        nicheLabel={nicheLabel}
        isAdmin={profile?.is_admin ?? false}
        plan={plan}
      />
      <main className="pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
