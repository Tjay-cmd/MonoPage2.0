import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { technicianId, subscription } = await req.json();
    if (!technicianId || !subscription?.endpoint) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh;
    const auth = keys?.auth;
    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: tech } = await supabase
      .from("technicians")
      .select("id")
      .eq("id", technicianId)
      .single();
    if (!tech) {
      return NextResponse.json({ error: "Invalid technician" }, { status: 404 });
    }

    await supabase.from("push_subscriptions").upsert(
      {
        technician_id: technicianId,
        endpoint,
        p256dh,
        auth,
      },
      { onConflict: "technician_id,endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
