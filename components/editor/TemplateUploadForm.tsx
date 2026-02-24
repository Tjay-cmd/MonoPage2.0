"use client";

import { useState } from "react";

export default function TemplateUploadForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !file) {
      setMessage("Please provide a template name and select a ZIP file.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());

    try {
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Upload failed");
        setStatus("error");
        return;
      }

      setMessage(`Template "${name}" uploaded successfully.`);
      setStatus("success");
      setName("");
      setFile(null);
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Template Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Plumber Starter"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          ZIP File
        </label>
        <input
          id="file"
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Required: index.html. Optional: styles.css, script.js, assets/
        </p>
      </div>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "uploading"}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "uploading" ? "Uploading…" : "Upload Template"}
      </button>
    </form>
  );
}
