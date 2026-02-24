import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Build redirect URL – always use HTTP for localhost to avoid ERR_SSL_PROTOCOL_ERROR
  // (Next.js dev server doesn't serve SSL)
  const base = new URL(req.url);
  if (base.hostname === "localhost") {
    base.protocol = "http:";
  }
  const redirectTo = NextResponse.redirect(new URL("/", base.toString()), {
    status: 302,
  });

  // Create client that writes cookie changes to the redirect response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectTo.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  return redirectTo;
}
