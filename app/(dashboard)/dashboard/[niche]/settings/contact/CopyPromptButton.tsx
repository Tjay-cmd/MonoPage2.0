"use client";

import { useState } from "react";

export function CopyPromptButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
