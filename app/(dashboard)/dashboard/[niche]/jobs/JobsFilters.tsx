"use client";

import { useRouter, useSearchParams } from "next/navigation";

const DATE_OPTIONS = [
  { value: "", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function JobsFilters({ niche }: { niche: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const date = searchParams.get("date") ?? "";
  const q = searchParams.get("q") ?? "";

  function updateParams(updates: {
    status?: string;
    date?: string;
    q?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.status !== undefined) {
      if (updates.status) params.set("status", updates.status);
      else params.delete("status");
    }
    if (updates.date !== undefined) {
      if (updates.date) params.set("date", updates.date);
      else params.delete("date");
    }
    if (updates.q !== undefined) {
      if (updates.q) params.set("q", updates.q);
      else params.delete("q");
    }
    router.push(`/dashboard/${niche}/jobs?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex flex-wrap gap-2">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all-dates"}
            type="button"
            onClick={() => updateParams({ date: opt.value })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              date === opt.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all-status"}
            type="button"
            onClick={() => updateParams({ status: opt.value })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              status === opt.value
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search jobs..."
            value={q}
            onChange={(e) => updateParams({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>
        {q && (
          <button
            type="button"
            onClick={() => updateParams({ q: "" })}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
