import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { JobForm } from "../JobForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ niche: string; id: string }>;
}) {
  const { niche, id } = await params;

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
  if (profile?.plan !== "pro")
    redirect(`/dashboard/${niche}/subscription`);

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) redirect(`/dashboard/${niche}/jobs`);

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, user_site_id, title, description, scheduled_at, address, customer_name, customer_phone, technician_id, quote_request_id, quote_id"
    )
    .eq("id", id)
    .in("user_site_id", siteIds)
    .single();

  if (!job) notFound();

  const { data: technicians } = await supabase
    .from("technicians")
    .select("id, name, created_at, worker_token")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/${niche}/jobs`}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Jobs
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Job</h1>
      <JobForm
        niche={niche}
        userSiteId={job.user_site_id}
        technicians={(technicians ?? []) as { id: string; name: string; created_at: string; worker_token: string | null }[]}
        initialData={{
          id: job.id,
          title: job.title,
          description: job.description ?? "",
          scheduled_at: job.scheduled_at,
          address: job.address ?? "",
          customer_name: job.customer_name ?? "",
          customer_phone: job.customer_phone ?? "",
          technician_id: job.technician_id ?? "",
          quote_request_id: job.quote_request_id ?? "",
          quote_id: job.quote_id ?? "",
        }}
      />
    </div>
  );
}
