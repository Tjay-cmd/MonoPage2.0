import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformPayFastCredentials } from "@/lib/payfast";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayFast ITN handler for MonoPage subscription payments.
 * Uses platform credentials. Creates/updates subscription on COMPLETE.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const data: Record<string, string> = {};
    body.forEach((value, key) => {
      data[key] = String(value);
    });

    const paymentStatus = data.payment_status;
    const token = data.token;
    const userId = data.custom_str1;
    const plan = data.custom_str2 as "starter" | "pro" | undefined;
    const amountGross = data.amount_gross;

    if (paymentStatus !== "COMPLETE" || !token) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const creds = getPlatformPayFastCredentials();
    if (!creds) {
      return NextResponse.json({ error: "Platform PayFast not configured" }, { status: 500 });
    }

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

    if (creds.passphrase) {
      str += `&passphrase=${encodeURIComponent(creds.passphrase).replace(/%20/g, "+")}`;
    }

    const computedSignature = crypto.createHash("md5").update(str).digest("hex");
    if (computedSignature !== submittedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existingByToken } = await admin
      .from("subscriptions")
      .select("id, user_id")
      .eq("payfast_token", token)
      .eq("status", "active")
      .maybeSingle();

    const { data: existingByUser } = userId
      ? await admin
          .from("subscriptions")
          .select("id, user_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle()
      : { data: null };

    const existing = existingByToken ?? existingByUser;
    const effectiveUserId = existing?.user_id ?? userId;

    if (existing) {
      const amountCents = amountGross
        ? Math.round(parseFloat(amountGross) * 100)
        : 0;
      const now = new Date().toISOString();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await admin
        .from("subscriptions")
        .update({
          payfast_token: token,
          payfast_subscription_id: token,
          amount_cents: amountCents || undefined,
          current_period_start: now,
          current_period_end: periodEnd.toISOString(),
          updated_at: now,
        })
        .eq("id", existing.id);
    } else if (effectiveUserId) {
      const { count } = await admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const customerNumber = (count ?? 0) + 1;
      const amountCents = amountGross
        ? Math.round(parseFloat(amountGross) * 100)
        : 0;
      const now = new Date().toISOString();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subRow = {
        user_id: effectiveUserId,
        plan: plan ?? "starter",
        status: "active",
        amount_cents: amountCents,
        customer_number: customerNumber,
        payfast_token: token,
        payfast_subscription_id: token,
        current_period_start: now,
        current_period_end: periodEnd.toISOString(),
        updated_at: now,
      };

      const { error: upsertError } = await admin
        .from("subscriptions")
        .upsert(subRow, { onConflict: "user_id" });

      if (upsertError) {
        console.error("PayFast subscription ITN: upsert failed", upsertError);
        return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
      }

      await admin
        .from("profiles")
        .update({
          plan: plan ?? "starter",
          subscription_status: "active",
          updated_at: now,
        })
        .eq("id", effectiveUserId);
    } else {
      return NextResponse.json({ error: "No user_id for new subscription" }, { status: 400 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error("PayFast subscription ITN error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
