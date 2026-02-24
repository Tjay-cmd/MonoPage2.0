import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAIClient } from "@/lib/azure-openai";

/**
 * Combine separate html/css/js into a single HTML document.
 * Handles both full documents and body-only fragments.
 */
function buildDocument(html: string, css: string, js: string): string {
  // If html already looks like a complete document, inject css/js into it
  if (html.trim().toLowerCase().startsWith("<!doctype") || html.trim().toLowerCase().startsWith("<html")) {
    return html;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;
}

/**
 * Parse BEFORE/AFTER diff format from AI response.
 * Returns { before, after } or null if not found.
 */
function parseDiffFromResponse(content: string): { before: string; after: string } | null {
  // Match BEFORE: ... ``` ... ``` ... AFTER: ... ``` ... ```
  let beforeMatch = content.match(/BEFORE:\s*```\w*\s*([\s\S]*?)```/i);
  let afterMatch = content.match(/AFTER:\s*```\w*\s*([\s\S]*?)```/i);
  if (beforeMatch && afterMatch) {
    return {
      before: beforeMatch[1].trim(),
      after: afterMatch[1].trim(),
    };
  }
  // Alternatives: OLD/NEW
  beforeMatch = content.match(/(?:OLD|REPLACE):\s*```\w*\s*([\s\S]*?)```/i);
  afterMatch = content.match(/(?:NEW|WITH):\s*```\w*\s*([\s\S]*?)```/i);
  if (beforeMatch && afterMatch) {
    return {
      before: beforeMatch[1].trim(),
      after: afterMatch[1].trim(),
    };
  }
  // Two consecutive code blocks containing :root (color patch without labels)
  const blocks = [...content.matchAll(/```\w*\s*([\s\S]*?)```/g)];
  if (blocks.length >= 2) {
    const b1 = blocks[0][1].trim();
    const b2 = blocks[1][1].trim();
    if (b1.includes(":root") && b2.includes(":root") && b1.length > 20 && b2.length > 20) {
      return { before: b1, after: b2 };
    }
  }
  return null;
}

/** Normalize whitespace for flexible matching. */
function normalizeForMatch(str: string): string {
  return str
    .split("\n")
    .map((l) => l.trimEnd().replace(/\s+/g, " "))
    .join("\n")
    .replace(/\n\s*\n/g, "\n");
}

/**
 * Apply a patch by replacing before with after in the document.
 * Returns patched document or null if before not found.
 */
function applyPatch(doc: string, before: string, after: string): string | null {
  if (doc.includes(before)) return doc.replace(before, after);
  const beforeTrimEnd = before.split("\n").map((l) => l.trimEnd()).join("\n");
  if (doc.includes(beforeTrimEnd)) return doc.replace(beforeTrimEnd, after);
  // Try matching by normalized content (more flexible for AI formatting drift)
  const beforeNorm = normalizeForMatch(before);
  const docLines = doc.split("\n");
  for (let i = 0; i <= docLines.length - before.split("\n").length; i++) {
    const chunk = docLines.slice(i, i + before.split("\n").length).join("\n");
    if (normalizeForMatch(chunk) === beforeNorm) {
      return doc.replace(chunk, after);
    }
  }
  // Fallback: when before/after look like CSS rules, replace by selector
  if (before.includes("{") && after.includes("{") && before.includes("}")) {
    return applyCssRulePatch(doc, after);
  }
  return null;
}

/**
 * Replace CSS rules in document by selector. Used when AI's "before" doesn't match
 * exactly (e.g. AI guessed color:#333 but doc has color:var(--color-text)).
 */
function applyCssRulePatch(doc: string, cssBlock: string): string | null {
  const ruleRegex = /([.#\w\s\-\:\],\(\)]+)\s*\{([\s\S]*?)\}/g;
  const rules: { selector: string; full: string }[] = [];
  let m;
  while ((m = ruleRegex.exec(cssBlock)) !== null) {
    const selector = m[1].trim();
    if (selector.length > 1) rules.push({ selector, full: m[0] });
  }
  if (rules.length === 0) return null;

  let result = doc;
  for (const rule of rules) {
    const escaped = rule.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const docRegex = new RegExp(escaped + "\\s*\\{[\\s\\S]*?\\}", "g");
    const docMatch = result.match(docRegex);
    if (docMatch) {
      result = result.replace(docMatch[0], rule.full);
    }
  }
  return result === doc ? null : result;
}

/**
 * Try to apply a CSS-only update (e.g. :root variables) when AI returns just CSS.
 * Searches code blocks first, then anywhere in the content.
 */
function applyCssPatch(doc: string, content: string): string | null {
  const docRootMatch = doc.match(/:root\s*\{[\s\S]*?\}/);
  if (!docRootMatch) return null;

  // Try code block first
  const codeBlocks = content.matchAll(/```(?:css|html)?\s*([\s\S]*?)```/g);
  for (const m of codeBlocks) {
    const rootMatch = m[1].match(/:root\s*\{[\s\S]*?\}/);
    if (rootMatch) return doc.replace(docRootMatch[0], rootMatch[0]);
  }

  // Try :root anywhere in content (no code block)
  const rawRootMatch = content.match(/:root\s*\{[\s\S]*?\}/);
  if (rawRootMatch) return doc.replace(docRootMatch[0], rawRootMatch[0]);

  return null;
}

/**
 * Extract the HTML document from the AI response.
 * Handles multiple formats: ```html, ```HTML, bare HTML, etc.
 */
function extractHtmlFromResponse(content: string): string | null {
  // Try ```html or ```HTML code block (case insensitive)
  let match = content.match(/```(?:html|HTML)\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();

  // Try generic code block that starts with <!DOCTYPE or <html
  match = content.match(/```\w*\s*([\s\S]*?<!DOCTYPE[\s\S]*?)```/i);
  if (match) return match[1].trim();

  match = content.match(/```\w*\s*([\s\S]*?<html[\s\S]*?)```/i);
  if (match) return match[1].trim();

  // Fallback: find raw HTML document in response
  const docStart = content.search(/<!DOCTYPE\s+html/i);
  if (docStart !== -1) {
    const rest = content.slice(docStart);
    const endMatch = rest.match(/<\/html>\s*/i);
    return endMatch ? rest.slice(0, endMatch.index! + endMatch[0].length).trim() : rest.trim();
  }

  const htmlStart = content.search(/<html\s/i);
  if (htmlStart !== -1) {
    const rest = content.slice(htmlStart);
    const endMatch = rest.match(/<\/html>\s*/i);
    return endMatch ? rest.slice(0, endMatch.index! + endMatch[0].length).trim() : rest.trim();
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);

    const { data: usage } = await supabase
      .from("ai_usage")
      .select("edit_count")
      .eq("user_id", user.id)
      .eq("hour_bucket", hourBucket.toISOString())
      .single();

    const editCount = usage?.edit_count ?? 0;
    const editsRemaining = Math.max(0, 25 - editCount);

    return NextResponse.json({ editsRemaining });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

const SYSTEM_PROMPT = `You are an expert web designer that edits a SINGLE HTML file. You produce clean, modern, professional websites.

OUTPUT FORMAT (choose one—PREFER BEFORE/AFTER when possible):
- For COLOR-ONLY changes (palette, navbar, links, CSS variables): ALWAYS use BEFORE/AFTER with the :root block or the specific style lines you change. Never return the full document for color changes.
- For SMALL edits (single element, few lines, one CSS rule): return a minimal BEFORE/AFTER patch.
- For SECTION edits (one section, one block of changes, e.g. 10–150 lines): return a BEFORE/AFTER patch with the smallest contiguous block that contains all changes.
- Only use the full \`\`\`html document when changes are scattered across many distant parts of the page.

BEFORE/AFTER format:
  BEFORE:
  \`\`\`css
  <exact lines from the document - copy whitespace and indentation exactly>
  \`\`\`
  AFTER:
  \`\`\`css
  <modified lines>
  \`\`\`
  Copy the BEFORE block EXACTLY from the document so the replace succeeds. Keep both blocks minimal.
  For color changes: return ONLY the :root { ... } block in both BEFORE and AFTER. No other content.

RULES:
- Tailwind Play CDN is pre-loaded. Use Tailwind utility classes for layout, colors, spacing, typography (e.g. flex, grid, p-4, text-blue-600, rounded-lg, shadow-md).
- Prefer Tailwind classes over custom CSS. Use custom CSS in <style> only when Tailwind cannot do it (e.g. keyframe animations, complex selectors).
- The user gives you a complete HTML document with inline <style> and <script> tags.
- CSS goes inside <style> in the <head>. JavaScript goes inside <script> before </body>.
- Use plain HTML, Tailwind classes, and vanilla JavaScript only. NO JSX, React, or frameworks.
- No eval(), no external scripts or stylesheets beyond Tailwind (already loaded), no fetch() to external URLs.
- NEVER use external image URLs (e.g. via.placeholder.com, placehold.co, unsplash). The page runs in a sandboxed iframe with no network access.
- For placeholder images, use inline SVG or CSS gradients as visual placeholders.
- When the user mentions an image by name (e.g. "add the logo"), match it to the available images list and use the exact URL provided as the img src attribute.
- Keep ALL existing content and styles unless the user asks to remove them.
- Do NOT invent or add content the user did not ask for. Only modify what was requested.

QUOTE/CONTACT FORMS (critical): When adding a contact form, quote request form, "get a quote" section, or "send us a message" form:
- NEVER build custom backend, JavaScript form handlers, or fetch() to fake endpoints. We have a built-in system.
- ALWAYS use a native <form> with action="/quote/request/__SITE_SLUG__" and method="post". The __SITE_SLUG__ placeholder is replaced at runtime—do not change it.
- Use these exact input name attributes: first_name, last_name, email, message (required); phone, service, newsletter (optional).
- For newsletter: use type="checkbox" with name="newsletter" and value="on".
- For service: use a <select> or dropdown with name="service".
- Create the form UI and wire it in one step—do not add an unlinked form that needs "linking" later.

COLOR CHANGES (critical): When changing a color palette or section colors:
- Tailwind classes like text-green-600, bg-green-500, text-teal-600 do NOT use :root—they use Tailwind's built-in colors. You MUST replace these class names in the HTML.
- Replace Tailwind color classes with arbitrary values: text-green-600 → text-[#001B2E], bg-green-500 → bg-[#294C60]. Or use inline style for custom hex.
- Also update :root variables and any <style> rules if the section uses var() or custom CSS.
- For "change the about section colors": find ALL elements in that section (headings, stats, icons, cards) and update their color classes or styles.

DESIGN PRINCIPLES (use Tailwind when possible):
- Use a clean, minimal design with plenty of whitespace (p-6, space-y-4, etc.).
- Layout: flex, flex-col, grid, gap-4, items-center, justify-between.
- Colors: text-slate-700, bg-white, text-blue-600, etc. Keep a consistent palette.
- Typography: text-lg, font-semibold, leading-relaxed.
- Navbar: flex, gap-8, items-center.
- Cards: rounded-lg, shadow-md, p-6.
- Sections: max-w-6xl mx-auto px-6.
- Footer: bg-slate-900 text-white, py-12.
- Responsive: use sm:, md:, lg: breakpoints (e.g. md:flex-row, lg:grid-cols-3).
- Ensure sufficient contrast.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, html = "", css = "", js = "", images = [] } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);

    const { data: usage } = await supabase
      .from("ai_usage")
      .select("edit_count")
      .eq("user_id", user.id)
      .eq("hour_bucket", hourBucket.toISOString())
      .single();

    const currentCount = usage?.edit_count ?? 0;
    if (currentCount >= 25) {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0, 0, 0);
      const minutesLeft = Math.ceil(
        (nextHour.getTime() - now.getTime()) / 60000
      );
      return NextResponse.json(
        {
          error: "Limit reached",
          retryAfter: minutesLeft,
        },
        { status: 429 }
      );
    }

    // Build a single document from the current state
    const currentDoc = buildDocument(html, css, js);

    // Build image list for the AI
    let imageContext = "";
    if (Array.isArray(images) && images.length > 0) {
      const imageList = images
        .map((img: { name: string; url: string }) => `  - "${img.name}" -> ${img.url}`)
        .join("\n");
      imageContext = `\n\nThe user has uploaded these images. When they mention an image by name, use the matching URL as the <img src>:\n${imageList}`;
    }

    const userContent = `Here is the current HTML document:\n\n${currentDoc}${imageContext}\n\nUser request: ${prompt}`;

    const { client, model } = getAIClient();

    const result = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 8192,
      temperature: 0.2,
    });

    const content = result.choices[0]?.message?.content ?? "";
    let finalHtml: string | null = null;

    // Try diff format first
    const parsed = parseDiffFromResponse(content);
    if (parsed && parsed.before.length > 0) {
      finalHtml = applyPatch(currentDoc, parsed.before, parsed.after);
    }

    // Fallback: full document
    if (!finalHtml) {
      finalHtml = extractHtmlFromResponse(content);
    }

    // Fallback: CSS-only update (e.g. :root color variables)
    if (!finalHtml) {
      finalHtml = applyCssPatch(currentDoc, content);
    }

    if (!finalHtml) {
      console.error("[AI editor] Unparseable response length:", content.length);
      console.error("[AI editor] Response preview:", content.slice(0, 500));
      return NextResponse.json(
        {
          error:
            "AI did not return valid output. Try a simpler prompt (e.g. 'Change the primary color to #001B2E') or try again.",
        },
        { status: 400 }
      );
    }

    await supabase.from("ai_usage").upsert(
      {
        user_id: user.id,
        hour_bucket: hourBucket.toISOString(),
        edit_count: currentCount + 1,
      },
      { onConflict: "user_id,hour_bucket", ignoreDuplicates: false }
    );

    const { data: updatedUsage } = await supabase
      .from("ai_usage")
      .select("edit_count")
      .eq("user_id", user.id)
      .eq("hour_bucket", hourBucket.toISOString())
      .single();

    return NextResponse.json({
      html: finalHtml,
      css: "",
      js: "",
      editsRemaining: 25 - (updatedUsage?.edit_count ?? currentCount + 1),
    });
  } catch (err) {
    console.error("AI route error:", err);
    if (err instanceof Error && err.message.includes("No AI configured")) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 502 }
    );
  }
}
