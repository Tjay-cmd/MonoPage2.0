"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Template {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
}

export default function TemplatePicker({
  templates,
  onSelect,
}: {
  templates: Template[];
  onSelect: (templateId: string) => Promise<{ error?: string } | { ok?: boolean }>;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSelect(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const result = await onSelect(id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create draft");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="py-8 px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Choose a Template
      </h1>
      <p className="text-gray-600 mb-6">
        Select a template to start building your website.
      </p>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            disabled={!!loadingId}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 text-left hover:border-indigo-500 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="aspect-video bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
              {t.thumbnail_url ? (
                <img
                  src={t.thumbnail_url}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-400">📄</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{t.name}</h3>
            {loadingId === t.id && (
              <p className="text-sm text-indigo-600 mt-2">Loading…</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
