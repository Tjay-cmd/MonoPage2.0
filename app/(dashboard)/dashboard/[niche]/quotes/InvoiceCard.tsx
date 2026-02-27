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

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  draft:   { dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
  sent:    { dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  paid:    { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  overdue: { dot: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function InvoiceCard({ inv, niche }: { inv: Invoice; niche: string }) {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isOverdue = inv.status === "sent" && inv.due_date && new Date(inv.due_date) < new Date();
  const effectiveStatus = isOverdue ? "overdue" : inv.status;
  const styles = STATUS_STYLES[effectiveStatus] ?? STATUS_STYLES.draft;

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
    <div className="rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all bg-white">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
        {/* Avatar */}
        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-indigo-700">{getInitials(inv.customer_name)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{inv.customer_name}</span>
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${styles.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {effectiveStatus}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{inv.customer_email}</p>
          <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>
            {new Date(inv.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            {inv.due_date && (
              <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                {" · "}Due {new Date(inv.due_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              </span>
            )}
          </p>
        </div>

        {/* Amount + actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            R{Number(inv.total).toFixed(2)}
          </p>
          <div className="flex gap-2">
            {inv.status === "sent" && (
              <button
                onClick={handleMarkPaid}
                disabled={loading}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? "…" : "Mark Paid"}
              </button>
            )}
            {inv.share_token && inv.customer_email && (
              <button
                onClick={handleEmailInvoice}
                disabled={emailLoading || emailSent}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >
                {emailLoading ? "…" : emailSent ? "Sent!" : "Email"}
              </button>
            )}
            {inv.share_token && (
              <a
                href={`/i/${inv.share_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 sm:p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="View invoice"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {emailError && (
        <div className="px-4 sm:px-5 pb-4">
          <p className="text-xs sm:text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{emailError}</p>
        </div>
      )}
    </div>
  );
}
