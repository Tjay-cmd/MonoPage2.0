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
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <select
        value={status}
        onChange={(e) => updateParams({ status: e.target.value })}
        className="text-base border border-gray-300 rounded-lg px-4 py-2.5 min-w-[160px]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        placeholder="Search name, email, message..."
        value={q}
        onChange={(e) => updateParams({ q: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateParams({ q: (e.target as HTMLInputElement).value });
          }
        }}
        className="text-base border border-gray-300 rounded-lg px-4 py-2.5 w-72"
      />
      {q && (
        <button
          onClick={() => updateParams({ q: "" })}
          className="text-base text-gray-500 hover:text-gray-700 font-medium"
        >
          Clear search
        </button>
      )}
    </div>
  );
}
