"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Tab = "leads" | "quotes" | "invoices";

export function QuotesPageTabs({
  niche,
  newLeadsCount,
}: {
  niche: string;
  newLeadsCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "leads";

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "leads") params.delete("tab");
    else params.set("tab", t);
    router.push(`/dashboard/${niche}/quotes?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      <button
        onClick={() => setTab("leads")}
        className={`px-5 py-3 text-base font-medium rounded-t-lg -mb-px ${
          tab === "leads"
            ? "bg-white border border-gray-200 border-b-white text-indigo-700"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Leads
        {newLeadsCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-sm bg-indigo-100 text-indigo-700 rounded">
            {newLeadsCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setTab("quotes")}
        className={`px-5 py-3 text-base font-medium rounded-t-lg -mb-px ${
          tab === "quotes"
            ? "bg-white border border-gray-200 border-b-white text-indigo-700"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Quotes
      </button>
      <button
        onClick={() => setTab("invoices")}
        className={`px-5 py-3 text-base font-medium rounded-t-lg -mb-px ${
          tab === "invoices"
            ? "bg-white border border-gray-200 border-b-white text-indigo-700"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Invoices
      </button>
    </div>
  );
}
