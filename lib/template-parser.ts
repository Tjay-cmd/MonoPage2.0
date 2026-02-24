import JSZip from "jszip";

export interface ParsedTemplate {
  html: string;
  css: string;
  js: string;
  assets: { path: string; content: ArrayBuffer }[];
}

const ALLOWED_ASSET_EXT = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

function isAllowedAsset(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_ASSET_EXT.some((ext) => lower.endsWith(ext));
}

export async function parseTemplateZip(
  zipBuffer: ArrayBuffer
): Promise<ParsedTemplate> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const files = Object.keys(zip.files);
  const indexFile = files.find((f) => f.endsWith("index.html") && !f.endsWith("/"));

  if (!indexFile) {
    throw new Error("ZIP must contain index.html");
  }

  const html =
    (await zip.file(indexFile)?.async("string")) ??
    "";

  const cssFile = files.find((f) =>
    ["styles.css", "style.css"].some((n) => f.endsWith(n))
  );
  const css = cssFile
    ? (await zip.file(cssFile)?.async("string")) ?? ""
    : "";

  const jsFile = files.find((f) =>
    ["script.js", "scripts.js"].some((n) => f.endsWith(n))
  );
  const js = jsFile
    ? (await zip.file(jsFile)?.async("string")) ?? ""
    : "";

  const assets: { path: string; content: ArrayBuffer }[] = [];
  for (const filePath of files) {
    if (filePath.endsWith("/")) continue;
    if (
      filePath.endsWith("index.html") ||
      filePath.endsWith("styles.css") ||
      filePath.endsWith("style.css") ||
      filePath.endsWith("script.js") ||
      filePath.endsWith("scripts.js")
    ) {
      continue;
    }
    if (
      (filePath.includes("assets/") || filePath.includes("asset/")) &&
      isAllowedAsset(filePath)
    ) {
      const file = zip.file(filePath);
      if (file) {
        const content = await file.async("arraybuffer");
        assets.push({ path: filePath, content });
      }
    }
  }

  return { html, css, js, assets };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
