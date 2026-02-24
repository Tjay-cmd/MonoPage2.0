"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { sendInvoiceEmail } from "@/lib/email";

export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export async function createInvoice(
  niche: string,
  data: {
    quote_id?: string;
    quote_request_id?: string;
    customer_name: string;
    customer_email: string;
    line_items: LineItem[];
    due_date?: string;
    markAsSent?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) return { error: "No sites" };
  const userSiteId = siteIds[0];

  const lineItems = data.line_items.filter(
    (l) => l.description.trim() && l.quantity > 0 && l.unit_price >= 0
  );
  const subtotal = lineItems.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0
  );
  const tax = 0;
  const total = subtotal + tax;

  const invoiceData: Record<string, unknown> = {
    quote_id: data.quote_id || null,
    quote_request_id: data.quote_request_id || null,
    user_site_id: userSiteId,
    customer_name: data.customer_name.trim(),
    customer_email: data.customer_email.trim(),
    status: data.markAsSent ? "sent" : "draft",
    line_items: lineItems,
    subtotal,
    tax,
    total,
    due_date: data.due_date || null,
    share_token: data.markAsSent ? nanoid(24) : null,
    updated_at: new Date().toISOString(),
  };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select("id, share_token")
    .single();

  if (error) return { error: error.message };

  // Send email when marked as sent
  if (data.markAsSent && invoice.share_token) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, email_logo_url, email_brand_color, email_footer_text")
      .eq("id", user.id)
      .single();

    sendInvoiceEmail(
      data.customer_email.trim(),
      data.customer_name.trim(),
      total,
      data.due_date || null,
      invoice.share_token,
      {
        businessName: profile?.business_name ?? undefined,
        logoUrl: profile?.email_logo_url ?? undefined,
        brandColor: profile?.email_brand_color ?? undefined,
        footerText: profile?.email_footer_text ?? undefined,
      }
    ).catch((e) => console.error("[invoice] Email send failed:", e));
  }

  revalidatePath(`/dashboard/${niche}/quotes`);
  return { ok: true, invoiceId: invoice.id, shareToken: invoice.share_token };
}

export async function sendInvoiceEmailToCustomer(
  invoiceId: string,
  niche: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) return { error: "No sites" };

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("customer_name, customer_email, total, due_date, share_token")
    .eq("id", invoiceId)
    .in("user_site_id", siteIds)
    .single();

  if (invErr || !invoice?.share_token || !invoice.customer_email)
    return { error: "Invoice not found or not ready to send" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email_logo_url, email_brand_color, email_footer_text")
    .eq("id", user.id)
    .single();

  const result = await sendInvoiceEmail(
    invoice.customer_email,
    invoice.customer_name,
    Number(invoice.total),
    invoice.due_date,
    invoice.share_token,
    {
      businessName: profile?.business_name ?? undefined,
      logoUrl: profile?.email_logo_url ?? undefined,
      brandColor: profile?.email_brand_color ?? undefined,
      footerText: profile?.email_footer_text ?? undefined,
    }
  );

  if (!result.ok) return { error: result.error };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return {};
}

export async function markInvoiceAsPaid(
  invoiceId: string,
  niche: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) return { error: "No sites" };

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .in("user_site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return {};
}
