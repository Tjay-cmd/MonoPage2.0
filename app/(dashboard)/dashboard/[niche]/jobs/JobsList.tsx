"use client";

import Link from "next/link";
import { updateJobStatus } from "./job-actions";

export type Job = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  technician_id: string | null;
  created_at: string;
  technicians: { id: string; name: string } | null;
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

export function JobsList({
  jobs,
  niche,
}: {
  jobs: Job[];
  niche: string;
}) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No jobs yet</h3>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          Create your first job to start scheduling work and assigning technicians.
        </p>
        <Link
          href={`/dashboard/${niche}/jobs/new`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create job
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} niche={niche} />
      ))}
    </div>
  );
}

function JobCard({ job, niche }: { job: Job; niche: string }) {
  const technicianName = job.technicians?.name ?? null;
  const statusStyle = STATUS_STYLES[job.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusStyle}`}>
              {STATUS_OPTIONS.find((o) => o.value === job.status)?.label ?? job.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1.5" suppressHydrationWarning>
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(job.scheduled_at).toLocaleString()}
            </span>
            {job.address && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-[200px]">{job.address}</span>
              </span>
            )}
          </div>
          {(job.customer_name || technicianName) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {job.customer_name && (
                <span className="text-slate-600">
                  {job.customer_name}
                  {job.customer_phone && (
                    <span className="text-slate-400"> · {job.customer_phone}</span>
                  )}
                </span>
              )}
              {technicianName && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {technicianName}
                </span>
              )}
            </div>
          )}
          {job.description && (
            <p className="text-sm text-slate-500 line-clamp-2">{job.description}</p>
          )}
        </div>
        <div className="flex sm:flex-col gap-3 sm:shrink-0">
          <select
            value={job.status}
            onChange={async (e) => {
              await updateJobStatus(niche, job.id, e.target.value);
            }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Link
            href={`/dashboard/${niche}/jobs/${job.id}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
