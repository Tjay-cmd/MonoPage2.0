"use client";

import type { PayFastSubscriptionData } from "@/lib/payfast";

type PlanPayment = {
  plan: "starter" | "pro";
  payment: PayFastSubscriptionData;
  price: { customerNumber: number; amountCents: number };
};

type Props = {
  plans: [PlanPayment, PlanPayment];
  formAction: string;
};

export function SubscriptionForm({ plans, formAction }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plans.map(({ plan, payment, price }) => (
          <div key={plan} className="space-y-4">
            <PlanCard
              plan={plan}
              customerNumber={price.customerNumber}
              amountCents={price.amountCents}
              description={
                plan === "starter"
                  ? "AI website builder and My Images"
                  : "Website + Quotes & Invoices + PayFast + Email Design"
              }
            />
            <PayFastForm payment={payment} formAction={formAction} plan={plan} />
          </div>
        ))}
      </div>
    </div>
  );
}

const FIELDS = [
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
  "name_first", "name_last", "email_address", "m_payment_id", "amount", "item_name",
  "subscription_type", "recurring_amount", "frequency", "cycles",
  "billing_date", "custom_str1", "custom_str2", "signature",
] as const;

function PayFastForm({
  payment,
  formAction,
  plan,
}: {
  payment: PayFastSubscriptionData;
  formAction: string;
  plan: "starter" | "pro";
}) {
  const amountRand = (Number(payment.amount) * 1).toFixed(0);
  return (
    <form action={formAction} method="POST">
      {FIELDS.map((key) => {
        const val = payment[key as keyof PayFastSubscriptionData];
        if (val == null || val === "") return null;
        return <input key={key} type="hidden" name={key} value={String(val)} />;
      })}
      <button
        type="submit"
        className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
      >
        Subscribe to {plan === "starter" ? "Starter" : "Pro"} — R{amountRand}/month
      </button>
    </form>
  );
}

function PlanCard({
  plan,
  customerNumber,
  amountCents,
  description,
}: {
  plan: "starter" | "pro";
  customerNumber: number;
  amountCents: number;
  description: string;
}) {
  const label = plan === "starter" ? "Starter" : "Pro";
  const amountRand = (amountCents / 100).toFixed(0);
  return (
    <div className="rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      <p className="mt-1 text-2xl font-bold text-indigo-600">R{amountRand}</p>
      <p className="mt-1 text-sm text-gray-500">/month</p>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <p className="mt-2 text-xs text-gray-500">
        You&apos;ll be customer #{customerNumber}
      </p>
    </div>
  );
}
