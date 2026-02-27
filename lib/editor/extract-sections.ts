/**
 * Extract relevant document fragments for section-based AI edits.
 * Reduces payload size by sending only :root and targeted sections.
 */

/**
 * Map section IDs to their semantic HTML tag equivalents so we can
 * match bare <footer>, <header>, <nav> etc. even when they have no id attribute.
 */
const SEMANTIC_TAG_MAP: Record<string, string[]> = {
  footer:       ["footer"],
  header:       ["header"],
  navbar:       ["nav", "header"],
  nav:          ["nav"],
  hero:         ["header"],
};

export function extractSections(
  doc: string,
  sectionIds: string[],
  scope: "color" | "section"
): { context: string; fullDoc: string } | null {
  const parts: string[] = [];

  // Always include :root for color changes and section edits (section may use CSS vars)
  const rootMatch = doc.match(/:root\s*\{[\s\S]*?\}/);
  if (rootMatch) {
    parts.push("/* :root variables */\n" + rootMatch[0]);
  }

  const tagNames = ["section", "div", "header", "footer", "nav"];
  for (const id of sectionIds) {
    let found = false;

    // 1. Try matching by explicit id attribute first
    for (const tag of tagNames) {
      const regex = new RegExp(
        `<${tag}[^>]*\\s+id=["']${id}["'][^>]*>[\\s\\S]*?</${tag}>`,
        "i"
      );
      const match = doc.match(regex);
      if (match) {
        parts.push(`\n/* Section: ${id} */\n${match[0]}`);
        found = true;
        break;
      }
    }

    // 2. Fall back to bare semantic tag (e.g. <footer> without id="footer")
    if (!found) {
      const semanticTags = SEMANTIC_TAG_MAP[id.toLowerCase()] ?? [];
      for (const tag of semanticTags) {
        // Match the outermost tag (non-greedy won't work for deeply nested; use a generous capture)
        const regex = new RegExp(`(<${tag}(?:\\s[^>]*)?>)[\\s\\S]*?<\\/${tag}>`, "i");
        const match = doc.match(regex);
        if (match) {
          parts.push(`\n/* Section: ${id} (matched <${tag}>) */\n${match[0]}`);
          found = true;
          break;
        }
      }
    }
  }

  // For color-only with no sections, :root alone is enough
  if (scope === "color" && rootMatch && sectionIds.length === 0) {
    return { context: parts.join("\n\n"), fullDoc: doc };
  }

  // For color with sections or section scope: need at least one section match
  if (sectionIds.length > 0 && parts.length <= 1) {
    return null;
  }

  if (parts.length === 0) {
    return null;
  }

  return { context: parts.join("\n\n"), fullDoc: doc };
}
