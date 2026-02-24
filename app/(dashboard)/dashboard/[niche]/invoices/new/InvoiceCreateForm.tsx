"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, type LineItem } from "../invoice-actions";

export function InvoiceCreateForm({
  niche,
  quoteRequestId,
  quoteId,
  initialData,
}: {
  niche: string;
  quoteRequestId?: string;
  quoteId?: string;
  initialData?: {
    customer_name: string;
    customer_email: string;
    line_items?: LineItem[];
  };
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState(
    initialData?.customer_name ?? ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialData?.customer_email ?? ""
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.line_items?.length
      ? initialData.line_items
      : [{ description: "", quantity: 1, unit_price: 0 }]
  );
  const [dueDate, setDueDate] = useState("");
  const [markAsSent, setMarkAsSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  }

  function removeLine(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createInvoice(niche, {
      quote_id: quoteId,
      quote_request_id: quoteRequestId,
      customer_name: customerName,
      customer_email: customerEmail,
      line_items: lineItems,
      due_date: dueDate || undefined,
      markAsSent,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/${niche}/quotes`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer name *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer email *
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Line items *
          </label>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-3">
          {lineItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLine(i, "description", e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Qty"
                min={1}
                value={item.quantity || ""}
                onChange={(e) =>
                  updateLine(i, "quantity", parseInt(e.target.value, 10) || 0)
                }
                className="w-16 border border-gray-300 rounded-md px-2 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Price"
                min={0}
                step={0.01}
                value={item.unit_price || ""}
                onChange={(e) =>
                  updateLine(i, "unit_price", parseFloat(e.target.value) || 0)
                }
                className="w-24 border border-gray-300 rounded-md px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="text-red-600 hover:text-red-700 text-sm px-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due date *
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="markAsSent"
          checked={markAsSent}
          onChange={(e) => setMarkAsSent(e.target.checked)}
        />
        <label htmlFor="markAsSent" className="text-sm text-gray-700">
          Mark as sent and generate share link
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Invoice"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
