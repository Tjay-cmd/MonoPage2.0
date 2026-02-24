import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidNiche } from "@/lib/constants";

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // Fetch profile to get niche and redirect to correct dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("niche")
        .eq("id", data.user.id)
        .single();

      const niche = profile?.niche?.toLowerCase();
      const dashboardPath =
        niche && isValidNiche(niche)
          ? `/dashboard/${niche}`
          : "/dashboard";

      redirectTo.pathname = dashboardPath;
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/error";
  redirectTo.searchParams.set("message", "Could not verify email");
  return NextResponse.redirect(redirectTo);
}
