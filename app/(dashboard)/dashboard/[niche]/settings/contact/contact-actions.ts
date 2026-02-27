"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSiteContact(
  niche: string,
  data: {
    businessName?: string;
    sitePhone?: string;
    siteEmail?: string;
    siteAddress?: string;
    siteWhatsapp?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.businessName !== undefined)
    updates.business_name = data.businessName.trim() || null;
  if (data.sitePhone !== undefined)
    updates.site_phone = data.sitePhone.trim() || null;
  if (data.siteEmail !== undefined)
    updates.site_email = data.siteEmail.trim() || null;
  if (data.siteAddress !== undefined)
    updates.site_address = data.siteAddress.trim() || null;
  if (data.siteWhatsapp !== undefined)
    updates.site_whatsapp = data.siteWhatsapp.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("[Site Contact] Save failed:", error);
    return { error: error.message };
  }
  revalidatePath(`/dashboard/${niche}/settings/contact`);
  revalidatePath(`/dashboard/${niche}/website`);
  return {};
}
