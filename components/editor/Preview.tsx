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

type Placeholders = {
  businessName: string;
  phone: string;
  phoneRaw: string;
  email: string;
  address: string;
  addressEnc: string;
  whatsapp: string;
  mapEmbed: string;
};

export default function Preview({
  html,
  css,
  js,
  userSiteId,
  placeholders,
}: {
  html: string;
  css: string;
  js: string;
  userSiteId?: string;
  placeholders?: Placeholders;
}) {
  let processedHtml = html;
  if (userSiteId) {
    processedHtml = processedHtml.replace(/__SITE_SLUG__/g, `preview:${userSiteId}`);
  }
  if (placeholders) {
    processedHtml = processedHtml.replace(/__BUSINESS_NAME__/g, placeholders.businessName);
    processedHtml = processedHtml.replace(/__PHONE__/g, placeholders.phone);
    processedHtml = processedHtml.replace(/__PHONE_RAW__/g, placeholders.phoneRaw);
    processedHtml = processedHtml.replace(/__EMAIL__/g, placeholders.email);
    processedHtml = processedHtml.replace(/__ADDRESS__/g, placeholders.address);
    processedHtml = processedHtml.replace(/__ADDRESS_ENC__/g, placeholders.addressEnc);
    processedHtml = processedHtml.replace(/__WHATSAPP__/g, placeholders.whatsapp);
    processedHtml = processedHtml.replace(/__MAP_EMBED__/g, placeholders.mapEmbed);
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
