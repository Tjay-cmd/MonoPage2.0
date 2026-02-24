"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Preview from "./Preview";
import ChatPanel, { ChatMessage } from "./ChatPanel";

interface WebsiteEditorProps {
  initialHtml: string;
  initialCss: string;
  initialJs: string;
  userSiteId: string;
  saveDraft?: (userSiteId: string, html: string, css: string, js: string) => Promise<{ error?: string } | { ok?: boolean }>;
  publish?: (
    userSiteId: string,
    content?: { html: string; css: string; js: string }
  ) => Promise<{ error?: string } | { ok?: boolean; slug?: string }>;
  getVersions?: (userSiteId: string) => Promise<{ versions: { id: string; created_at: string }[] }>;
  loadVersion?: (userSiteId: string, versionId: string) => Promise<{ error?: string } | { html: string; css: string; js: string }>;
  deleteDraft?: (userSiteId: string, path?: string) => Promise<{ error?: string } | { ok?: boolean }>;
}

export default function WebsiteEditor({
  initialHtml,
  initialCss,
  initialJs,
  userSiteId,
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editsRemaining, setEditsRemaining] = useState(25);
  const [disabled, setDisabled] = useState(false);
  const [versions, setVersions] = useState<{ id: string; created_at: string }[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<{ name: string; url: string }[]>([]);
  const [longWaitMessage, setLongWaitMessage] = useState<string | null>(null);
  const versionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (versionsRef.current && !versionsRef.current.contains(e.target as Node)) {
        setVersionsOpen(false);
      }
    }
    if (versionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [versionsOpen]);

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

    // Load user's uploaded images
    fetch("/api/editor/images")
      .then((r) => r.json())
      .then((data) => {
        if (data.images) setUserImages(data.images);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (getVersions) {
      getVersions(userSiteId).then((r) => {
        if (r.versions) setVersions(r.versions);
      });
    }
  }, [userSiteId, getVersions]);

  async function handleLoadVersion(versionId: string) {
    if (!loadVersionAction) return;
    const result = await loadVersionAction(userSiteId, versionId);
    if ("error" in result || !("html" in result)) return;
    setHtml(result.html);
    setCss(result.css);
    setJs(result.js);
    setVersionsOpen(false);
  }

  async function handleSend(prompt: string) {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);
    setLongWaitMessage(null);

    const longWaitTimer = setTimeout(() => {
      setLongWaitMessage(
        "This edit is taking longer than usual. Large edits can take 2–4 minutes.",
      );
    }, 60000);

    const timeoutMs = 5 * 60 * 1000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch("/api/editor/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, html, css, js, images: userImages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(longWaitTimer);

      const data = await res.json();

      if (res.status === 429) {
        setEditsRemaining(0);
        setDisabled(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Rate limit reached. Try again later.",
          },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Something went wrong.",
          },
        ]);
        return;
      }

      const { html: newHtml, css: newCss, js: newJs } = data;
      if (newHtml !== undefined) setHtml(newHtml);
      if (newCss !== undefined) setCss(newCss);
      if (newJs !== undefined) setJs(newJs);

      setEditsRemaining(data.editsRemaining ?? editsRemaining - 1);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I've updated your website. Check the preview." },
      ]);
    } catch (e) {
      clearTimeout(timeoutId);
      clearTimeout(longWaitTimer);
      const isAbort = e instanceof Error && e.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isAbort
            ? "Edit timed out. Try a shorter request or break it into smaller changes."
            : "Network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setLongWaitMessage(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 p-8">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <div className="flex items-center gap-2">
            {versions.length > 0 && (
              <div className="relative" ref={versionsRef}>
                <button
                  onClick={() => setVersionsOpen(!versionsOpen)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Version history
                </button>
                {versionsOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border rounded-md shadow-lg z-10 py-1 max-h-64 overflow-y-auto">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleLoadVersion(v.id)}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        suppressHydrationWarning
                      >
                        {new Date(v.created_at).toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {saveDraftAction && (
              <button
                onClick={async () => {
                  await saveDraftAction(userSiteId, html, css, js);
                  if (getVersions) {
                    const r = await getVersions(userSiteId);
                    if (r.versions) setVersions(r.versions);
                  }
                }}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save draft
              </button>
            )}
            {publishAction && (
              <button
                onClick={async () => {
                  setPublishStatus("loading");
                  const result = await publishAction(userSiteId, {
                    html,
                    css,
                    js,
                  });
                  if ("error" in result && result.error) {
                    setPublishStatus("error");
                  } else if ("slug" in result && result.slug) {
                    setPublishedSlug(result.slug);
                    setPublishStatus("success");
                  }
                }}
                disabled={publishStatus === "loading"}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {publishStatus === "loading" ? "Publishing…" : "Publish"}
              </button>
            )}
            {publishStatus === "success" && publishedSlug && (
              <a
                href={`/s/${publishedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-green-700 hover:underline"
              >
                View site →
              </a>
            )}
            {deleteDraftAction && (
              <button
                onClick={async () => {
                  if (!confirm("Delete this draft and choose a new template? This cannot be undone.")) return;
                  try {
                    const result = await deleteDraftAction(userSiteId, pathname);
                    if ("error" in result && result.error) {
                      alert(result.error);
                    } else {
                      window.location.href = pathname;
                    }
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Failed to delete draft");
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Start over
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Preview html={html} css={css} js={js} userSiteId={userSiteId} />
        </div>
      </div>
      <div className="w-[400px] shrink-0">
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
  );
}
