"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export async function createQuote(
  niche: string,
  data: {
    quote_request_id?: string;
    customer_name: string;
    customer_email: string;
    line_items: LineItem[];
    terms?: string;
    valid_until?: string;
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

  const quoteData: Record<string, unknown> = {
    quote_request_id: data.quote_request_id || null,
    user_site_id: userSiteId,
    customer_name: data.customer_name.trim(),
    customer_email: data.customer_email.trim(),
    status: data.markAsSent ? "sent" : "draft",
    line_items: lineItems,
    subtotal,
    tax,
    total,
    terms: data.terms?.trim() || null,
    valid_until: data.valid_until || null,
    share_token: data.markAsSent ? nanoid(24) : null,
    updated_at: new Date().toISOString(),
  };

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert(quoteData)
    .select("id, share_token")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return { ok: true, quoteId: quote.id, shareToken: quote.share_token };
}

export async function updateQuote(
  niche: string,
  quoteId: string,
  data: {
    customer_name?: string;
    customer_email?: string;
    line_items?: LineItem[];
    terms?: string;
    valid_until?: string;
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

  const { data: existing } = await supabase
    .from("quotes")
    .select("id, line_items, subtotal, tax, total")
    .eq("id", quoteId)
    .in("user_site_id", siteIds)
    .single();

  if (!existing) return { error: "Quote not found" };

  const lineItems =
    data.line_items ??
    (existing.line_items as LineItem[]).filter(
      (l: LineItem) => l.description?.trim() && l.quantity > 0 && l.unit_price >= 0
    );
  const subtotal = lineItems.reduce(
    (sum: number, l: LineItem) => sum + l.quantity * l.unit_price,
    0
  );
  const total = subtotal + (existing.tax ?? 0);

  const update: Record<string, unknown> = {
    ...(data.customer_name !== undefined && {
      customer_name: data.customer_name.trim(),
    }),
    ...(data.customer_email !== undefined && {
      customer_email: data.customer_email.trim(),
    }),
    ...(data.line_items !== undefined && {
      line_items: lineItems,
      subtotal,
      total,
    }),
    ...(data.terms !== undefined && { terms: data.terms.trim() || null }),
    ...(data.valid_until !== undefined && {
      valid_until: data.valid_until || null,
    }),
    updated_at: new Date().toISOString(),
  };

  if (data.markAsSent) {
    update.status = "sent";
    update.share_token = nanoid(24);
  }

  const { error } = await supabase
    .from("quotes")
    .update(update)
    .eq("id", quoteId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return { ok: true };
}
