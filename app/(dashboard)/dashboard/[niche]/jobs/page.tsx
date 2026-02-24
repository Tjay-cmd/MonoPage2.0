import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TechniciansSection } from "./TechniciansSection";
import { JobsFilters } from "./JobsFilters";
import { JobsList } from "./JobsList";

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{ status?: string; date?: string; q?: string }>;
}) {
  const { niche } = await params;
  const { status, date, q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 mt-4">
          <p className="text-amber-800 font-medium">Pro plan required</p>
          <p className="mt-2 text-amber-700 text-sm">
            Schedule work, assign technicians, and track job status. Upgrade to
            Pro to access this feature.
          </p>
          <a
            href={`/dashboard/${niche}/subscription`}
            className="mt-4 inline-block py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id, slug")
    .eq("user_id", user.id);

  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) {
    return (
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Jobs</h1>
        <p className="text-lg text-gray-600 mb-4">
          Publish your website to start managing jobs.
        </p>
        <a
          href={`/dashboard/${niche}/website`}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Go to Your Website →
        </a>
      </div>
    );
  }

  const { data: technicians } = await supabase
    .from("technicians")
    .select("id, name, created_at, worker_token")
    .eq("user_id", user.id)
    .order("name");

  let jobsQuery = supabase
    .from("jobs")
    .select(
      `
      id, title, description, scheduled_at, address, customer_name, customer_phone, status, technician_id, created_at,
      technicians(id, name)
    `
    )
    .in("user_site_id", siteIds)
    .order("scheduled_at", { ascending: false });

  if (status) {
    jobsQuery = jobsQuery.eq("status", status);
  }

  const now = new Date();
  if (date === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    jobsQuery = jobsQuery
      .gte("scheduled_at", start.toISOString())
      .lt("scheduled_at", end.toISOString());
  } else if (date === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    jobsQuery = jobsQuery
      .gte("scheduled_at", startOfWeek.toISOString())
      .lt("scheduled_at", endOfWeek.toISOString());
  }

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    jobsQuery = jobsQuery.or(
      `title.ilike.${term},description.ilike.${term},customer_name.ilike.${term},address.ilike.${term}`
    );
  }

  const { data: rawJobs } = await jobsQuery;

  // Normalize technicians: Supabase returns array for relation, Job type expects single object
  const jobs = (rawJobs ?? []).map((j) => ({
    ...j,
    technicians: Array.isArray(j.technicians)
      ? (j.technicians[0] as { id: string; name: string } | undefined) ?? null
      : (j.technicians as { id: string; name: string } | null),
  }));

  // Stats for header
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const { count: todayCount } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("user_site_id", siteIds)
    .in("status", ["scheduled", "in_progress"])
    .gte("scheduled_at", startOfToday.toISOString())
    .lt("scheduled_at", endOfToday.toISOString());
  const startOfWeekForStats = new Date(now);
  startOfWeekForStats.setDate(now.getDate() - now.getDay());
  startOfWeekForStats.setHours(0, 0, 0, 0);
  const endOfWeekForStats = new Date(startOfWeekForStats);
  endOfWeekForStats.setDate(endOfWeekForStats.getDate() + 7);
  const { count: weekCount } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("user_site_id", siteIds)
    .in("status", ["scheduled", "in_progress"])
    .gte("scheduled_at", startOfWeekForStats.toISOString())
    .lt("scheduled_at", endOfWeekForStats.toISOString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="p-8 pb-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Jobs
            </h1>
            <p className="mt-1 text-slate-500">
              Schedule work and assign technicians to your team
            </p>
          </div>
          <Link
            href={`/dashboard/${niche}/jobs/new`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create job
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href={`/dashboard/${niche}/jobs?date=today`}
            className="group bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            <p className="text-sm font-medium text-slate-500">Scheduled today</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{todayCount ?? 0}</p>
          </Link>
          <Link
            href={`/dashboard/${niche}/jobs?date=week`}
            className="group bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            <p className="text-sm font-medium text-slate-500">This week</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{weekCount ?? 0}</p>
          </Link>
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Technicians</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{technicians?.length ?? 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total jobs</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{jobs?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl">
          {/* Technicians sidebar */}
          <div className="xl:col-span-4">
          <TechniciansSection
            technicians={(technicians ?? []) as { id: string; name: string; created_at: string; worker_token: string | null }[]}
            niche={niche}
          />
          </div>

          {/* Jobs main area */}
          <div className="xl:col-span-8">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Job schedule</h2>
                <JobsFilters niche={niche} />
              </div>
              <div className="p-6 min-h-[320px]">
                <JobsList
                  jobs={jobs}
                  niche={niche}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
