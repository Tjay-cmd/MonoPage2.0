"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePayFastSettings(
  niche: string,
  data: {
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
    sandbox?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      payfast_merchant_id: data.merchantId?.trim() || null,
      payfast_merchant_key: data.merchantKey?.trim() || null,
      payfast_passphrase: data.passphrase?.trim() || null,
      payfast_sandbox: data.sandbox ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/settings/payments`);
  revalidatePath(`/dashboard/${niche}/quotes`);
  return {};
}
