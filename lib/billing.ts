import { createAdminClient } from "@/lib/supabase/admin";

export type PlanType = "starter" | "pro";

export const BILLING_TIERS = [
  { maxCustomers: 100, starterCents: 10000, proCents: 25000 },
  { maxCustomers: 500, starterCents: 15000, proCents: 35000 },
  { maxCustomers: 1000, starterCents: 20000, proCents: 45000 },
  { maxCustomers: Infinity, starterCents: 25000, proCents: 55000 },
] as const;

export function getAmountForCustomerNumber(
  customerNumber: number,
  plan: PlanType
): number {
  for (const tier of BILLING_TIERS) {
    if (customerNumber <= tier.maxCustomers) {
      return plan === "starter" ? tier.starterCents : tier.proCents;
    }
  }
  return plan === "starter"
    ? BILLING_TIERS[BILLING_TIERS.length - 1].starterCents
    : BILLING_TIERS[BILLING_TIERS.length - 1].proCents;
}

/**
 * Returns the next customer number (count of active subscribers + 1)
 * and the amount in cents for that plan.
 */
export async function getPriceForNextCustomer(
  plan: PlanType
): Promise<{ customerNumber: number; amountCents: number }> {
  const count = await getActiveSubscriptionCount();
  const customerNumber = count + 1;
  const amountCents = getAmountForCustomerNumber(customerNumber, plan);
  return { customerNumber, amountCents };
}

/**
 * Get active subscription count for display.
 */
export async function getActiveSubscriptionCount(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  return error ? 0 : (count ?? 0);
}
