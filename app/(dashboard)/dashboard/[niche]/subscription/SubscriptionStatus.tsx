type Props = {
  plan: string;
  amountCents: number;
  customerNumber: number | null;
  currentPeriodEnd: string | null;
};

export function SubscriptionStatus({
  plan,
  amountCents,
  customerNumber,
  currentPeriodEnd,
}: Props) {
  const amountRand = (amountCents / 100).toFixed(0);
  const periodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {plan === "starter" ? "Starter" : "Pro"} Plan
          </h2>
          <p className="mt-1 text-2xl font-bold text-indigo-600">R{amountRand}</p>
          <p className="text-sm text-gray-500">/month</p>
        </div>
        {customerNumber != null && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Customer #{customerNumber}
          </span>
        )}
      </div>
      {periodEnd && (
        <p className="mt-4 text-sm text-gray-600">
          Next billing date: {periodEnd}
        </p>
      )}
      <p className="mt-4 text-sm text-gray-500">
        Manage your subscription (cancel, pause, update card) via the PayFast dashboard or contact support.
      </p>
    </div>
  );
}
