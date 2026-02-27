/**
 * Classify user edit requests to determine scope and relevant sections.
 * Used for section-based payload optimization (send only relevant fragments).
 */

export type EditScope = "color" | "section" | "full";

const COLOR_KEYWORDS = /\b(color|colour|palette|navy|blue|green|red|orange|purple|teal|scheme|theme|hex|#[0-9a-fA-F]{3,6})\b/i;
const SECTION_KEYWORDS: { pattern: RegExp; id: string }[] = [
  { pattern: /\b(testimonial|review|client\s*say|rating)\b/i, id: "testimonials" },
  { pattern: /\b(hero|banner|header\s*section)\b/i, id: "hero" },
  { pattern: /\b(about|about\s*us)\b/i, id: "about" },
  { pattern: /\b(service|services)\b/i, id: "services" },
  { pattern: /\b(contact|get\s*quote|quote\s*form)\b/i, id: "contact" },
  { pattern: /\b(footer)\b/i, id: "footer" },
  { pattern: /\b(navbar|nav\s*bar|navigation)\b/i, id: "navbar" },
];

const FULL_SCOPE_KEYWORDS = /\b(restructure|redesign|add\s*section|remove\s*section|full\s*page|entire\s*page)\b/i;

export function classifyRequest(prompt: string): { scope: EditScope; sectionIds: string[] } {
  const lower = prompt.toLowerCase().trim();

  if (FULL_SCOPE_KEYWORDS.test(lower)) {
    return { scope: "full", sectionIds: [] };
  }

  const sectionIds: string[] = [];
  for (const { pattern, id } of SECTION_KEYWORDS) {
    if (pattern.test(lower) && !sectionIds.includes(id)) {
      sectionIds.push(id);
    }
  }

  const isColorRequest = COLOR_KEYWORDS.test(lower);

  if (isColorRequest) {
    if (sectionIds.length > 0) {
      return { scope: "color", sectionIds };
    }
    return { scope: "color", sectionIds: [] };
  }

  if (sectionIds.length > 0) {
    return { scope: "section", sectionIds };
  }

  return { scope: "full", sectionIds: [] };
}
