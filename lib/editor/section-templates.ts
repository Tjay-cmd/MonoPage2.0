/**
 * Pre-built professional section HTML snippets.
 * Each uses Tailwind classes and standard runtime placeholders.
 * These are injected via the AI "Insert section" quick action prompt.
 */

export interface SectionTemplate {
  id: string;
  label: string;
  description: string;
  prompt: string; // AI prompt to insert this section
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "hero-alt",
    label: "Hero (Bold)",
    description: "Full-width hero with gradient background and large CTA",
    prompt: `Replace the existing hero section with a bold, modern hero. It should have:
- A full-width gradient background from indigo-900 to purple-800
- A large white heading (text-5xl md:text-7xl font-bold text-white) with a highlighted span using a yellow or amber accent
- A white subtitle (text-xl text-indigo-200 max-w-2xl)
- Two CTA buttons side by side: a primary white button (bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold text-lg) and a secondary outline button (border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl font-bold text-lg)
- Minimum height min-h-[70vh] with flex items-center
- Keep the id="hero" attribute`,
  },
  {
    id: "faq",
    label: "FAQ Section",
    description: "Accordion FAQ with 5 relevant questions",
    prompt: `Add a professional FAQ section before the contact section. Requirements:
- id="faq", max-w-3xl mx-auto px-6 py-20
- Section heading: "Frequently Asked Questions" (text-3xl font-bold text-center mb-12)
- 5 accordion items, each with a question (font-semibold text-gray-900 cursor-pointer) and a collapsible answer (text-gray-600 leading-relaxed)
- Use a chevron SVG icon that rotates when open (transition-transform rotate-180)
- Add JavaScript to toggle open/close state for each item
- Use border-b border-gray-200 to separate items, py-5 padding
- Make questions relevant to the business type shown on the page`,
  },
  {
    id: "stats",
    label: "Stats Bar",
    description: "Horizontal stats with large numbers",
    prompt: `Add a stats/highlights bar section between the hero and the next section. Requirements:
- id="stats", bg-gray-50 border-y border-gray-100 py-12
- Horizontal flex row: flex flex-wrap justify-center gap-8 md:gap-16 max-w-5xl mx-auto px-6
- 4 stats: "24/7" (Emergency Service), "45 min" (Average Response), "100%" (Satisfaction Rate), "500+" (Jobs Completed)
- Each stat: text-3xl md:text-4xl font-bold text-indigo-900, small label below in text-sm text-gray-500
- All numbers should use the same color as the main brand color`,
  },
  {
    id: "why-us",
    label: "Why Choose Us",
    description: "3-column feature grid with icons",
    prompt: `Add a "Why Choose Us" section after the hero section. Requirements:
- id="why-us", py-20 px-6, max-w-6xl mx-auto
- Section heading: "Why Choose Us" (text-3xl font-bold text-center mb-4) with a subtitle below
- 3 columns (md:grid-cols-3 gap-8): Licensed & Insured, 24/7 Emergency, Satisfaction Guaranteed
- Each card: bg-white rounded-2xl shadow-sm border border-gray-100 p-8, icon in a colored circle at top, bold title, short description
- Use relevant SVG icons (shield, clock, star) in indigo-colored circles (bg-indigo-100 text-indigo-600)`,
  },
  {
    id: "cta-banner",
    label: "CTA Banner",
    description: "Bold call-to-action banner with button",
    prompt: `Add a CTA banner section before the footer. Requirements:
- id="cta-banner", bg-gradient-to-r from-indigo-600 to-indigo-800 py-16 px-6
- Centered content: max-w-3xl mx-auto text-center text-white
- Large bold heading (text-3xl md:text-4xl font-bold mb-4): "Ready to Get Started?"
- Subtitle (text-indigo-200 text-lg mb-8): "Contact us today for a free quote"
- Two buttons: white primary (bg-white text-indigo-900 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50) and outline secondary
- Include phone number placeholder: __PHONE__`,
  },
];

export function getSectionTemplateById(id: string): SectionTemplate | undefined {
  return SECTION_TEMPLATES.find(t => t.id === id);
}
