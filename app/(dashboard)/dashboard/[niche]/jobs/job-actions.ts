"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { sendPushToTechnician } from "@/lib/push";

const VALID_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobInput = {
  user_site_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  address?: string;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  technician_id?: string | null;
  quote_request_id?: string | null;
  quote_id?: string | null;
};

async function getUserSiteIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_sites")
    .select("id")
    .eq("user_id", userId);
  return (data ?? []).map((s) => s.id);
}

export async function createJob(niche: string, data: JobInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const siteIds = await getUserSiteIds(user.id);
  if (!siteIds.includes(data.user_site_id))
    return { error: "Invalid site" };

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      ...data,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (data.technician_id) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const { data: tech } = await supabase
      .from("technicians")
      .select("worker_token")
      .eq("id", data.technician_id)
      .single();
    if (tech?.worker_token) {
      const url = `${baseUrl}/worker/${tech.worker_token}`;
      sendPushToTechnician(
        data.technician_id,
        `New job: ${data.title}`,
        "View your job board",
        url
      ).catch(() => {});
    }
  }
  revalidatePath(`/dashboard/${niche}/jobs`);
  revalidatePath(`/dashboard/${niche}`);
  return { ok: true, jobId: job.id };
}

export async function updateJob(
  niche: string,
  jobId: string,
  data: Partial<JobInput>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const siteIds = await getUserSiteIds(user.id);
  const { data: existing } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .in("user_site_id", siteIds)
    .single();

  if (!existing) return { error: "Job not found" };

  const { error } = await supabase
    .from("jobs")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) return { error: error.message };
  if (data.technician_id) {
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", jobId)
      .single();
    const { data: tech } = await supabase
      .from("technicians")
      .select("worker_token")
      .eq("id", data.technician_id)
      .single();
    if (tech?.worker_token && job) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const url = `${baseUrl}/worker/${tech.worker_token}`;
      sendPushToTechnician(
        data.technician_id,
        `New job: ${job.title}`,
        "View your job board",
        url
      ).catch(() => {});
    }
  }
  revalidatePath(`/dashboard/${niche}/jobs`);
  revalidatePath(`/dashboard/${niche}/jobs/[id]`, "page");
  revalidatePath(`/dashboard/${niche}`);
  return { ok: true };
}

export async function updateJobStatus(
  niche: string,
  jobId: string,
  status: string
) {
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]))
    return { error: "Invalid status" };
  return updateJob(niche, jobId, { status });
}

export async function deleteJob(niche: string, jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const siteIds = await getUserSiteIds(user.id);
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .in("user_site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/jobs`);
  revalidatePath(`/dashboard/${niche}`);
  return { ok: true };
}

// Technicians
export async function createTechnician(niche: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: tech, error } = await supabase
    .from("technicians")
    .insert({
      user_id: user.id,
      name: name.trim(),
      worker_token: nanoid(24),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/jobs`);
  return { ok: true, technicianId: tech.id };
}

export async function updateTechnician(
  niche: string,
  technicianId: string,
  name: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("technicians")
    .update({ name: name.trim() })
    .eq("id", technicianId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/jobs`);
  return { ok: true };
}

export async function deleteTechnician(niche: string, technicianId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("technicians")
    .delete()
    .eq("id", technicianId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${niche}/jobs`);
  return { ok: true };
}
