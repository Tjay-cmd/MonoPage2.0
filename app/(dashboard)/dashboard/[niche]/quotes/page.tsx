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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro" && !profile?.is_admin) {
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quotes & Invoices</h1>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mt-4 max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-amber-800 font-semibold text-base">Pro plan required</p>
          </div>
          <p className="text-amber-700 text-sm mb-4">Upgrade to Pro to manage quotes and invoices.</p>
          <a href={`/dashboard/${niche}/subscription`} className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm">
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
      <div className="p-4 sm:p-6 lg:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quotes & Invoices</h1>
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center mt-4 max-w-lg">
          <p className="font-semibold text-gray-900 mb-1">No website published yet</p>
          <p className="text-gray-500 text-sm mb-4">Publish your website to start receiving leads.</p>
          <a href={`/dashboard/${niche}/website`} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
            Go to Your Website →
          </a>
        </div>
      </div>
    );
  }

  let query = supabase
    .from("quote_requests")
    .select("id, first_name, last_name, email, phone, service, message, newsletter, status, notes, created_at")
    .in("user_site_id", siteIds)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},message.ilike.${term}`);
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

  const allRequests = requests ?? [];
  const allQuotes = quotes ?? [];
  const allInvoices = invoices ?? [];

  const newLeadsCount = allRequests.filter((r) => r.status === "new").length;
  const totalRevenue = allInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const pendingTotal = allInvoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total), 0);
  const acceptedQuotes = allQuotes.filter((q) => q.status === "accepted").length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 max-w-[1600px]">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Quotes & Invoices
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
              Manage leads, send quotes and collect payments
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/dashboard/${niche}/quotes/new`}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-sm transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Quote</span>
            </a>
            <a
              href={`/dashboard/${niche}/invoices/new`}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-sm text-gray-700 shadow-sm transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </a>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Leads */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 lg:p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              {newLeadsCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                  {newLeadsCount} new
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{allRequests.length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">Total Leads</p>
          </div>

          {/* Quotes Sent */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 lg:p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {acceptedQuotes > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-600 rounded-full">
                  {acceptedQuotes} ✓
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{allQuotes.length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">Quotes Sent</p>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm">
            <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl bg-white/20 flex items-center justify-center mb-2 sm:mb-3">
              <svg className="h-5 w-5 lg:h-6 lg:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              R{totalRevenue.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5 font-medium">Revenue Collected</p>
          </div>

          {/* Awaiting */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm">
            <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl bg-white/20 flex items-center justify-center mb-2 sm:mb-3">
              <svg className="h-5 w-5 lg:h-6 lg:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              R{pendingTotal.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs sm:text-sm text-orange-100 mt-0.5 font-medium">Awaiting Payment</p>
          </div>
        </div>

        {/* ── Main card ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-100 px-4 sm:px-6 pt-4 sm:pt-5">
            <QuotesPageTabs
              niche={niche}
              newLeadsCount={newLeadsCount}
              quotesCount={allQuotes.length}
              invoicesCount={allInvoices.length}
            />
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 lg:p-6">

            {/* Leads tab */}
            {tab === "leads" && (
              <>
                <LeadsFilters niche={niche} />
                <QuotesList requests={allRequests} niche={niche} />
              </>
            )}

            {/* Quotes tab */}
            {tab === "quotes" && (
              <div>
                {allQuotes.length === 0 ? (
                  <div className="py-16 sm:py-20 text-center">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 text-base mb-1">No quotes yet</p>
                    <p className="text-gray-500 text-sm">Create one from a lead or start from scratch.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allQuotes.map((q) => (
                      <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-indigo-700">
                              {q.customer_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 text-sm sm:text-base">{q.customer_name}</span>
                              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                q.status === "accepted" ? "bg-green-100 text-green-700" :
                                q.status === "declined" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>{q.status}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{q.customer_email}</p>
                            <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>
                              {new Date(q.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">R{Number(q.total).toFixed(2)}</p>
                          <div className="flex gap-2">
                            <a href={`/dashboard/${niche}/jobs/new?quote=${q.id}`} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-xs sm:text-sm">Job</a>
                            {q.status === "accepted" && (
                              <a href={`/dashboard/${niche}/invoices/new?quote=${q.id}`} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-xs sm:text-sm">Invoice</a>
                            )}
                            {q.share_token && (
                              <a href={`/q/${q.share_token}`} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoices tab */}
            {tab === "invoices" && (
              <div>
                {allInvoices.length === 0 ? (
                  <div className="py-16 sm:py-20 text-center">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 text-base mb-1">No invoices yet</p>
                    <p className="text-gray-500 text-sm">Create one from a lead or an accepted quote.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allInvoices.map((inv) => (
                      <InvoiceCard key={inv.id} inv={inv} niche={niche} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
