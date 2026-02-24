"use client";

const TAILWIND_SCRIPT =
  '<script src="https://cdn.tailwindcss.com"></script>';

/**
 * Inject Tailwind Play CDN into the document head.
 */
function injectTailwind(html: string): string {
  if (html.includes("cdn.tailwindcss.com")) return html;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${TAILWIND_SCRIPT}\n</head>`);
  }
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>\n${TAILWIND_SCRIPT}`);
  }
  return html;
}

/**
 * Build a complete HTML document from the parts.
 * If html already is a full document (has <!DOCTYPE or <html>), use it directly.
 * Otherwise combine html/css/js into one.
 * Tailwind Play CDN is injected so the AI can use utility classes.
 */
function buildSrcDoc(html: string, css: string, js: string): string {
  const trimmed = html.trim().toLowerCase();
  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
    return injectTailwind(html);
  }

  return injectTailwind(`<!DOCTYPE html>
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
</html>`);
}

export default function Preview({
  html,
  css,
  js,
  userSiteId,
}: {
  html: string;
  css: string;
  js: string;
  userSiteId?: string;
}) {
  // In editor preview, inject slug placeholder so form works. Drafts use preview:userSiteId.
  let processedHtml = html;
  if (userSiteId) {
    processedHtml = html.replace(/__SITE_SLUG__/g, `preview:${userSiteId}`);
  }
  const srcDoc = buildSrcDoc(processedHtml, css, js);

  return (
    <iframe
      title="Preview"
      sandbox="allow-scripts allow-forms allow-same-origin"
      className="w-full h-full min-h-[400px] border border-gray-200 rounded-lg bg-white"
      srcDoc={srcDoc}
    />
  );
}
