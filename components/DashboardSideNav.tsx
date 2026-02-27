"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function getNicheFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/(plumber|photographer|barber)/);
  return match ? match[1] : null;
}

const PLUMBER_NAV_ITEMS = [
  { href: "jobs",              label: "Jobs",             comingSoon: false, proOnly: true  },
  { href: "quotes",            label: "Quotes & Invoices",comingSoon: false, proOnly: true  },
  { href: "website",           label: "Your Website",     comingSoon: false                 },
  { href: "images",            label: "My Images",        comingSoon: false                 },
  { href: "settings/contact",  label: "Site Contact",     comingSoon: false                 },
  { href: "settings/email",    label: "Email Design",     comingSoon: false, proOnly: true  },
  { href: "settings/payments", label: "Payments",         comingSoon: false, proOnly: true  },
  { href: "subscription",      label: "Subscription",     comingSoon: false                 },
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

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-indigo-600">MonoPage</Link>
        {/* Close button – mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          {nicheLabel}
        </p>

        {activeNiche === "plumber" &&
          PLUMBER_NAV_ITEMS.map((item) => {
            const isProOnly = "proOnly" in item && item.proOnly;
            const needsPro = isProOnly && plan !== "pro" && !isAdmin;
            const isActive = pathname.startsWith(`${basePath}/${item.href}`);
            return (
              <div key={item.href}>
                {item.comingSoon ? (
                  <span className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-default">
                    {item.label}
                    <span className="text-xs text-gray-300">Soon</span>
                  </span>
                ) : (
                  <Link
                    href={`${basePath}/${item.href}`}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                    {needsPro && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded font-medium">Pro</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}

        {activeNiche === "plumber" && isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin</p>
            <Link
              href={`${basePath}/templates`}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname === `${basePath}/templates`
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Upload Templates
            </Link>
          </div>
        )}

        {activeNiche !== "plumber" && (
          <p className="px-3 py-2 text-sm text-gray-400">Dashboard tools coming soon</p>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
        <p className="text-xs text-gray-400 truncate px-3 mb-2" title={userEmail}>{userEmail}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            Sign out
          </button>
        </form>
        <Link
          href="/"
          className="block px-3 py-2.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="text-sm font-bold text-indigo-600">MonoPage</Link>
        <div className="w-9" /> {/* spacer to centre logo */}
      </header>

      {/* ── Mobile overlay backdrop ─────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar panel ──────────────────────────────── */}
      {/* Desktop: always visible fixed sidebar */}
      {/* Mobile: slide-in drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
