import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PayFastForm } from "./PayFastForm";
import { buildPayFastPayment, getPayFastFormAction } from "@/lib/payfast";

type LineItem = { description: string; quantity: number; unit_price: number };

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const { payment } = await searchParams;

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, user_site_id, customer_name, customer_email, status, line_items, subtotal, tax, total, due_date, paid_at, created_at")
    .eq("share_token", token)
    .single();

  if (!invoice) notFound();

  const { data: userSite } = await admin
    .from("user_sites")
    .select("user_id")
    .eq("id", invoice.user_site_id)
    .single();

  const { data: ownerProfile } = userSite
    ? await admin
        .from("profiles")
        .select("plan, payfast_merchant_id, payfast_merchant_key, payfast_passphrase, payfast_sandbox")
        .eq("id", userSite.user_id)
        .single()
    : { data: null };

  const hasProAndPayFast =
    ownerProfile?.plan === "pro" &&
    ownerProfile?.payfast_merchant_id &&
    ownerProfile?.payfast_merchant_key;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const paymentData = hasProAndPayFast
    ? buildPayFastPayment(
        invoice.id,
        parseFloat(String(invoice.total ?? 0)),
        `Invoice for ${invoice.customer_name}`,
        `${baseUrl}/i/${token}?payment=success`,
        `${baseUrl}/i/${token}?payment=cancelled`,
        `${baseUrl}/api/payfast/notify`,
        {
          merchantId: ownerProfile.payfast_merchant_id,
          merchantKey: ownerProfile.payfast_merchant_key,
          passphrase: ownerProfile.payfast_passphrase ?? undefined,
          sandbox: ownerProfile.payfast_sandbox ?? false,
        }
      )
    : null;

  const lineItems = (invoice.line_items ?? []) as LineItem[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        {payment === "success" && (
          <p className="mb-4 py-3 px-4 bg-green-50 text-green-800 rounded-lg font-medium">
            Payment received. Thank you!
          </p>
        )}
        {payment === "cancelled" && (
          <p className="mb-4 py-3 px-4 bg-amber-50 text-amber-800 rounded-lg font-medium">
            Payment was cancelled. You can try again below.
          </p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Invoice</h1>
        <p className="text-gray-600 mb-6">
          {invoice.customer_name}
          {invoice.customer_email && ` (${invoice.customer_email})`}
        </p>
        <p className="text-sm text-gray-400 mb-6" suppressHydrationWarning>
          Created {new Date(invoice.created_at).toLocaleDateString()}
          {invoice.due_date &&
            ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
        </p>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-sm font-medium text-gray-700">
                Description
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-700 w-20">
                Qty
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-700 w-24">
                Price
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-700 w-24">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.description}</td>
                <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">
                  R{Number(item.unit_price).toFixed(2)}
                </td>
                <td className="py-3 text-right text-gray-900 font-medium">
                  R{(item.quantity * item.unit_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-48 space-y-1">
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>R{Number(invoice.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>R{Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.status === "paid" && invoice.paid_at && (
          <p className="py-4 text-green-700 font-medium text-center" suppressHydrationWarning>
            Paid on {new Date(invoice.paid_at).toLocaleDateString()}
          </p>
        )}

        {invoice.status === "sent" && paymentData && ownerProfile && (
          <PayFastForm
            payment={paymentData}
            formAction={getPayFastFormAction(ownerProfile.payfast_sandbox)}
          />
        )}
        {invoice.status === "sent" && !paymentData && (
          <p className="mt-6 py-3 px-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
            {parseFloat(String(invoice.total ?? 0)) < 5
              ? "This invoice is below the minimum PayFast amount (R5). Please contact the business to arrange payment."
              : "Online payment is not set up for this business. Please contact them to arrange payment."}
          </p>
        )}
      </div>
    </div>
  );
}
