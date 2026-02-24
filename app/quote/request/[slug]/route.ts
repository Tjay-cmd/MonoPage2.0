import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendNewQuoteRequestNotification } from "@/lib/email";

function getBody(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return request.json();
  }
  return request.formData().then((fd) => {
    const out: Record<string, string> = {};
    fd.forEach((v, k) => {
      out[k] = typeof v === "string" ? v : (v as File).name;
    });
    return out;
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || typeof slug !== "string" || slug.length > 100) {
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 400 }
      );
    }

    let body: Record<string, string>;
    try {
      body = await getBody(request);
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const first_name = (body.first_name ?? "").trim();
    const last_name = (body.last_name ?? "").trim();
    const email = (body.email ?? "").trim();
    const message = (body.message ?? "").trim();

    const isFormPost = !(request.headers.get("accept") ?? "").includes("application/json");

    if (!first_name || !last_name || !email || !message) {
      const msg = "First name, last name, email, and message are required";
      if (isFormPost) {
        return NextResponse.redirect(
          new URL(`/quote/request/${slug}/error?message=${encodeURIComponent(msg)}`, request.url),
          303
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const msg = "Invalid email address";
      if (isFormPost) {
        return NextResponse.redirect(
          new URL(`/quote/request/${slug}/error?message=${encodeURIComponent(msg)}`, request.url),
          303
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const phone = (body.phone ?? "").trim() || null;
    const service = (body.service ?? "").trim() || null;
    const newsletter =
      body.newsletter === "on" ||
      body.newsletter === "true" ||
      body.newsletter === "1";

    let user_site_id: string;

    // Preview mode: slug is "preview:userSiteId" — user must be logged in and own the site
    if (slug.startsWith("preview:")) {
      const userSiteId = slug.slice(8);
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isFormPost) {
          return NextResponse.redirect(
            new URL(
              `/quote/request/${slug}/error?message=${encodeURIComponent("Please sign in to submit.")}`,
              request.url
            ),
            303
          );
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: site } = await supabase
        .from("user_sites")
        .select("id")
        .eq("id", userSiteId)
        .eq("user_id", user.id)
        .single();
      if (!site) {
        if (isFormPost) {
          return NextResponse.redirect(
            new URL(
              `/quote/request/${slug}/error?message=${encodeURIComponent("Site not found.")}`,
              request.url
            ),
            303
          );
        }
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
      user_site_id = site.id;
    } else {
      // Published site: lookup by slug
      const admin = createAdminClient();
      const { data: site } = await admin
        .from("user_sites")
        .select("id")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (!site) {
        if (isFormPost) {
          return NextResponse.redirect(
            new URL(
              `/quote/request/${slug}/error?message=${encodeURIComponent("Site not found. Publish your site to receive quote requests.")}`,
              request.url
            ),
            303
          );
        }
        return NextResponse.json(
          { error: "Site not found" },
          { status: 404 }
        );
      }
      user_site_id = site.id;
    }

    const admin = createAdminClient();

    const { error } = await admin.from("quote_requests").insert({
      user_site_id,
      first_name,
      last_name,
      email,
      phone: phone || null,
      service: service || null,
      message,
      newsletter,
      status: "new",
    });

    if (error) {
      console.error("[quote-request] insert error:", error);
      return NextResponse.json(
        { error: "Failed to submit" },
        { status: 500 }
      );
    }

    // Notify owner (non-blocking, best-effort)
    const { data: site } = await admin
      .from("user_sites")
      .select("user_id")
      .eq("id", user_site_id)
      .single();
    if (site?.user_id) {
      const { data: userData } = await admin.auth.admin.getUserById(site.user_id);
      if (userData?.user?.email) {
        sendNewQuoteRequestNotification(
          userData.user.email,
          `${first_name} ${last_name}`,
          email,
          message
        ).catch((e) => console.error("[quote-request] email notify:", e));
      }
    }

    // Redirect to thank-you page (form POST) or return JSON (fetch)
    const accept = request.headers.get("accept") ?? "";
    if (!accept.includes("application/json")) {
      return NextResponse.redirect(
        new URL(`/quote/request/${slug}/thanks`, request.url),
        303
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[quote-request] error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
