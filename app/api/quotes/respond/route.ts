import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, action } = body;

    if (!token || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: quote } = await admin
      .from("quotes")
      .select("id, status")
      .eq("share_token", token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status !== "sent") {
      return NextResponse.json(
        { error: "Quote has already been responded to" },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    await admin
      .from("quotes")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[quotes/respond]", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
