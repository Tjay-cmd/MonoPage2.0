import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QuoteCreateForm } from "../QuoteCreateForm";

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { niche } = await params;
  const { from: requestId } = await searchParams;

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

  let request: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    service: string | null;
    message: string;
  } | null = null;

  if (requestId) {
    const { data } = await supabase
      .from("quote_requests")
      .select("first_name, last_name, email, phone, service, message")
      .eq("id", requestId)
      .in("user_site_id", siteIds)
      .single();
    request = data;
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {request ? "Create Quote" : "New Quote"}
      </h1>
      <QuoteCreateForm
        niche={niche}
        quoteRequestId={requestId || undefined}
        initialData={
          request
            ? {
                customer_name: `${request.first_name} ${request.last_name}`.trim(),
                customer_email: request.email,
              }
            : undefined
        }
      />
    </div>
  );
}
