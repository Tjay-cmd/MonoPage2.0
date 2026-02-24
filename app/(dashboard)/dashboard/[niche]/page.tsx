import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlumberDashboard from "@/components/dashboard/PlumberDashboard";

export default async function NicheDashboardPage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const nicheLower = niche?.toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, full_name, niche")
    .eq("id", user.id)
    .single();

  const displayName = profile?.business_name || profile?.full_name || nicheLower || "there";

  let jobsThisWeek = 0;
  let jobsToday = 0;
  if (nicheLower === "plumber" && user?.id) {
    const { data: sites } = await supabase
      .from("user_sites")
      .select("id")
      .eq("user_id", user.id);
    const siteIds = (sites ?? []).map((s) => s.id);
    if (siteIds.length > 0) {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      const { count: weekCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("user_site_id", siteIds)
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", startOfWeek.toISOString())
        .lt("scheduled_at", endOfWeek.toISOString());
      const { count: todayCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("user_site_id", siteIds)
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", startOfToday.toISOString())
        .lt("scheduled_at", endOfToday.toISOString());
      jobsThisWeek = weekCount ?? 0;
      jobsToday = todayCount ?? 0;
    }
  }

  switch (nicheLower) {
    case "plumber":
      return (
        <div className="py-8 px-8">
          <PlumberDashboard
            displayName={displayName}
            jobsThisWeek={jobsThisWeek}
            jobsToday={jobsToday}
            niche={niche}
          />
        </div>
      );
    case "photographer":
    case "barber":
    default:
      return (
        <div className="py-8 px-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {displayName}
            </h1>
            <p className="mt-2 text-gray-600">
              Your {nicheLower ? `${nicheLower} ` : ""}dashboard is coming soon!
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-indigo-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-indigo-700">
              We&apos;re building specialized tools for your industry. Check back
              soon!
            </p>
          </div>
        </div>
      );
  }
}
