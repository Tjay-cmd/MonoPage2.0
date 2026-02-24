import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvoiceCard } from "./InvoiceCard";
import { LeadsFilters } from "./LeadsFilters";
import { QuotesList } from "./QuotesList";
import { QuotesPageTabs } from "./QuotesPageTabs";

export default async function QuotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{ status?: string; q?: string; tab?: string }>;
}) {
  const { niche } = await params;
  const { status, q, tab = "leads" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quotes & Invoices
        </h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 mt-4">
          <p className="text-amber-800 font-medium">Pro plan required</p>
          <p className="mt-2 text-amber-700 text-sm">
            Manage quote requests, create quotes, and send invoices with PayFast.
            Upgrade to Pro to access this feature.
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Quotes & Invoices
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Publish your website to start receiving quote requests from
          customers.
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

  let query = supabase
    .from("quote_requests")
    .select(
      "id, first_name, last_name, email, phone, service, message, newsletter, status, notes, created_at"
    )
    .in("user_site_id", siteIds)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},message.ilike.${term}`
    );
  }

  const { data: requests } = await query;

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, customer_name, customer_email, status, total, created_at, share_token")
    .in("user_site_id", siteIds)
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, customer_name, customer_email, status, total, due_date, created_at, share_token")
    .in("user_site_id", siteIds)
    .order("created_at", { ascending: false });

  const newLeadsCount =
    (requests ?? []).filter((r) => r.status === "new").length;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quotes & Invoices
          </h1>
          <p className="text-lg text-gray-600">
            Quote requests from your website. Call or email to follow up.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/dashboard/${niche}/quotes/new`}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-base font-medium"
          >
            New Quote
          </a>
          <a
            href={`/dashboard/${niche}/invoices/new`}
            className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-base font-medium"
          >
            New Invoice
          </a>
        </div>
      </div>
      <QuotesPageTabs niche={niche} newLeadsCount={newLeadsCount} />
      {tab === "leads" && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Quote Requests
          </h2>
          <LeadsFilters niche={niche} />
          <QuotesList requests={requests ?? []} niche={niche} />
        </>
      )}
      {tab === "quotes" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Quotes
          </h2>
          {(!quotes || quotes.length === 0) ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p className="text-base mb-4">No quotes yet. Create one from a lead or start from scratch.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-base font-medium text-gray-900">{q.customer_name}</p>
                  <p className="text-base text-gray-500">{q.customer_email}</p>
                  <p className="text-sm text-gray-400 mt-1" suppressHydrationWarning>
                    {new Date(q.created_at).toLocaleDateString()} · {q.status}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-900">
                    R{Number(q.total).toFixed(2)}
                  </span>
                  <a
                    href={`/dashboard/${niche}/jobs/new?quote=${q.id}`}
                    className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    Create Job
                  </a>
                  {q.status === "accepted" && (
                    <a
                      href={`/dashboard/${niche}/invoices/new?quote=${q.id}`}
                      className="text-sm px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Create Invoice
                    </a>
                  )}
                  {q.share_token && (
                    <a
                      href={`/q/${q.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Invoices
          </h2>
          {(!invoices || invoices.length === 0) ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p className="text-base mb-4">No invoices yet. Create one from a lead or an accepted quote.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <InvoiceCard key={inv.id} inv={inv} niche={niche} />
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
