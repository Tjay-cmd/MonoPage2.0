import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JobForm } from "../JobForm";

export default async function NewJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{
    from?: string;
    quote?: string;
  }>;
}) {
  const { niche } = await params;
  const { from: quoteRequestId, quote: quoteId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, is_admin")
    .eq("id", user.id)
    .single();
  if (profile?.plan !== "pro" && !profile?.is_admin)
    redirect(`/dashboard/${niche}/subscription`);

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) redirect(`/dashboard/${niche}/jobs`);

  let userSiteId = siteIds[0];

  let initialData: {
    customer_name?: string;
    customer_phone?: string;
    address?: string;
    quote_request_id?: string;
    quote_id?: string;
  } | undefined;

  if (quoteRequestId) {
    const { data: req } = await supabase
      .from("quote_requests")
      .select("user_site_id, first_name, last_name, phone, message")
      .eq("id", quoteRequestId)
      .in("user_site_id", siteIds)
      .single();
    if (req) {
      userSiteId = req.user_site_id;
      initialData = {
        customer_name: `${req.first_name ?? ""} ${req.last_name ?? ""}`.trim(),
        customer_phone: req.phone ?? undefined,
        address: undefined,
        quote_request_id: quoteRequestId,
      };
    }
  } else if (quoteId) {
    const { data: quote } = await supabase
      .from("quotes")
      .select("user_site_id, customer_name, quote_request_id")
      .eq("id", quoteId)
      .in("user_site_id", siteIds)
      .single();
    if (quote) {
      userSiteId = quote.user_site_id;
      initialData = {
        customer_name: quote.customer_name ?? undefined,
        quote_id: quoteId,
        quote_request_id: quote.quote_request_id ?? undefined,
      };
    }
  }

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Job</h1>
      <JobForm
        niche={niche}
        userSiteId={userSiteId}
        technicians={(technicians ?? []) as { id: string; name: string; created_at: string; worker_token: string | null }[]}
        initialData={initialData}
        quoteRequestId={quoteRequestId}
        quoteId={quoteId}
      />
    </div>
  );
}
