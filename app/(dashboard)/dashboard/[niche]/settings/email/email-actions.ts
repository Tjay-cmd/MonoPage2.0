"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateEmailBranding(
  niche: string,
  data: {
    businessName?: string;
    logoUrl?: string;
    brandColor?: string;
    footerText?: string;
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
    updates.business_name = data.businessName || null;
  if (data.logoUrl !== undefined) updates.email_logo_url = data.logoUrl || null;
  if (data.brandColor !== undefined)
    updates.email_brand_color = data.brandColor || "#6366f1";
  if (data.footerText !== undefined)
    updates.email_footer_text = data.footerText || null;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/settings/email`);
  revalidatePath(`/dashboard/${niche}/quotes`);
  return {};
}
