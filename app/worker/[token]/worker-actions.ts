"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

/**
 * Update job status from worker board (token-based, no auth).
 * Verifies: token maps to technician, job belongs to that technician.
 */
export async function updateJobStatusByWorker(
  token: string,
  jobId: string,
  status: string
) {
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]))
    return { error: "Invalid status" };

  const supabase = createAdminClient();
  const { data: tech } = await supabase
    .from("technicians")
    .select("id")
    .eq("worker_token", token)
    .single();

  if (!tech) return { error: "Invalid link" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("technician_id", tech.id)
    .single();

  if (!job) return { error: "Job not found" };

  const { error } = await supabase
    .from("jobs")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) return { error: error.message };
  return { ok: true };
}
