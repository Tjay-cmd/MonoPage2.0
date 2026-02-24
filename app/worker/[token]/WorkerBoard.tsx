"use client";

import { useState, useEffect } from "react";
import { updateJobStatusByWorker } from "./worker-actions";
import type { WorkerJob } from "./page";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

export function WorkerBoard({
  technicianName,
  technicianId,
  token,
  jobs: initialJobs,
}: {
  technicianName: string;
  technicianId: string;
  token: string;
  jobs: WorkerJob[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (!standalone) setShowPwaPrompt(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default")
      setShowPushPrompt(true);
    if (Notification.permission === "granted") setPushEnabled(true);
  }, []);

  async function handleStatusChange(jobId: string, status: string) {
    const res = await updateJobStatusByWorker(token, jobId, status);
    if (res.ok) setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-sm text-slate-500">Hi, {technicianName}</p>
      </header>

      <main className="p-4 space-y-4">
        {showPwaPrompt && !isStandalone && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm">
            <p className="font-medium text-indigo-900">Add to Home Screen</p>
            <p className="text-indigo-700 mt-1">
              Tap Share → Add to Home Screen for quick access.
            </p>
            <button
              onClick={() => setShowPwaPrompt(false)}
              className="mt-2 text-indigo-600 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {showPushPrompt && !pushEnabled && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
            <p className="font-medium text-amber-900">Get notified</p>
            <p className="text-amber-800 mt-1">
              Allow notifications to get a ping when new jobs are assigned.
            </p>
            <button
              onClick={async () => {
                const permission = await Notification.requestPermission();
                setShowPushPrompt(permission !== "default");
                setPushEnabled(permission === "granted");
                if (permission === "granted") {
                  const reg = await navigator.serviceWorker?.ready;
                  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                  if (reg?.pushManager && vapidKey) {
                    const keyBytes = urlBase64ToUint8Array(vapidKey);
                    const sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: keyBytes as BufferSource,
                    });
                    await fetch("/api/worker/push-subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        technicianId,
                        subscription: sub.toJSON(),
                      }),
                    });
                  }
                }
              }}
              className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg font-medium"
            >
              Enable notifications
            </button>
            <button
              onClick={() => setShowPushPrompt(false)}
              className="mt-2 ml-2 text-amber-700 font-medium"
            >
              Not now
            </button>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-slate-500">No jobs assigned yet.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{job.title}</h2>
                  <p className="text-sm text-slate-600 mt-1" suppressHydrationWarning>
                    {new Date(job.scheduled_at).toLocaleString()}
                  </p>
                  {job.address && (
                    <p className="text-sm text-slate-500 mt-1">{job.address}</p>
                  )}
                  {job.customer_name && (
                    <p className="text-sm text-slate-500">
                      {job.customer_name}
                      {job.customer_phone && ` · ${job.customer_phone}`}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium shrink-0 ${
                    STATUS_STYLES[job.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STATUS_OPTIONS.find((o) => o.value === job.status)?.label ?? job.status}
                </span>
              </div>
              <div className="mt-4">
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
