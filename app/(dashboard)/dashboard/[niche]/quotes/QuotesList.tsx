"use client";

import { useState } from "react";
import { updateQuoteStatus, updateQuoteNotes } from "./actions";

const STATUS_OPTIONS = [
  { value: "new",        label: "New" },
  { value: "contacted",  label: "Contacted" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "accepted",   label: "Accepted" },
  { value: "declined",   label: "Declined" },
  { value: "invoiced",   label: "Invoiced" },
  { value: "paid",       label: "Paid" },
];

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  new:        { dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  contacted:  { dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  quote_sent: { dot: "bg-purple-500",  badge: "bg-purple-100 text-purple-700" },
  accepted:   { dot: "bg-green-500",   badge: "bg-green-100 text-green-700" },
  declined:   { dot: "bg-red-400",     badge: "bg-red-100 text-red-700" },
  invoiced:   { dot: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-700" },
  paid:       { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
};

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

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function QuotesList({ requests, niche }: { requests: Request[]; niche: string }) {
  if (requests.length === 0) {
    return (
      <div className="py-16 sm:py-20 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 text-base mb-1">No quote requests yet</p>
        <p className="text-gray-500 text-sm mb-4">Add a contact form to your website to start receiving leads.</p>
        <a href={`/dashboard/${niche}/website`} className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
          Go to Your Website
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => <RequestCard key={r.id} request={r} niche={niche} />)}
    </div>
  );
}

function RequestCard({ request: r, niche }: { request: Request; niche: string }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(r.notes ?? "");
  const [expanded, setExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(r.status);
  const [statusOpen, setStatusOpen] = useState(false);

  async function handleSaveNotes() {
    await updateQuoteNotes(r.id, notesValue, niche);
    setEditingNotes(false);
  }

  async function handleStatusChange(s: string) {
    setCurrentStatus(s);
    setStatusOpen(false);
    await updateQuoteStatus(r.id, s, niche);
  }

  const styles = STATUS_STYLES[currentStatus] ?? { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600" };
  const messagePreview = r.message.length > 120 ? `${r.message.slice(0, 120)}…` : r.message;

  return (
    <div className="rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all bg-white">
      <div className="p-4 sm:p-5">
        {/* Top row: avatar + info + status */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-700">{getInitials(r.first_name, r.last_name)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name line */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{r.first_name} {r.last_name}</h3>
              {r.service && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg">{r.service}</span>
              )}
              <span className="text-xs text-gray-400" suppressHydrationWarning>{timeAgo(r.created_at)}</span>
            </div>

            {/* Contact links */}
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm mb-2">
              <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-indigo-600 hover:underline truncate max-w-[200px] sm:max-w-none">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {r.email}
              </a>
              {r.phone && (
                <a href={`tel:${r.phone.replace(/\D/g, "")}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {r.phone}
                </a>
              )}
            </div>

            {/* Message */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {expanded ? r.message : messagePreview}
              {r.message.length > 120 && (
                <button onClick={() => setExpanded(!expanded)} className="ml-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
                  {expanded ? "less" : "more"}
                </button>
              )}
            </p>
          </div>

          {/* Status badge – top right */}
          <div className="relative shrink-0">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${styles.badge}`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${styles.dot}`} />
              <span className="hidden sm:inline">{STATUS_OPTIONS.find(o => o.value === currentStatus)?.label ?? currentStatus}</span>
              <span className="sm:hidden">{STATUS_OPTIONS.find(o => o.value === currentStatus)?.label?.split(" ")[0] ?? currentStatus}</span>
              <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-9 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 min-w-[160px]">
                {STATUS_OPTIONS.map((opt) => {
                  const s = STATUS_STYLES[opt.value] ?? { dot: "bg-gray-400", badge: "" };
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 ${currentStatus === opt.value ? "font-semibold text-indigo-600" : "text-gray-700"}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notes section (expanded) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 ml-0 sm:ml-14">
            {editingNotes ? (
              <div className="space-y-2.5">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add internal notes..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">Save</button>
                  <button onClick={() => { setNotesValue(r.notes ?? ""); setEditingNotes(false); }} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-500 flex-1">
                  {notesValue || <span className="italic text-gray-400">No notes yet</span>}
                </p>
                <button onClick={() => setEditingNotes(true)} className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-semibold shrink-0">
                  {notesValue ? "Edit" : "Add note"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-50">
          {/* Quick contact icons */}
          <div className="flex gap-2">
            <a href={`mailto:${r.email}`} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Email">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
            {r.phone && (
              <a href={`tel:${r.phone.replace(/\D/g, "")}`} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Call">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}
            <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors" title="Notes">
              <svg className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2">
            <a href={`/dashboard/${niche}/quotes/new?from=${r.id}`} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs sm:text-sm transition-colors">
              Quote
            </a>
            <a href={`/dashboard/${niche}/jobs/new?from=${r.id}`} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-xs sm:text-sm transition-colors">
              Job
            </a>
            <a href={`/dashboard/${niche}/invoices/new?from=${r.id}`} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-semibold text-xs sm:text-sm transition-colors">
              Invoice
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
