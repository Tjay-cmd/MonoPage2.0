"use client";

import { useState } from "react";

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
}

export default function ChatPanel({
  messages,
  onSend,
  disabled = false,
  editsRemaining = 10,
  loading = false,
  loadingMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || loading) return;
    setInput("");
    await onSend(trimmed);
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        <p className="text-xs text-gray-500 mt-1">
          {editsRemaining} edits remaining this hour
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-gray-500">
            Ask for changes like &quot;Make the heading blue&quot; or &quot;Add a
            contact form&quot;.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
              {loadingMessage ?? "Thinking…"}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the change..."
            disabled={disabled || loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
