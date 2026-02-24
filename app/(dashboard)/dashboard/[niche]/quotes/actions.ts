"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQuoteStatus(
  id: string,
  status: string,
  niche: string
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

  const { error } = await supabase
    .from("quote_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("user_site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return { ok: true };
}

export async function updateQuoteNotes(
  id: string,
  notes: string,
  niche: string
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

  const { error } = await supabase
    .from("quote_requests")
    .update({ notes: notes ?? "", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("user_site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/quotes`);
  return { ok: true };
}
