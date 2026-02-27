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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <DashboardSideNav
        userEmail={user.email ?? ""}
        niche={niche}
        nicheLabel={nicheLabel}
        isAdmin={profile?.is_admin ?? false}
        plan={plan}
      />
      {/* pt-11 for mobile top bar; px-4 + safe-area on mobile so content never touches edges; lg:pt-0 + lg:pl-64 for desktop */}
      <main className="pt-11 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:pt-0 lg:pl-64 lg:pr-0 min-h-screen max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
