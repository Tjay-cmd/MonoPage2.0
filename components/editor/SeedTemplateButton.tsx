"use client";

import { useState } from "react";

export default function SeedTemplateButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seed-template", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Plumber Pro template seeded successfully!");
      } else {
        setMessage(data.error ?? "Failed to seed");
      }
    } catch {
      setMessage("Failed to seed template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Seed Plumber Pro Template
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Add or update the premium Plumber Pro template (single HTML file with
        inline CSS and JS) from templates/plumber-pro/index.html.
      </p>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Seeding…" : "Seed Plumber Pro"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
