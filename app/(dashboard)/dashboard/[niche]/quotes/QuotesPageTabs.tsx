"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Tab = "leads" | "quotes" | "invoices";

export function QuotesPageTabs({
  niche,
  newLeadsCount,
  quotesCount,
  invoicesCount,
}: {
  niche: string;
  newLeadsCount: number;
  quotesCount?: number;
  invoicesCount?: number;
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

  const tabs: { key: Tab; label: string; count?: number; redBadge?: boolean }[] = [
    { key: "leads",    label: "Leads",    count: newLeadsCount > 0 ? newLeadsCount : undefined, redBadge: true },
    { key: "quotes",   label: "Quotes",   count: quotesCount },
    { key: "invoices", label: "Invoices", count: invoicesCount },
  ];

  return (
    <div className="flex gap-0 overflow-x-auto pb-0 scrollbar-none -mx-1 px-1">
      {tabs.map(({ key, label, count, redBadge }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex items-center gap-2 whitespace-nowrap px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            tab === key
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
          }`}
        >
          {label}
          {count !== undefined && count > 0 && (
            <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full font-bold ${
              redBadge && tab !== key
                ? "bg-red-500 text-white"
                : tab === key
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-200 text-gray-600"
            }`}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
