import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { WorkerBoard } from "./WorkerBoard";

export type WorkerJob = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
};

export default async function WorkerBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: tech } = await supabase
    .from("technicians")
    .select("id, name")
    .eq("worker_token", token)
    .single();

  if (!tech) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, description, scheduled_at, address, customer_name, customer_phone, status")
    .eq("technician_id", tech.id)
    .in("status", ["scheduled", "in_progress", "completed"])
    .order("scheduled_at", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkerBoard
        technicianName={tech.name}
        technicianId={tech.id}
        token={token}
        jobs={(jobs ?? []) as WorkerJob[]}
      />
    </div>
  );
}
