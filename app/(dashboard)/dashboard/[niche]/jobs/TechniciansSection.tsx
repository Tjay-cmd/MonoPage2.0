"use client";

import { useState } from "react";
import {
  createTechnician,
  deleteTechnician,
} from "./job-actions";

export type Technician = {
  id: string;
  name: string;
  created_at: string;
  worker_token: string | null;
};

export function TechniciansSection({
  technicians,
  niche,
}: {
  technicians: Technician[];
  niche: string;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    setAdding(true);
    const res = await createTechnician(niche, name);
    setAdding(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNewName("");
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await deleteTechnician(niche, id);
    setDeletingId(null);
    if (res.error) setError(res.error);
  }

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Technicians</h2>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex gap-2 mb-5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add technician..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {adding ? "..." : "Add"}
          </button>
        </form>
        {technicians.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <p className="text-slate-500 text-sm">No technicians yet</p>
            <p className="text-slate-400 text-xs mt-1">Add one to assign to jobs</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {technicians.map((t) => (
              <li
                key={t.id}
                className="group flex items-center justify-between py-2.5 px-4 bg-slate-50/60 hover:bg-slate-100/80 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.worker_token && (
                    <>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `${typeof window !== "undefined" ? window.location.origin : ""}/worker/${t.worker_token}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Share via WhatsApp"
                      >
                        Share
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : ""}/worker/${t.worker_token}`;
                          navigator.clipboard.writeText(url);
                          setCopiedId(t.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy board link"
                      >
                        {copiedId === t.id ? "Copied!" : "Copy link"}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="text-xs text-slate-400 hover:text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deletingId === t.id ? "..." : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
