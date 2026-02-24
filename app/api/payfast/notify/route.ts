import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayFast ITN (Instant Transaction Notification) handler for invoice payments.
 * Uses invoice owner's PayFast credentials for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const data: Record<string, string> = {};
    body.forEach((value, key) => {
      data[key] = String(value);
    });

    const paymentStatus = data.payment_status;
    const mPaymentId = data.m_payment_id;

    if (paymentStatus !== "COMPLETE" || !mPaymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const admin = createAdminClient();
    const { data: invoice } = await admin
      .from("invoices")
      .select("user_site_id")
      .eq("id", mPaymentId)
      .single();

    if (!invoice?.user_site_id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { data: userSite } = await admin
      .from("user_sites")
      .select("user_id")
      .eq("id", invoice.user_site_id)
      .single();

    if (!userSite) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("payfast_passphrase")
      .eq("id", userSite.user_id)
      .single();

    const passphrase =
      ownerProfile?.payfast_passphrase?.trim() ||
      process.env.PAYFAST_PASSPHRASE?.trim();
    const submittedSignature = data.signature;
    if (!submittedSignature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const keys = Object.keys(data)
      .filter((k) => k !== "signature" && data[k] !== "")
      .sort();

    let str = keys
      .map((k) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, "+")}`)
      .join("&");

    if (passphrase) {
      str += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;
    }

    const computedSignature = crypto.createHash("md5").update(str).digest("hex");

    if (computedSignature !== submittedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { error } = await admin
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mPaymentId);

    if (error) {
      console.error("PayFast ITN: failed to update invoice", mPaymentId, error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error("PayFast ITN error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
