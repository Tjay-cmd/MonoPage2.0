"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPaymentManually } from "./subscription-actions";

type Props = {
  userId: string;
  niche: string;
};

export function ConfirmPaymentForm({ userId, niche }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState<"starter" | "pro">("pro");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await confirmPaymentManually(userId, plan, niche);
    setLoading(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6">
      <h3 className="font-semibold text-amber-900">
        Payment successful but not detected (localhost)
      </h3>
      <p className="mt-2 text-sm text-amber-800">
        PayFast cannot reach localhost to notify us. Confirm your payment to activate your subscription:
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-900">
            Which plan did you pay for?
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as "starter" | "pro")}
            className="mt-1 block w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
          >
            <option value="starter">Starter (R100)</option>
            <option value="pro">Pro (R250)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Activating…" : "Confirm & activate subscription"}
        </button>
      </form>
    </div>
  );
}
