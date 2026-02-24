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
    .select("html, css, js")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!site) {
    notFound();
  }

  // Inject site slug so forms can post to correct endpoint
  const htmlWithSlug = (site.html ?? "").replace(
    /__SITE_SLUG__/g,
    slug
  );
  const srcDoc = buildSrcDoc(htmlWithSlug, site.css ?? "", site.js ?? "");

  return (
    <iframe
      title="Your site"
      srcDoc={srcDoc}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-forms"
    />
  );
}
