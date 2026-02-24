"use client";

import { useState } from "react";
import {
  markInvoiceAsPaid,
  sendInvoiceEmailToCustomer,
} from "../invoices/invoice-actions";

type Invoice = {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  due_date: string | null;
  created_at: string;
  share_token: string | null;
};

export function InvoiceCard({
  inv,
  niche,
}: {
  inv: Invoice;
  niche: string;
}) {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleMarkPaid() {
    setLoading(true);
    await markInvoiceAsPaid(inv.id, niche);
    setLoading(false);
  }

  async function handleEmailInvoice() {
    setEmailLoading(true);
    setEmailError(null);
    const res = await sendInvoiceEmailToCustomer(inv.id, niche);
    setEmailLoading(false);
    if (res.error) setEmailError(res.error);
    else setEmailSent(true);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-base font-medium text-gray-900">{inv.customer_name}</p>
        <p className="text-base text-gray-500">{inv.customer_email}</p>
        <p className="text-sm text-gray-400 mt-1" suppressHydrationWarning>
          {new Date(inv.created_at).toLocaleDateString()} · {inv.status}
          {inv.due_date &&
            ` · Due ${new Date(inv.due_date).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-gray-900">
          R{Number(inv.total).toFixed(2)}
        </span>
        {inv.status === "sent" && (
          <button
            onClick={handleMarkPaid}
            disabled={loading}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Mark as Paid"}
          </button>
        )}
        {inv.share_token && inv.customer_email && (
          <button
            onClick={handleEmailInvoice}
            disabled={emailLoading || emailSent}
            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {emailLoading ? "..." : emailSent ? "Email sent" : "Email invoice"}
          </button>
        )}
        {emailError && (
          <span className="text-xs text-red-600">{emailError}</span>
        )}
        {inv.share_token && (
          <a
            href={`/i/${inv.share_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View
          </a>
        )}
      </div>
    </div>
  );
}
