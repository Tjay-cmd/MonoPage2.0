"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Preview from "./Preview";
import ChatPanel, { ChatMessage } from "./ChatPanel";

interface Placeholders {
  businessName: string;
  phone: string;
  phoneRaw: string;
  email: string;
  address: string;
  addressEnc: string;
  whatsapp: string;
  mapEmbed: string;
}

interface WebsiteEditorProps {
  initialHtml: string;
  initialCss: string;
  initialJs: string;
  userSiteId: string;
  placeholders?: Placeholders;
  saveDraft?: (userSiteId: string, html: string, css: string, js: string) => Promise<{ error?: string } | { ok?: boolean }>;
  publish?: (
    userSiteId: string,
    content?: { html: string; css: string; js: string }
  ) => Promise<{ error?: string } | { ok?: boolean; slug?: string }>;
  getVersions?: (userSiteId: string) => Promise<{ versions: { id: string; created_at: string }[] }>;
  loadVersion?: (userSiteId: string, versionId: string) => Promise<{ error?: string } | { html: string; css: string; js: string }>;
  deleteDraft?: (userSiteId: string, path?: string) => Promise<{ error?: string } | { ok?: boolean }>;
}

// ── Section selector options ──────────────────────────────────────
const SECTION_OPTIONS = [
  { id: null,            label: "Whole page" },
  { id: "hero",         label: "Hero" },
  { id: "services",     label: "Services" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact",      label: "Contact" },
  { id: "footer",       label: "Footer" },
];

// ── Snapshot state type ───────────────────────────────────────────
interface Snapshot { html: string; css: string; js: string }

export default function WebsiteEditor({
  initialHtml,
  initialCss,
  initialJs,
  userSiteId,
  placeholders,
  saveDraft: saveDraftAction,
  publish: publishAction,
  getVersions,
  loadVersion: loadVersionAction,
  deleteDraft: deleteDraftAction,
}: WebsiteEditorProps) {
  const pathname = usePathname();

  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);

  // Edit history for undo (max 10 snapshots)
  const [editHistory, setEditHistory] = useState<Snapshot[]>([]);

  // Preview flash key — changes on every AI update to trigger fade-in animation
  const [previewKey, setPreviewKey] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editsRemaining, setEditsRemaining] = useState(25);
  const [disabled, setDisabled] = useState(false);
  const [longWaitMessage, setLongWaitMessage] = useState<string | null>(null);
  const [hasNewAiMessage, setHasNewAiMessage] = useState(false);

  // Section selector
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [versions, setVersions] = useState<{ id: string; created_at: string }[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const versionsRef = useRef<HTMLDivElement>(null);

  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const [userImages, setUserImages] = useState<{ name: string; url: string }[]>([]);
  const [mobileView, setMobileView] = useState<"preview" | "chat">("preview");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── Click-outside for versions ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (versionsRef.current && !versionsRef.current.contains(e.target as Node)) {
        setVersionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Init fetches ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/editor/ai")
      .then((r) => r.json())
      .then((data) => {
        if (data.editsRemaining !== undefined) {
          setEditsRemaining(data.editsRemaining);
          setDisabled(data.editsRemaining <= 0);
        }
      })
      .catch(() => {});

    fetch("/api/editor/images")
      .then((r) => r.json())
      .then((data) => { if (data.images) setUserImages(data.images); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (getVersions) {
      getVersions(userSiteId).then((r) => {
        if (r.versions) setVersions(r.versions);
      });
    }
  }, [userSiteId, getVersions]);

  // ── Helpers ──────────────────────────────────────────────────
  /** Save current state to undo history then apply new state. */
  const applyUpdate = useCallback((newHtml: string, newCss: string, newJs: string) => {
    setEditHistory(prev => [...prev.slice(-9), { html, css, js }]);
    setHtml(newHtml);
    setCss(newCss);
    setJs(newJs);
    setPreviewKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, css, js]);

  function handleUndo() {
    if (editHistory.length === 0) return;
    const prev = editHistory[editHistory.length - 1];
    setEditHistory(h => h.slice(0, -1));
    setHtml(prev.html);
    setCss(prev.css);
    setJs(prev.js);
    setPreviewKey(k => k + 1);
    // Remove last assistant message pair
    setMessages(msgs => {
      const lastAssistant = [...msgs].reverse().findIndex(m => m.role === "assistant");
      if (lastAssistant === -1) return msgs;
      const idx = msgs.length - 1 - lastAssistant;
      return msgs.filter((_, i) => i !== idx);
    });
  }

  // ── Actions ──────────────────────────────────────────────────
  async function handleLoadVersion(versionId: string) {
    if (!loadVersionAction) return;
    const result = await loadVersionAction(userSiteId, versionId);
    if ("error" in result || !("html" in result)) return;
    applyUpdate(result.html, result.css, result.js);
    setVersionsOpen(false);
  }

  async function handleSaveDraft() {
    if (!saveDraftAction) return;
    setSaveStatus("saving");
    await saveDraftAction(userSiteId, html, css, js);
    if (getVersions) {
      const r = await getVersions(userSiteId);
      if (r.versions) setVersions(r.versions);
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handlePublish() {
    if (!publishAction) return;
    setPublishStatus("loading");
    const result = await publishAction(userSiteId, { html, css, js });
    if ("error" in result && result.error) {
      setPublishStatus("error");
    } else if ("slug" in result && result.slug) {
      setPublishedSlug(result.slug);
      setPublishStatus("success");
    }
  }

  async function handleStartOver() {
    if (!deleteDraftAction) return;
    if (!confirm("Delete this draft and choose a new template? This cannot be undone.")) return;
    try {
      const result = await deleteDraftAction(userSiteId, pathname);
      if ("error" in result && result.error) alert(result.error);
      else window.location.href = pathname;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete draft");
    }
  }

  async function handleSend(prompt: string) {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    const history = messages.slice(-4).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant" && m.content.length > 500 ? m.content.slice(-500) : m.content,
    }));
    setLongWaitMessage(null);

    const longWaitTimer = setTimeout(() => {
      setLongWaitMessage("This is taking a while. Large edits can take 2–4 minutes…");
    }, 60000);

    const maxRetries = 2;
    const backoffMs = [2000, 4000];

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        try {
          const res = await fetch("/api/editor/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt, html, css, js,
              images: userImages,
              stream: true,
              history,
              sectionId: selectedSectionId,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          clearTimeout(longWaitTimer);

          if (!res.ok) {
            const data = await res.json();
            if (res.status === 429) {
              setEditsRemaining(0);
              setDisabled(true);
              setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Rate limit reached." }]);
              return;
            }
            if (res.status === 400) {
              setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Couldn't apply the change. Try rephrasing." }]);
              return;
            }
            setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Something went wrong." }]);
            return;
          }

          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("text/event-stream")) {
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No response body");
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const raw = line.slice(6);
                  if (raw === "[DONE]") continue;
                  try {
                    const data = JSON.parse(raw);
                    if (data.error) {
                      setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
                      return;
                    }
                    if (data.html !== undefined) {
                      applyUpdate(data.html, data.css ?? css, data.js ?? js);
                    }
                    setEditsRemaining(data.editsRemaining ?? editsRemaining - 1);
                    setMessages((prev) => [...prev, { role: "assistant", content: "Done! Check the preview." }]);
                    if (mobileView === "chat") setHasNewAiMessage(true);
                  } catch {
                    // ignore partial chunk parse errors
                  }
                }
              }
            }
            return;
          }

          const data = await res.json().catch(() => ({}));

          if (res.status === 429) {
            setEditsRemaining(0);
            setDisabled(true);
            const msg = data.retryAfter
              ? `Limit reached. Try again in ${data.retryAfter} minutes.`
              : (data.error ?? "Rate limit reached.");
            setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
            return;
          }
          if (res.status === 400) {
            setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Couldn't apply the change. Try rephrasing." }]);
            return;
          }
          if (!res.ok) {
            if (attempt < maxRetries && (res.status === 502 || res.status === 503)) {
              await new Promise((r) => setTimeout(r, backoffMs[attempt]));
              continue;
            }
            setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Something went wrong." }]);
            return;
          }

          if (data.html !== undefined) {
            applyUpdate(data.html, data.css ?? css, data.js ?? js);
          }
          setEditsRemaining(data.editsRemaining ?? editsRemaining - 1);
          setMessages((prev) => [...prev, { role: "assistant", content: "Done! Check the preview." }]);
          if (mobileView === "chat") setHasNewAiMessage(true);
          return;
        } catch (e) {
          clearTimeout(timeoutId);
          const isAbort = e instanceof Error && e.name === "AbortError";
          const isRetryable = isAbort || e instanceof TypeError;
          if (attempt < maxRetries && isRetryable) {
            await new Promise((r) => setTimeout(r, backoffMs[attempt]));
            continue;
          }
          clearTimeout(longWaitTimer);
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: isAbort ? "Timed out. Try a smaller change or retry." : "Network error. Please try again.",
          }]);
          return;
        }
      }
    } finally {
      setLoading(false);
      setLongWaitMessage(null);
    }
  }

  // ── Shared buttons ────────────────────────────────────────────
  const btnBaseDesktop = "md:min-w-[160px] md:h-11 md:px-5 md:text-sm md:rounded-xl";
  const saveDraftBtn = saveDraftAction ? (
    <button
      onClick={handleSaveDraft}
      disabled={saveStatus === "saving"}
      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 ${btnBaseDesktop} ${
        saveStatus === "saved"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
      }`}
    >
      {saveStatus === "saving" ? (<><SpinIcon />Saving…</>) : saveStatus === "saved" ? (<><CheckIcon />Saved!</>) : (<><SaveIcon />Save draft</>)}
    </button>
  ) : null;

  const publishBtn = publishAction ? (
    <button
      onClick={handlePublish}
      disabled={publishStatus === "loading"}
      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 ${btnBaseDesktop}`}
    >
      {publishStatus === "loading" ? (<><SpinIcon />Publishing…</>) : (<><PublishIcon />{publishStatus === "success" ? "Published!" : "Publish"}</>)}
    </button>
  ) : null;

  const viewSiteLink = publishStatus === "success" && publishedSlug ? (
    <a
      href={`/s/${publishedSlug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors ${btnBaseDesktop}`}
    >
      View site
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  ) : null;

  // ── Overflow menu ─────────────────────────────────────────────
  const overflowMenuNode = (
    <div className="relative" ref={versionsRef}>
      <button
        onClick={() => setVersionsOpen(!versionsOpen)}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="More options"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {versionsOpen && (
        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 min-w-[210px]">
          {/* Undo */}
          <button
            onClick={() => { handleUndo(); setVersionsOpen(false); }}
            disabled={editHistory.length === 0}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 disabled:opacity-40"
          >
            <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo last edit {editHistory.length > 0 ? `(${editHistory.length})` : ""}
          </button>

          {/* Version history */}
          {versions.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <p className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">History</p>
              <div className="max-h-44 overflow-y-auto">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { handleLoadVersion(v.id); setVersionsOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    suppressHydrationWarning
                  >
                    <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(v.created_at).toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          )}

          {deleteDraftAction && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { setVersionsOpen(false); handleStartOver(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Start over
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // ── Section selector bar ──────────────────────────────────────
  const sectionSelectorBar = (
    <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-xs text-gray-400 shrink-0 font-medium">Focus:</span>
      {SECTION_OPTIONS.map(opt => (
        <button
          key={opt.id ?? "all"}
          onClick={() => setSelectedSectionId(opt.id)}
          className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
            selectedSectionId === opt.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // ── Preview with fade-in animation ──────────────────────────
  const animatedPreview = (
    <div key={previewKey} className="w-full h-full" style={{ animation: previewKey > 0 ? "editorFadeIn 0.35s ease" : undefined }}>
      <Preview html={html} css={css} js={js} userSiteId={userSiteId} placeholders={placeholders} />
      <style>{`@keyframes editorFadeIn { from { opacity: 0.3; transform: scale(0.995); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );

  // ── Loading skeleton ────────────────────────────────────────
  const loadingSkeleton = loading ? (
    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col gap-4 p-6 pointer-events-none">
      <div className="h-8 w-1/3 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-40 w-full bg-gray-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
      <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
      <div className="mt-auto flex items-center justify-center gap-2 text-sm text-gray-400">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        AI is editing your website…
      </div>
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── MOBILE LAYOUT ────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col overflow-hidden overflow-x-hidden w-full max-w-full min-w-0" style={{ height: "calc(100vh - 2.75rem)" }}>

        {/* ── Pane area ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">

          {/* Preview pane */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              mobileView === "preview" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute top-3 right-3 z-10">{overflowMenuNode}</div>
            {loadingSkeleton}
            {animatedPreview}
          </div>

          {/* Chat pane */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              mobileView === "chat" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              disabled={disabled}
              editsRemaining={editsRemaining}
              loading={loading}
              loadingMessage={longWaitMessage ?? undefined}
              headerExtra={overflowMenuNode}
              className="h-full rounded-none border-0 border-t border-gray-100"
            />
          </div>
        </div>

        {/* ── Section selector ──────────────────────────────────── */}
        <div className="shrink-0 px-4 py-2 bg-white border-t border-gray-100">
          {sectionSelectorBar}
        </div>

        {/* ── Action bar ────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white border-t border-gray-100 shrink-0 min-w-0">
          <div className="flex gap-2 flex-1">
            {saveDraftBtn}
            {publishBtn}
            {viewSiteLink}
          </div>
          {publishStatus === "error" && (
            <span className="text-xs text-red-500 font-medium shrink-0">Failed</span>
          )}
        </div>

        {/* ── Tab bar ───────────────────────────────────────────── */}
        <div className="flex shrink-0 min-w-0 bg-white border-t border-gray-200 px-4 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => setMobileView("preview")}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileView === "preview" ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={mobileView === "preview" ? 2.5 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>

          <button
            onClick={() => { setMobileView("chat"); setHasNewAiMessage(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-semibold transition-colors relative ${
              mobileView === "chat" ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            {(hasNewAiMessage || (loading && mobileView === "preview")) && (
              <span className="absolute top-2 right-[calc(50%-18px)] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
            )}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={mobileView === "chat" ? 2.5 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            AI Chat
          </button>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ───────────────────────────────────────── */}
      <div className="hidden md:flex h-[calc(100vh-2rem)] gap-4 lg:gap-6 p-4 lg:p-6 xl:p-8">

        {/* Preview pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Preview</h2>
              {/* Section focus badge */}
              {selectedSectionId && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  Editing: {SECTION_OPTIONS.find(o => o.id === selectedSectionId)?.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Undo button */}
              <button
                onClick={handleUndo}
                disabled={editHistory.length === 0}
                title="Undo last AI edit"
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg font-medium transition-colors ${btnBaseDesktop} ${
                  editHistory.length === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo {editHistory.length > 0 ? `(${editHistory.length})` : ""}
              </button>

              {/* Desktop versions dropdown */}
              {versions.length > 0 && (
                <div className="relative" ref={versionsRef}>
                  <button
                    onClick={() => setVersionsOpen(!versionsOpen)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors ${btnBaseDesktop}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Versions
                  </button>
                  {versionsOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 py-2 max-h-64 overflow-y-auto">
                      {versions.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleLoadVersion(v.id)}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          suppressHydrationWarning
                        >
                          {new Date(v.created_at).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {saveDraftBtn}
              {publishBtn}
              {viewSiteLink}
              {deleteDraftAction && (
                <button
                  onClick={handleStartOver}
                  className={`flex items-center justify-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors ${btnBaseDesktop}`}
                >
                  Start over
                </button>
              )}
            </div>
          </div>

          {/* Section selector on desktop */}
          <div className="mb-3">
            {sectionSelectorBar}
          </div>

          <div className="flex-1 min-h-0 relative">
            {loadingSkeleton}
            {animatedPreview}
          </div>
        </div>

        {/* Chat pane */}
        <div className="w-80 xl:w-[400px] shrink-0">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            disabled={disabled}
            editsRemaining={editsRemaining}
            loading={loading}
            loadingMessage={longWaitMessage ?? undefined}
          />
        </div>
      </div>
    </>
  );
}

// ── Icon helpers ─────────────────────────────────────────────────
function SpinIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
function PublishIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
