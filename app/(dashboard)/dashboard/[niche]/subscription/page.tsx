import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPriceForNextCustomer } from "@/lib/billing";
import { buildPayFastSubscription, getPayFastSubscriptionFormAction } from "@/lib/payfast";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { ConfirmPaymentForm } from "./ConfirmPaymentForm";

export default async function SubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const { niche } = await params;
  const { success, cancelled } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, amount_cents, customer_number, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const nameParts = (profile?.full_name || profile?.business_name || "").split(" ");
  const nameFirst = nameParts[0] || "";
  const nameLast = nameParts.slice(1).join(" ") || nameParts[0] || "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const isLocalhost = baseUrl.includes("localhost");

  if (subscription?.status === "active") {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Subscription</h1>
        {success === "1" && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg">
            Payment successful. Your subscription is now active.
          </div>
        )}
        <SubscriptionStatus
          plan={subscription.plan}
          amountCents={subscription.amount_cents}
          customerNumber={subscription.customer_number}
          currentPeriodEnd={subscription.current_period_end}
        />
      </div>
    );
  }

  const [starterPrice, proPrice] = await Promise.all([
    getPriceForNextCustomer("starter"),
    getPriceForNextCustomer("pro"),
  ]);

  const starterPayment = buildPayFastSubscription(
    `sub_${user.id}_starter_${Date.now()}`,
    starterPrice.amountCents,
    "MonoPage Starter - Monthly",
    `${baseUrl}/dashboard/${niche}/subscription?success=1`,
    `${baseUrl}/dashboard/${niche}/subscription?cancelled=1`,
    `${baseUrl}/api/payfast/subscription-notify`,
    user.id,
    "starter",
    { nameFirst, nameLast, email: user.email ?? undefined }
  );

  const proPayment = buildPayFastSubscription(
    `sub_${user.id}_pro_${Date.now()}`,
    proPrice.amountCents,
    "MonoPage Pro - Monthly",
    `${baseUrl}/dashboard/${niche}/subscription?success=1`,
    `${baseUrl}/dashboard/${niche}/subscription?cancelled=1`,
    `${baseUrl}/api/payfast/subscription-notify`,
    user.id,
    "pro",
    { nameFirst, nameLast, email: user.email ?? undefined }
  );

  if (!starterPayment || !proPayment) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
        <p className="text-amber-600">
          PayFast is not configured for subscriptions. Please add MONOPAGE_PAYFAST_* or PAYFAST_* env vars with a passphrase.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose your plan</h1>
      <p className="text-gray-600 mb-6">
        Subscribe to MonoPage. You can cancel anytime.
      </p>
      {success === "1" && isLocalhost && (
        <div className="mb-6">
          <ConfirmPaymentForm userId={user.id} niche={niche} />
        </div>
      )}
      {cancelled === "1" && (
        <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-lg">
          Payment was cancelled. You can try again when ready.
        </div>
      )}
      <SubscriptionForm
        plans={[
          { plan: "starter", payment: starterPayment, price: starterPrice },
          { plan: "pro", payment: proPayment, price: proPrice },
        ]}
        formAction={getPayFastSubscriptionFormAction()}
      />
    </div>
  );
}
