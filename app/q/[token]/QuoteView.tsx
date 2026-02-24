"use client";

import { useState } from "react";

type LineItem = { description: string; quantity: number; unit_price: number };

type Quote = {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  terms: string | null;
  valid_until: string | null;
  created_at: string;
};

export function QuoteView({ quote, token }: { quote: Quote; token: string }) {
  const [status, setStatus] = useState(quote.status);
  const [submitting, setSubmitting] = useState(false);

  async function handleRespond(action: "accept" | "decline") {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (data.ok) setStatus(action === "accept" ? "accepted" : "declined");
    } finally {
      setSubmitting(false);
    }
  }

  const lineItems = (quote.line_items ?? []) as LineItem[];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quote</h1>
      <p className="text-gray-600 mb-6">
        Prepared for {quote.customer_name}
        {quote.customer_email && ` (${quote.customer_email})`}
      </p>
      <p className="text-sm text-gray-400 mb-6" suppressHydrationWarning>
        Created {new Date(quote.created_at).toLocaleDateString()}
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
                ${Number(item.unit_price).toFixed(2)}
              </td>
              <td className="py-3 text-right text-gray-900 font-medium">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-48 space-y-1">
          {Number(quote.tax) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>${Number(quote.tax).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>${Number(quote.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {quote.terms && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.terms}</p>
        </div>
      )}

      {quote.valid_until && (
        <p className="text-sm text-gray-500 mb-6" suppressHydrationWarning>
          Valid until {new Date(quote.valid_until).toLocaleDateString()}
        </p>
      )}

      {status === "sent" && (
        <div className="flex gap-4">
          <button
            onClick={() => handleRespond("accept")}
            disabled={submitting}
            className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {submitting ? "..." : "Accept Quote"}
          </button>
          <button
            onClick={() => handleRespond("decline")}
            disabled={submitting}
            className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Decline
          </button>
        </div>
      )}

      {status === "accepted" && (
        <p className="py-4 text-green-700 font-medium text-center">
          You have accepted this quote. The business will contact you shortly.
        </p>
      )}

      {status === "declined" && (
        <p className="py-4 text-gray-600 text-center">
          You have declined this quote.
        </p>
      )}

      {status === "draft" && (
        <p className="py-4 text-gray-500 text-center text-sm">
          This quote is still a draft.
        </p>
      )}
    </div>
  );
}
