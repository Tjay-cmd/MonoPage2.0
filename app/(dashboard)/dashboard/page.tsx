import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isValidNiche } from "@/lib/constants";
import { setNiche } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("niche")
    .eq("id", user.id)
    .single();

  const niche = profile?.niche?.toLowerCase();
  if (niche && isValidNiche(niche)) {
    redirect(`/dashboard/${niche}`);
  }

  // New users: choose your business type (saves to profile and redirects)
  return (
    <div className="py-12 px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to MonoPage
        </h1>
        <p className="text-gray-600 mb-6">
          Choose your business type to access your specialized dashboard.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-indigo-900 mb-2">
            What type of business are you?
          </h2>
          <p className="text-indigo-800 mb-4">
            We&apos;ll set up your dashboard with tools built for your industry.
          </p>
          <div className="flex flex-wrap gap-4">
            {["plumber", "photographer", "barber"].map((n) => (
              <form key={n} action={setNiche}>
                <input type="hidden" name="niche" value={n} />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium capitalize transition-colors"
                >
                  {n}
                </button>
              </form>
            ))}
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
