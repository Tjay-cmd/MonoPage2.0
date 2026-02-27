"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
];

export function LeadsFilters({ niche }: { niche: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  function updateParams(updates: { status?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.status !== undefined) {
      if (updates.status) params.set("status", updates.status);
      else params.delete("status");
    }
    if (updates.q !== undefined) {
      if (updates.q) params.set("q", updates.q);
      else params.delete("q");
    }
    router.push(`/dashboard/${niche}/quotes?${params.toString()}`);
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search leads..."
          value={q}
          onChange={(e) => updateParams({ q: e.target.value })}
          className="w-full sm:w-72 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
        />
      </div>

      {/* Status pills — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            onClick={() => updateParams({ status: opt.value })}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap shrink-0 transition-colors ${
              status === opt.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
