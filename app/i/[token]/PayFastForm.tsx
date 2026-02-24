import type { PayFastPaymentData } from "@/lib/payfast";

type Props = {
  payment: PayFastPaymentData;
  formAction: string;
};

export function PayFastForm({ payment, formAction }: Props) {
  return (
    <form action={formAction} method="POST" className="mt-6">
      {/* Fields MUST be in PayFast's required order */}
      <input type="hidden" name="merchant_id" value={payment.merchant_id} />
      <input type="hidden" name="merchant_key" value={payment.merchant_key} />
      <input type="hidden" name="return_url" value={payment.return_url} />
      <input type="hidden" name="cancel_url" value={payment.cancel_url} />
      <input type="hidden" name="notify_url" value={payment.notify_url} />
      <input type="hidden" name="m_payment_id" value={payment.m_payment_id} />
      <input type="hidden" name="amount" value={payment.amount} />
      <input type="hidden" name="item_name" value={payment.item_name} />
      <input type="hidden" name="signature" value={payment.signature} />
      <button
        type="submit"
        className="w-full py-4 px-6 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 text-lg"
      >
        Pay with PayFast
      </button>
    </form>
  );
}
