import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

/**
 * Build a complete HTML document from the parts.
 * If html already is a full document, use it directly.
 * Otherwise combine html/css/js into one.
 */
function buildSrcDoc(html: string, css: string, js: string): string {
  const trimmed = html.trim().toLowerCase();
  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
    return html;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
${html}
  <script>${js}<\/script>
</body>
</html>`;
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("user_sites")
    .select("html, css, js, user_id")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!site) {
    notFound();
  }

  // Fetch profile for runtime placeholder replacement
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, site_phone, site_email, site_address, site_whatsapp")
    .eq("id", site.user_id)
    .single();

  const businessName = profile?.business_name ?? "Your Business";
  const phone = profile?.site_phone ?? "+27 12 345 6789";
  const phoneRaw = (profile?.site_phone ?? profile?.site_whatsapp ?? "27123456789").replace(/\D/g, "") || "27123456789";
  const email = profile?.site_email ?? "info@example.com";
  const addressRaw = profile?.site_address ?? "123 Business Street, Johannesburg, Gauteng";
  const address = addressRaw.replace(/\n/g, "<br>");
  const addressEnc = encodeURIComponent(addressRaw.replace(/\n/g, " "));
  const whatsapp = profile?.site_whatsapp ?? phoneRaw;

  let html = site.html ?? "";
  html = html.replace(/__SITE_SLUG__/g, slug);
  html = html.replace(/__BUSINESS_NAME__/g, businessName);
  html = html.replace(/__PHONE__/g, phone);
  html = html.replace(/__PHONE_RAW__/g, phoneRaw);
  html = html.replace(/__EMAIL__/g, email);
  html = html.replace(/__ADDRESS__/g, address);
  html = html.replace(/__ADDRESS_ENC__/g, addressEnc);
  html = html.replace(/__WHATSAPP__/g, whatsapp);
  const mapEmbed = `<iframe src="https://www.google.com/maps?q=${addressEnc}&output=embed" width="100%" height="300" style="border:0;border-radius:8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>`;
  html = html.replace(/__MAP_EMBED__/g, mapEmbed);
  const srcDoc = buildSrcDoc(html, site.css ?? "", site.js ?? "");

  return (
    <iframe
      title="Your site"
      srcDoc={srcDoc}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-forms"
    />
  );
}
