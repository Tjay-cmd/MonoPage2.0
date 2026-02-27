import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InvoiceCreateForm } from "./InvoiceCreateForm";

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{ from?: string; quote?: string }>;
}) {
  const { niche } = await params;
  const { from: requestId, quote: quoteId } = await searchParams;

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
  if (profile?.plan !== "pro" && !profile?.is_admin) redirect(`/dashboard/${niche}/subscription`);

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) redirect(`/dashboard/${niche}/quotes`);

  let initialData: { customer_name: string; customer_email: string; line_items?: { description: string; quantity: number; unit_price: number }[] } | undefined;

  if (quoteId) {
    const { data: quote } = await supabase
      .from("quotes")
      .select("customer_name, customer_email, line_items")
      .eq("id", quoteId)
      .in("user_site_id", siteIds)
      .eq("status", "accepted")
      .single();
    if (quote) {
      initialData = {
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        line_items: (quote.line_items ?? []) as { description: string; quantity: number; unit_price: number }[],
      };
    }
  } else if (requestId) {
    const { data: req } = await supabase
      .from("quote_requests")
      .select("first_name, last_name, email")
      .eq("id", requestId)
      .in("user_site_id", siteIds)
      .single();
    if (req) {
      initialData = {
        customer_name: `${req.first_name} ${req.last_name}`.trim(),
        customer_email: req.email,
      };
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/${niche}/quotes`}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Quotes & Invoices
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>
      <InvoiceCreateForm
        niche={niche}
        quoteRequestId={requestId}
        quoteId={quoteId}
        initialData={initialData}
      />
    </div>
  );
}
