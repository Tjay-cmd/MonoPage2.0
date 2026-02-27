import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAIClient } from "@/lib/azure-openai";
import { classifyRequest } from "@/lib/editor/classify-request";
import { extractSections } from "@/lib/editor/extract-sections";

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
  if (doc.includes(before)) return doc.replaceAll(before, after);
  const beforeTrimEnd = before.split("\n").map((l) => l.trimEnd()).join("\n");
  if (doc.includes(beforeTrimEnd)) return doc.replaceAll(beforeTrimEnd, after);
  // Try matching by normalized content (more flexible for AI formatting drift)
  const beforeNorm = normalizeForMatch(before);
  const docLines = doc.split("\n");
  for (let i = 0; i <= docLines.length - before.split("\n").length; i++) {
    const chunk = docLines.slice(i, i + before.split("\n").length).join("\n");
    if (normalizeForMatch(chunk) === beforeNorm) {
      return doc.replaceAll(chunk, after);
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

const COLOR_MENTION_RE = /\b(navy|blue|teal|green|red|orange|purple|coral|black|white|dark|light|#[0-9a-fA-F]{3,6})\b/i;

/**
 * Build a simplified fallback prompt when the AI's first response couldn't be parsed.
 * Returns a more directive prompt that's easier to patch.
 */
function buildFallbackPrompt(originalPrompt: string): string | null {
  if (COLOR_MENTION_RE.test(originalPrompt)) {
    const colorMatch = originalPrompt.match(/#[0-9a-fA-F]{3,6}/i);
    const colorHint = colorMatch ? colorMatch[0] : "#001f3f";
    return `Change all button and link background colors to ${colorHint}. Find every <button> and <a> tag that has a background color class (like bg-blue-600, bg-indigo-600) and replace it. Return BEFORE/AFTER showing each element's exact original HTML and the modified HTML. Copy BEFORE blocks exactly as they appear in the document.`;
  }
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

const CORE_PROMPT = `You are an expert web designer that edits a SINGLE HTML file. You produce clean, modern, professional websites.

OUTPUT FORMAT (choose one—PREFER BEFORE/AFTER when possible):
- For GLOBAL color changes (palette, theme, :root variables): use BEFORE/AFTER with the :root block only.
- For BUTTON, LINK, or specific element color changes: you MUST include the actual <button>, <a>, or element HTML in BEFORE/AFTER. Buttons use Tailwind classes (e.g. bg-blue-600)—replace those with bg-[#hex]. Do NOT return only :root for button/element color changes.
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
  For :root-only changes: return the :root block. For button/element color changes: return the full element HTML (e.g. the <button> or <a> tag with its classes).

RULES:
- Tailwind Play CDN is pre-loaded. Use Tailwind utility classes for layout, colors, spacing, typography (e.g. flex, grid, p-4, text-blue-600, rounded-lg, shadow-md).
- Prefer Tailwind classes over custom CSS. Use custom CSS in <style> only when Tailwind cannot do it (e.g. keyframe animations, complex selectors).
- The user gives you a complete HTML document with inline <style> and <script> tags.
- CSS goes inside <style> in the <head>. JavaScript goes inside <script> before </body>.
- Use plain HTML, Tailwind classes, and vanilla JavaScript only. NO JSX, React, or frameworks.
- No eval(), no external scripts or stylesheets beyond Tailwind (already loaded), no fetch() to external URLs.
- NEVER use external image URLs (e.g. via.placeholder.com, placehold.co, unsplash). The page runs in a sandboxed iframe with no network access.
- For placeholder images, use inline SVG or CSS gradients as visual placeholders.
- Keep ALL existing content and styles unless the user asks to remove them.
- Do NOT invent or add content the user did not ask for. Only modify what was requested.`;

const DESIGN_PRINCIPLES = `
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

const FORM_RULES = `
QUOTE/CONTACT FORMS (critical): When adding a contact form, quote request form, "get a quote" section, or "send us a message" form:
- NEVER build custom backend, JavaScript form handlers, or fetch() to fake endpoints. We have a built-in system.
- ALWAYS use a native <form> with action="/quote/request/__SITE_SLUG__" and method="post". The __SITE_SLUG__ placeholder is replaced at runtime—do not change it.
- NEVER remove or replace these runtime placeholders: __BUSINESS_NAME__, __PHONE__, __PHONE_RAW__, __EMAIL__, __ADDRESS__, __ADDRESS_ENC__, __WHATSAPP__. They are replaced at publish time from the user's Site Contact settings.
- For address/location: ALWAYS use __ADDRESS__ for displayed text—never invent addresses like "123 Plumbing Street", "Anytown, USA", "Suite 100", etc.
- For embedded maps: Replace any "Interactive Map" placeholder div with the single tag __MAP_EMBED__. Do not construct an iframe yourself—just write __MAP_EMBED__ and the real Google Maps iframe will be injected automatically at runtime with the user's correct address.
- Use these exact input name attributes: first_name, last_name, email, message (required); phone, service, newsletter (optional).
- For newsletter: use type="checkbox" with name="newsletter" and value="on".
- For service: use a <select> or dropdown with name="service".
- Create the form UI and wire it in one step—do not add an unlinked form that needs "linking" later.`;

const COLOR_RULES = `
COLOR CHANGES (critical): When changing button, link, or element colors:
- Buttons and links use Tailwind classes like bg-blue-600, bg-blue-500. These do NOT use :root. You MUST include the actual <button> or <a> element in your BEFORE/AFTER and replace the class (e.g. bg-blue-600 → bg-[#001f3f]).
- Navy blue: use #001f3f (dark navy) or #000080 (standard navy). Do NOT use light blues like #3b82f6 or #2563eb.
- When user says "change the button" or "all buttons to X color": find EVERY <button> and <a> that looks like a button (has bg-blue, bg-green, etc.) and include each in your patch. Return a BEFORE/AFTER for each distinct button if they differ, or one patch that matches all.
- Copy the BEFORE block EXACTLY from the document (same whitespace, same attributes) so the replace succeeds.
- For global palette changes (theme, :root): update the :root block. For specific elements: update the HTML elements.`;

const IMAGE_RULES = `
- When the user mentions an image by name (e.g. "add the logo"), match it to the available images list and use the exact URL provided as the <img src> attribute.`;

const SECTION_PATTERNS = `
SECTION DESIGN PATTERNS (follow these when adding or improving sections):
- HERO: Full-width section (min-h-[60vh] or min-h-screen), large bold heading (text-4xl md:text-6xl font-bold), subtitle (text-lg text-gray-600), one primary CTA button (bg-[color] text-white px-8 py-4 rounded-xl), optional gradient background. Always has id="hero".
- SERVICES: Grid layout (grid grid-cols-1 md:grid-cols-3 gap-6), each card has an SVG icon in a colored circle (w-12 h-12), bold title, short description, rounded-xl shadow-sm p-6. Always has id="services".
- TESTIMONIALS: 3-column card grid (md:grid-cols-3), each card has: avatar circle with initials (w-10 h-10 rounded-full flex items-center justify-center font-bold), name + role, star rating (5 yellow stars), quote text in italic. Always has id="testimonials".
- STATS/HIGHLIGHTS: Horizontal flex row (flex flex-wrap justify-center gap-8 md:gap-16 py-10), each stat is a div with a large bold number (text-3xl font-bold text-[color]) and a small label below (text-sm text-gray-500). Keep all stats color-consistent.
- CONTACT: Two-column layout (md:grid-cols-2 gap-8): left = form (Send us a message), right = contact info cards (Call Us, Email Us) + Business Hours + map. Always has id="contact".
- FAQ: Accordion layout, each item has a question (font-semibold cursor-pointer) and collapsible answer. Use JS to toggle. Always has id="faq".
- FOOTER: bg-slate-900 text-white py-12, grid with logo+tagline, quick links, contact info columns, bottom copyright row.
- NAVBAR: sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm, flex items-center justify-between px-6 py-4, logo left, nav links center/right, CTA button far right.`;

const ANIMATION_RULES = `
ANIMATIONS (when user asks for animations or "more professional" look):
- Use CSS @keyframes inside <style> for: fadeInUp (translateY 20px → 0, opacity 0 → 1), slideInLeft, scaleIn.
- Apply with animation: fadeInUp 0.6s ease forwards on sections.
- Use Tailwind transition classes for hover effects: hover:scale-105 transition-transform duration-300, hover:shadow-lg transition-shadow.
- For cards: hover:-translate-y-1 transition-transform duration-200.
- Keep animations subtle — 0.3s–0.6s duration, ease or ease-out timing.`;

function buildSystemPrompt(options: { scope: string; prompt: string; hasImages: boolean }): string {
  const { scope, prompt, hasImages } = options;
  const lower = prompt.toLowerCase();
  const needsFormRules = /\b(form|contact|quote|send\s*message)\b/i.test(lower);
  const needsColorRules = scope === "color";
  const needsSectionPatterns = scope === "section" || scope === "full" || /\b(add|improve|redesign|make.*professional|animation|animate)\b/i.test(lower);
  const needsAnimationRules = /\b(animation|animate|transition|hover|professional|subtle|smooth)\b/i.test(lower);
  let promptText = CORE_PROMPT + DESIGN_PRINCIPLES;
  if (needsFormRules) promptText += FORM_RULES;
  if (needsColorRules) promptText += COLOR_RULES;
  if (needsSectionPatterns) promptText += SECTION_PATTERNS;
  if (needsAnimationRules) promptText += ANIMATION_RULES;
  if (hasImages) promptText += IMAGE_RULES;
  return promptText;
}

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
    const { prompt, html = "", css = "", js = "", images = [], stream: wantStream = false, history: rawHistory = [], sectionId: reqSectionId = null } = body;
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(rawHistory)
      ? rawHistory
          .filter((m: unknown) => m && typeof m === "object" && "role" in m && "content" in m)
          .map((m: { role: string; content: string }) => ({
            role: (m.role === "user" || m.role === "assistant" ? m.role : "user") as "user" | "assistant",
            content: String(m.content).slice(0, 2000),
          }))
      : [];

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
          error: `Limit reached. Try again in ${minutesLeft} minutes.`,
          code: "rate_limit",
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

    const { scope, sectionIds } = classifyRequest(prompt);
    let docForPrompt = currentDoc;
    // If sectionId explicitly provided, use it. Otherwise fall back to classifier.
    const effectiveSectionIds = reqSectionId ? [reqSectionId] : sectionIds;
    const effectiveScope = reqSectionId ? "section" : scope;
    // Only use section extraction for structural edits. For color changes, use full doc
    // so BEFORE/AFTER patches match contiguous content (extracted fragments are non-contiguous).
    const extracted = effectiveScope === "section"
      ? extractSections(currentDoc, effectiveSectionIds, "section")
      : null;

    if (extracted) {
      docForPrompt = extracted.context;
    }

    const sectionLabel = reqSectionId ?? (effectiveSectionIds.length > 0 ? effectiveSectionIds[0] : null);
    const fragmentInstruction = extracted
      ? `\n\nYou are editing ONLY the${sectionLabel ? ` "${sectionLabel}"` : ""} section shown above. Return BEFORE/AFTER for this section only. The rest of the document is unchanged.`
      : "";

    const userContent = `Here is the current HTML document${extracted ? " (relevant section only)" : ""}:\n\n${docForPrompt}${imageContext}${fragmentInstruction}\n\nUser request: ${prompt}`;

    // If sectionId was requested but extraction failed (no id on element), fall back to full-doc tokens
    const maxTokens = effectiveScope === "color"
      ? 1024
      : effectiveScope === "full"
        ? 4096
        : extracted
          ? 2048   // section found: small fragment, low tokens
          : 4096;  // section requested but not found: full doc needed

    const { client, model } = getAIClient();

    if (wantStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            const systemPrompt = buildSystemPrompt({ scope, prompt, hasImages: Array.isArray(images) && images.length > 0 });
            const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
              { role: "system", content: systemPrompt },
              ...history,
              { role: "user", content: userContent },
            ];
            const aiStream = await client.chat.completions.create({
              model,
              messages,
              max_tokens: maxTokens,
              temperature: 0.2,
              stream: true,
            });

            let content = "";
            for await (const chunk of aiStream) {
              const delta = chunk.choices[0]?.delta?.content ?? "";
              if (delta) content += delta;
            }

            let finalHtml: string | null = null;
            const parsed = parseDiffFromResponse(content);
            if (parsed && parsed.before.length > 0) {
              finalHtml = applyPatch(currentDoc, parsed.before, parsed.after);
            }
            if (!finalHtml && !extracted) {
              const extractedDoc = extractHtmlFromResponse(content);
              // Reject if extracted HTML is much smaller than current doc (fragment replaced full page)
              if (extractedDoc && extractedDoc.length >= currentDoc.length * 0.5) {
                finalHtml = extractedDoc;
              }
            }
            if (!finalHtml) finalHtml = applyCssPatch(currentDoc, content);
            if (!finalHtml) {
              const codeBlocks = [...content.matchAll(/```\w*\s*([\s\S]*?)```/g)];
              for (const m of codeBlocks) {
                const block = m[1].trim();
                if ((block.includes(":root") || /[.#\w\s-]+\s*\{/.test(block)) && block.length > 20) {
                  finalHtml = applyCssRulePatch(currentDoc, block);
                  if (finalHtml) break;
                }
              }
            }

            // Smart retry: if patch failed and this looks like a color request, try a simpler prompt
            if (!finalHtml) {
              const fallbackPrompt = buildFallbackPrompt(prompt);
              if (fallbackPrompt) {
                try {
                  const fallbackStream = await client.chat.completions.create({
                    model,
                    messages: [
                      { role: "system", content: buildSystemPrompt({ scope: "color", prompt: fallbackPrompt, hasImages: false }) },
                      { role: "user", content: `Here is the current HTML document:\n\n${currentDoc}\n\nUser request: ${fallbackPrompt}` },
                    ],
                    max_tokens: 1500,
                    temperature: 0.1,
                    stream: true,
                  });
                  let fallbackContent = "";
                  for await (const chunk of fallbackStream) {
                    fallbackContent += chunk.choices[0]?.delta?.content ?? "";
                  }
                  const fp = parseDiffFromResponse(fallbackContent);
                  if (fp && fp.before.length > 0) finalHtml = applyPatch(currentDoc, fp.before, fp.after);
                  if (!finalHtml) finalHtml = applyCssPatch(currentDoc, fallbackContent);
                } catch {
                  // fallback failed silently — report original error below
                }
              }
            }

            if (!finalHtml) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Couldn't apply the change. Try rephrasing or a smaller edit.", code: "parse_error" })}\n\n`));
              controller.close();
              return;
            }

            await supabase.from("ai_usage").upsert(
              { user_id: user.id, hour_bucket: hourBucket.toISOString(), edit_count: currentCount + 1 },
              { onConflict: "user_id,hour_bucket", ignoreDuplicates: false }
            );
            const { data: updatedUsage } = await supabase
              .from("ai_usage")
              .select("edit_count")
              .eq("user_id", user.id)
              .eq("hour_bucket", hourBucket.toISOString())
              .single();

            const payload = {
              html: finalHtml,
              css: "",
              js: "",
              editsRemaining: 25 - (updatedUsage?.edit_count ?? currentCount + 1),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch (err) {
            console.error("AI stream error:", err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI service unavailable. Please retry.", code: "ai_error" })}\n\n`));
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    const systemPrompt = buildSystemPrompt({ scope, prompt, hasImages: Array.isArray(images) && images.length > 0 });
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userContent },
    ];
    const result = await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    const content = result.choices[0]?.message?.content ?? "";
    let finalHtml: string | null = null;

    // Try diff format first
    const parsed = parseDiffFromResponse(content);
    if (parsed && parsed.before.length > 0) {
      finalHtml = applyPatch(currentDoc, parsed.before, parsed.after);
    }

    // Fallback: full document (only when NOT using extracted fragments)
    if (!finalHtml && !extracted) {
      const extractedDoc = extractHtmlFromResponse(content);
      // Reject if extracted HTML is much smaller than current doc (fragment replaced full page)
      if (extractedDoc && extractedDoc.length >= currentDoc.length * 0.5) {
        finalHtml = extractedDoc;
      }
    }

    // Fallback: CSS-only update (e.g. :root color variables)
    if (!finalHtml) {
      finalHtml = applyCssPatch(currentDoc, content);
    }

    // Fallback: single code block with CSS rules (e.g. malformed BEFORE/AFTER)
    if (!finalHtml) {
      const codeBlocks = [...content.matchAll(/```\w*\s*([\s\S]*?)```/g)];
      for (const m of codeBlocks) {
        const block = m[1].trim();
        if ((block.includes(":root") || /[.#\w\s-]+\s*\{/.test(block)) && block.length > 20) {
          finalHtml = applyCssRulePatch(currentDoc, block);
          if (finalHtml) break;
        }
      }
    }

    if (result.usage) {
      const hit = (result.usage as { prompt_cache_hit_tokens?: number }).prompt_cache_hit_tokens;
      const miss = (result.usage as { prompt_cache_miss_tokens?: number }).prompt_cache_miss_tokens;
      if (hit !== undefined || miss !== undefined) {
        console.info("[AI editor] Cache:", { prompt_cache_hit_tokens: hit, prompt_cache_miss_tokens: miss });
      }
    }

    // Smart retry: if patch failed, try a simpler directive prompt
    if (!finalHtml) {
      const fallbackPrompt = buildFallbackPrompt(prompt);
      if (fallbackPrompt) {
        try {
          const fallbackResult = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: buildSystemPrompt({ scope: "color", prompt: fallbackPrompt, hasImages: false }) },
              { role: "user", content: `Here is the current HTML document:\n\n${currentDoc}\n\nUser request: ${fallbackPrompt}` },
            ],
            max_tokens: 1500,
            temperature: 0.1,
          });
          const fallbackContent = fallbackResult.choices[0]?.message?.content ?? "";
          const fp = parseDiffFromResponse(fallbackContent);
          if (fp && fp.before.length > 0) finalHtml = applyPatch(currentDoc, fp.before, fp.after);
          if (!finalHtml) finalHtml = applyCssPatch(currentDoc, fallbackContent);
        } catch {
          // fallback failed silently
        }
      }
    }

    if (!finalHtml) {
      console.error("[AI editor] Unparseable response length:", content.length);
      console.error("[AI editor] Response preview:", content.slice(0, 500));
      return NextResponse.json(
        {
          error: "Couldn't apply the change. Try rephrasing or a smaller edit.",
          code: "parse_error",
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
        { error: "AI service not configured", code: "ai_error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "AI service unavailable. Please retry.", code: "ai_error" },
      { status: 502 }
    );
  }
}
