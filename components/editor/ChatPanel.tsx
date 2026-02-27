"use client";

import { useState, useEffect, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (prompt: string) => Promise<void>;
  disabled?: boolean;
  editsRemaining?: number;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
  headerExtra?: React.ReactNode;
}

// ── Constants ────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Change the colour scheme",
  "Add a WhatsApp button",
  "Make the hero section bigger",
  "Add more services",
  "Make it look more professional",
  "Add a testimonials section",
];

const QUICK_ACTIONS: { label: string; prompt: string; category: "color" | "layout" | "section" | "polish" }[] = [
  // Colors
  { label: "Navy theme", category: "color", prompt: "Apply a dark navy blue theme to the entire site. Update all buttons, links, headings, and accents to #001f3f. Keep backgrounds white or very light." },
  { label: "Teal theme", category: "color", prompt: "Apply a professional teal color theme to the entire site. Update all buttons, links, headings, and accents to #0d9488. Keep backgrounds white or very light." },
  { label: "Warm earth", category: "color", prompt: "Apply a warm earth tone theme to the entire site. Use #92400e for primary accents, #fef3c7 for light backgrounds. Update all buttons, links, and headings." },
  // Layout
  { label: "Bigger hero", category: "layout", prompt: "Make the hero section taller and more impactful. Increase heading size to text-5xl md:text-7xl, add more vertical padding (py-32 md:py-48), and make the CTA button larger (px-10 py-5 text-lg)." },
  { label: "Mobile layout", category: "layout", prompt: "Improve the mobile layout for all sections. Ensure cards stack vertically on mobile, text is readable, buttons are full-width on mobile, and navigation collapses properly." },
  // Sections
  { label: "Add FAQ", category: "section", prompt: `Add a professional FAQ section with 5 relevant questions and answers about our services. Place it before the contact section. Requirements:
- id="faq", max-w-3xl mx-auto px-6 py-20
- Heading: "Frequently Asked Questions" (text-3xl font-bold text-center mb-12)
- 5 accordion items with question and collapsible answer, separated by border-b border-gray-200
- Chevron icon (SVG) that rotates 180deg when open (transition-transform)
- JavaScript to toggle open/close state for each item` },
  { label: "Add testimonials", category: "section", prompt: "Add a testimonials section with 3 customer reviews in card format. Each card: avatar circle with initials (w-12 h-12 rounded-full font-bold text-lg), customer name, role, 5 gold star icons, and a quote. Use md:grid-cols-3 layout. Keep id=\"testimonials\"." },
  { label: "Stats bar", category: "section", prompt: "Add a stats bar section between the hero and the next section with 4 key numbers: 24/7 (Emergency Service), 45 min (Average Response), 100% (Satisfaction Rate), 500+ (Jobs Completed). Use large bold numbers in the brand color, small labels below. id=\"stats\"." },
  { label: "CTA banner", category: "section", prompt: "Add a bold CTA banner section before the footer. Dark indigo gradient background, large white heading 'Ready to Get Started?', subtitle, and two buttons (white primary + outline secondary). Include __PHONE__ placeholder. id=\"cta-banner\"." },
  // Polish
  { label: "Add animations", category: "polish", prompt: "Add subtle fade-in and slide-up animations to all sections using CSS @keyframes (fadeInUp: translateY 20px → 0, opacity 0 → 1, 0.6s ease). Cards should lift slightly on hover (hover:-translate-y-1 transition-transform duration-200). Keep animations under 0.6s." },
  { label: "More professional", category: "polish", prompt: "Make the website look more professional and modern. Improve typography hierarchy, add more whitespace between sections (py-20 md:py-28), refine the color palette, ensure consistent rounded corners on all cards (rounded-2xl), and add subtle hover shadow effects throughout." },
];

const COLOR_PRESETS = [
  { name: "Navy", primary: "#001f3f", accent: "#e8edf5", swatch: "#001f3f" },
  { name: "Teal", primary: "#0d9488", accent: "#ccfbf1", swatch: "#0d9488" },
  { name: "Forest", primary: "#166534", accent: "#dcfce7", swatch: "#166534" },
  { name: "Earth", primary: "#92400e", accent: "#fef3c7", swatch: "#92400e" },
  { name: "Slate", primary: "#1e293b", accent: "#f1f5f9", swatch: "#1e293b" },
  { name: "Purple", primary: "#6d28d9", accent: "#ede9fe", swatch: "#6d28d9" },
];

const CATEGORY_LABELS: Record<string, string> = {
  color: "Colors",
  layout: "Layout",
  section: "Sections",
  polish: "Polish",
};

const TIPS = [
  "Try: Add subtle hover animations to cards",
  "Try: Make the hero section taller and bolder",
  "Tip: Use consistent button colors throughout",
  "Try: Add a FAQ section before contact",
  "Tip: A navy or teal theme looks very professional",
  "Try: Add a testimonials section with star ratings",
  "Tip: Ensure all sections have consistent padding",
  "Try: Add a WhatsApp floating button",
];

// ── Component ────────────────────────────────────────────────────
export default function ChatPanel({
  messages,
  onSend,
  disabled = false,
  editsRemaining = 10,
  loading = false,
  loadingMessage,
  className = "",
  headerExtra,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"color" | "layout" | "section" | "polish">("color");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    setInput(el.value);
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleSuggestion(text: string) {
    if (disabled || loading) return;
    setQuickOpen(false);
    await onSend(text);
  }

  async function handleColorPreset(preset: typeof COLOR_PRESETS[0]) {
    if (disabled || loading) return;
    setQuickOpen(false);
    const prompt = `Apply a color palette to the entire site: primary color ${preset.primary}, light accent ${preset.accent}. Update ALL buttons (replace their bg-* class with bg-[${preset.primary}]), ALL headings and accent text, ALL links. Also update :root CSS variables if present. Keep backgrounds white or near-white.`;
    await onSend(prompt);
  }

  const editsColor =
    editsRemaining > 10 ? "text-gray-400" :
    editsRemaining > 5  ? "text-amber-500" :
                          "text-red-500";

  const canSend = !!input.trim() && !disabled && !loading;
  const isEmpty = messages.length === 0 && !loading;
  const filteredActions = QUICK_ACTIONS.filter(a => a.category === activeCategory);

  // Count assistant messages to rotate tips
  const assistantCount = messages.filter(m => m.role === "assistant" && m.content.startsWith("Done")).length;

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${className}`}
      style={{ height: className ? undefined : "100%" }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-1.5 md:px-3 md:py-2.5 border-b border-gray-100 shrink-0 bg-white">
        <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <svg className="h-3 w-3 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-semibold text-gray-900 leading-tight">AI Assistant</p>
          <p className={`text-[11px] md:text-xs leading-tight ${editsColor}`}>
            {editsRemaining} edits left
          </p>
        </div>

        {headerExtra && <div className="shrink-0">{headerExtra}</div>}
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-2 pb-1 md:px-3 md:pt-3 md:pb-2 space-y-2 md:space-y-3">

        {/* Empty state with suggestions */}
        {isEmpty && (
          <div className="flex flex-col gap-2 md:gap-3">
            <p className="text-xs md:text-sm font-medium text-gray-700 leading-tight px-0.5">
              What would you like to change? Tap below or type.
            </p>
            <div className="grid grid-cols-2 gap-1.5 md:gap-2 min-w-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  disabled={disabled || loading}
                  className="text-left text-[11px] md:text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl px-2.5 py-1.5 md:px-3 md:py-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 active:scale-95 transition-all disabled:opacity-40 leading-snug min-w-0 break-words"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((m, i) => {
          const isDoneMsg = m.role === "assistant" && m.content.startsWith("Done");
          // Which "Done" message number is this (for tip rotation)
          const doneIndex = isDoneMsg
            ? messages.slice(0, i + 1).filter(x => x.role === "assistant" && x.content.startsWith("Done")).length - 1
            : -1;

          return (
            <div key={i}>
              <div className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="h-6 w-6 md:h-7 md:w-7 rounded-full md:rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[78%] text-xs md:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-md px-3 py-2 md:px-4 md:py-2.5"
                      : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-3 py-2 md:px-4 md:py-2.5"
                  }`}
                >
                  {m.content}
                </div>
              </div>

              {/* Inline tip after "Done" messages */}
              {isDoneMsg && (
                <div className="flex items-start gap-1.5 mt-1 ml-8 md:ml-9">
                  <svg className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a7 7 0 015.292 11.604l-.292.329V17a1 1 0 01-.883.993L16 18h-8a1 1 0 01-1-1v-3.067l-.292-.33A7 7 0 0112 2zm2 17a1 1 0 01-2 0h2z" />
                  </svg>
                  <p className="text-[10px] md:text-[11px] text-gray-400 leading-snug">
                    {TIPS[doneIndex % TIPS.length]}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-1.5 md:gap-2 justify-start">
            <div className="h-6 w-6 md:h-7 md:w-7 rounded-full md:rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2 md:px-4 md:py-3">
              {loadingMessage ? (
                <p className="text-xs md:text-sm text-gray-500">{loadingMessage}</p>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "160ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "320ms" }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Actions Panel ───────────────────────────── */}
      {quickOpen && (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-3 py-2.5 space-y-2">
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["color", "layout", "section", "polish"] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Color presets row (only in color tab) */}
          {activeCategory === "color" && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleColorPreset(preset)}
                  disabled={disabled || loading}
                  title={preset.name}
                  className="shrink-0 flex flex-col items-center gap-1 disabled:opacity-40"
                >
                  <span
                    className="w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-gray-200 hover:ring-indigo-400 transition-all"
                    style={{ backgroundColor: preset.swatch }}
                  />
                  <span className="text-[9px] text-gray-500 font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action chips */}
          <div className="flex flex-wrap gap-1.5">
            {filteredActions.map(action => (
              <button
                key={action.label}
                onClick={() => handleSuggestion(action.prompt)}
                disabled={disabled || loading}
                className="text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:scale-95 transition-all disabled:opacity-40"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-2 md:px-3 md:py-2.5">
        {disabled && (
          <div className="mb-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded-lg md:rounded-xl">
            <p className="text-[11px] md:text-xs text-red-600 font-medium text-center">
              Edit limit reached. Try again soon.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-1.5 md:gap-2 w-full">
            {/* Quick actions toggle */}
            <button
              type="button"
              onClick={() => setQuickOpen(o => !o)}
              disabled={disabled || loading}
              title="Quick actions"
              className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                quickOpen
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 flex items-end bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl pl-3 pr-1 py-1 md:pl-3.5 md:pr-1.5 md:py-1.5 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Edit limit reached…" : "Ask AI to change anything…"}
                disabled={disabled || loading}
                className="flex-1 min-w-0 bg-transparent text-xs md:text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none disabled:opacity-50 leading-relaxed py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ height: "20px", maxHeight: "100px" }}
              />
            </div>

            <button
              type="submit"
              disabled={!canSend}
              className={`shrink-0 h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-lg md:rounded-xl transition-all ${
                canSend
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-90 shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-label="Send"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>

          <p className="hidden md:block text-xs text-gray-400 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
