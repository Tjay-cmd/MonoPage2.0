"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <div className="hidden md:flex md:items-center md:space-x-4">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        {/* Desktop Auth Buttons - Logged In */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Mobile Auth Links - Logged In */}
        <div className="md:hidden pt-4 space-y-2">
          <Link
            href="/dashboard"
            className="block text-gray-700 hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Auth Buttons - Logged Out */}
      <div className="hidden md:flex md:items-center md:space-x-4">
        <Link
          href="/login"
          className="text-gray-700 hover:text-indigo-600 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Get Started
        </Link>
      </div>

      {/* Mobile Auth Links - Logged Out */}
      <div className="md:hidden pt-4 space-y-2">
        <Link
          href="/login"
          className="block text-gray-700 hover:text-indigo-600 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-center"
        >
          Get Started
        </Link>
      </div>
    </>
  );
}
