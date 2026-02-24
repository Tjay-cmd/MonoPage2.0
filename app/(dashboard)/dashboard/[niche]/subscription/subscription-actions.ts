"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Development fallback: manually activate subscription when PayFast ITN
 * cannot reach localhost. Only works when NEXT_PUBLIC_APP_URL is localhost.
 */
export async function confirmPaymentManually(
  userId: string,
  plan: "starter" | "pro",
  niche: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!baseUrl.includes("localhost")) {
    return { error: "Only available for local development" };
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const customerNumber = (count ?? 0) + 1;
  const amountCents = plan === "starter" ? 10000 : 25000;
  const now = new Date().toISOString();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status: "active",
      amount_cents: amountCents,
      customer_number: customerNumber,
      current_period_start: now,
      current_period_end: periodEnd.toISOString(),
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  await admin
    .from("profiles")
    .update({
      plan,
      subscription_status: "active",
      updated_at: now,
    })
    .eq("id", userId);

  revalidatePath(`/dashboard/${niche}/subscription`);
  revalidatePath(`/dashboard/${niche}`);
  return {};
}
