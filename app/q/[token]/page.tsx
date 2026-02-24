import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { QuoteView } from "./QuoteView";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: quote } = await admin
    .from("quotes")
    .select("id, customer_name, customer_email, status, line_items, subtotal, tax, total, terms, valid_until, created_at")
    .eq("share_token", token)
    .single();

  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <QuoteView quote={quote} token={token} />
      </div>
    </div>
  );
}
