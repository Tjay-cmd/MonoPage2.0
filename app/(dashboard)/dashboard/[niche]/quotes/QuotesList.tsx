"use client";

import { useState } from "react";
import { updateQuoteStatus, updateQuoteNotes } from "./actions";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
];

type Request = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  newsletter: boolean;
  status: string;
  notes: string | null;
  created_at: string;
};

export function QuotesList({
  requests,
  niche,
}: {
  requests: Request[];
  niche: string;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">
        <p className="text-base mb-4">
          No quote requests yet. Add a contact form to your website and publish to
          start receiving leads.
        </p>
        <a
          href={`/dashboard/${niche}/website`}
          className="text-lg text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Go to Your Website →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {requests.map((r) => (
        <RequestCard key={r.id} request={r} niche={niche} />
      ))}
    </div>
  );
}

function RequestCard({ request: r, niche }: { request: Request; niche: string }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(r.notes ?? "");
  const [expanded, setExpanded] = useState(false);

  async function handleSaveNotes() {
    await updateQuoteNotes(r.id, notesValue, niche);
    setEditingNotes(false);
  }

  const messagePreview = r.message.length > 80 ? `${r.message.slice(0, 80)}...` : r.message;
  const showExpandBtn = r.message.length > 80 || r.notes;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {r.first_name} {r.last_name}
          </h3>
          <div className="flex flex-wrap gap-4 text-base text-gray-600">
            <a
              href={`mailto:${r.email}`}
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {r.email}
            </a>
            {r.phone && (
              <a
                href={`tel:${r.phone.replace(/\D/g, "")}`}
                className="text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {r.phone}
              </a>
            )}
          </div>
          {r.service && (
            <p className="text-base text-gray-500">Service: {r.service}</p>
          )}
          <p className="text-base text-gray-600 mt-2">
            {expanded ? r.message : messagePreview}
            {showExpandBtn && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </p>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full text-base border border-gray-300 rounded-lg px-4 py-3 min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveNotes}
                    className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setNotesValue(r.notes ?? "");
                      setEditingNotes(false);
                    }}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <p className="text-base text-gray-600 flex-1 min-w-0">
                  {r.notes ? (
                    <span className="text-gray-700">{r.notes}</span>
                  ) : (
                    <span className="text-gray-400 italic">No notes</span>
                  )}
                </p>
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 shrink-0 font-medium"
                >
                  {r.notes ? "Edit" : "Add"} notes
                </button>
              </div>
            )}
            </div>
          )}
          <p className="text-sm text-gray-400 mt-3" suppressHydrationWarning>
            {new Date(r.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <select
            value={r.status}
            onChange={async (e) => {
              await updateQuoteStatus(r.id, e.target.value, niche);
            }}
            className="text-base border border-gray-300 rounded-lg px-4 py-2.5 min-w-[140px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-3 items-end">
            <a
              href={`/dashboard/${niche}/quotes/new?from=${r.id}`}
              className="text-sm px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Create Quote
            </a>
            <a
              href={`/dashboard/${niche}/jobs/new?from=${r.id}`}
              className="text-sm px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Create Job
            </a>
            <a
              href={`/dashboard/${niche}/invoices/new?from=${r.id}`}
              className="text-sm px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Create Invoice
            </a>
            <div className="flex gap-2">
              <a
                href={`mailto:${r.email}`}
                className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium"
              >
                Email
              </a>
              {r.phone && (
                <a
                  href={`tel:${r.phone.replace(/\D/g, "")}`}
                  className="text-sm px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
