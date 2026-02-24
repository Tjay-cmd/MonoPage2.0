"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Derive niche from URL as fallback (e.g. /dashboard/plumber)
function getNicheFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/(plumber|photographer|barber)/);
  return match ? match[1] : null;
}

const PLUMBER_NAV_ITEMS = [
  { href: "jobs", label: "Jobs", comingSoon: false, proOnly: true },
  { href: "quotes", label: "Quotes & Invoices", comingSoon: false, proOnly: true },
  { href: "inventory", label: "Inventory", comingSoon: true },
  { href: "website", label: "Your Website", comingSoon: false },
  { href: "images", label: "My Images", comingSoon: false },
  { href: "settings/email", label: "Email Design", comingSoon: false, proOnly: true },
  { href: "settings/payments", label: "Payments", comingSoon: false, proOnly: true },
  { href: "subscription", label: "Subscription", comingSoon: false },
];

export default function DashboardSideNav({
  userEmail,
  niche,
  nicheLabel,
  isAdmin,
  plan,
}: {
  userEmail: string;
  niche: string | null;
  nicheLabel: string;
  isAdmin: boolean;
  plan?: string | null;
}) {
  const pathname = usePathname();
  const nicheFromUrl = getNicheFromPathname(pathname);
  const activeNiche = niche ?? nicheFromUrl;
  const basePath = activeNiche ? `/dashboard/${activeNiche}` : "/dashboard";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          MonoPage
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {nicheLabel}
          </p>
        </div>

        {activeNiche === "plumber" &&
          PLUMBER_NAV_ITEMS.map((item) => {
            const isProOnly = "proOnly" in item && item.proOnly;
            const needsPro = isProOnly && plan !== "pro";
            return (
              <div key={item.href} className="relative">
                {item.comingSoon ? (
                  <span
                    className={`block px-3 py-2 rounded-md text-sm ${
                      pathname === `${basePath}/${item.href}`
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    <span className="ml-2 text-xs text-gray-400">
                      Coming soon
                    </span>
                  </span>
                ) : (
                  <Link
                    href={`${basePath}/${item.href}`}
                    className={`block px-3 py-2 rounded-md text-sm ${
                      pathname.startsWith(`${basePath}/${item.href}`)
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    {needsPro && (
                      <span className="ml-2 text-xs text-amber-600">(Pro)</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}

        {activeNiche === "plumber" && isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
              Admin
            </p>
            <Link
              href={`${basePath}/templates`}
              className={`block px-3 py-2 rounded-md text-sm ${
                pathname === `${basePath}/templates`
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Upload Templates
            </Link>
          </div>
        )}

        {activeNiche !== "plumber" && (
          <p className="px-3 py-2 text-sm text-gray-500">
            Dashboard tools coming soon
          </p>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <p className="text-xs text-gray-500 truncate px-2" title={userEmail}>
          {userEmail}
        </p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </form>
        <Link
          href="/"
          className="block px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
        >
          ← Back to home
        </Link>
      </div>
    </aside>
  );
}
