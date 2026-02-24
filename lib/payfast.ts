import crypto from "crypto";

export type PayFastCredentials = {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  sandbox?: boolean;
};

/** Platform (MonoPage) credentials for subscription billing. Uses MONOPAGE_PAYFAST_* or PAYFAST_* fallback. */
export function getPlatformPayFastCredentials(): PayFastCredentials | null {
  const merchantId =
    process.env.MONOPAGE_PAYFAST_MERCHANT_ID?.trim() ||
    process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey =
    process.env.MONOPAGE_PAYFAST_MERCHANT_KEY?.trim() ||
    process.env.PAYFAST_MERCHANT_KEY?.trim();
  const passphrase =
    process.env.MONOPAGE_PAYFAST_PASSPHRASE?.trim() ||
    process.env.PAYFAST_PASSPHRASE?.trim();
  const sandbox =
    process.env.MONOPAGE_PAYFAST_SANDBOX === "1" ||
    process.env.PAYFAST_SANDBOX === "1";
  if (!merchantId || !merchantKey) return null;
  return { merchantId, merchantKey, passphrase, sandbox };
}

function getPayFastProcessUrl(sandbox?: boolean): string {
  return sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

export type PayFastPaymentData = {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  custom_str1?: string;
  custom_str2?: string;
  signature?: string;
};

export type PayFastSubscriptionData = PayFastPaymentData & {
  name_first?: string;
  name_last?: string;
  email_address?: string;
  subscription_type: string;
  recurring_amount: string;
  frequency: string;
  cycles: string;
  billing_date?: string;
};

/**
 * PayFast Custom Integration requires parameters in a SPECIFIC order.
 * See: https://developers.payfast.co.za/docs#step_2_signature
 */
const PAYMENT_SIGNATURE_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "m_payment_id",
  "amount",
  "item_name",
];

const SUBSCRIPTION_SIGNATURE_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount",
  "item_name",
  "custom_str1",
  "custom_str2",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
];

function generateSignature(
  data: Record<string, string>,
  order: string[],
  passphrase?: string
): string {
  const pairs: string[] = [];
  for (const key of order) {
    const val = data[key];
    if (val != null && val.trim() !== "") {
      pairs.push(
        `${key}=${encodeURIComponent(val.trim()).replace(/%20/g, "+")}`
      );
    }
  }
  let pfOutput = pairs.join("&");
  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }
  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

/** PayFast requires minimum R5.00 and valid decimal format (e.g. "100.00") */
const PAYFAST_MIN_AMOUNT = 5;

/**
 * Build one-time payment data. Uses client credentials when provided (invoice flow),
 * otherwise platform credentials (backwards compat).
 */
export function buildPayFastPayment(
  invoiceId: string,
  amount: number,
  itemName: string,
  returnUrl: string,
  cancelUrl: string,
  notifyUrl: string,
  credentials?: PayFastCredentials
): PayFastPaymentData | null {
  const creds = credentials ?? getPlatformPayFastCredentials();
  if (!creds) return null;

  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed < PAYFAST_MIN_AMOUNT) return null;
  const amountStr = (Math.round(parsed * 100) / 100).toFixed(2);

  const data: PayFastPaymentData = {
    merchant_id: creds.merchantId,
    merchant_key: creds.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: invoiceId,
    amount: amountStr,
    item_name: itemName,
  };

  data.signature = generateSignature(
    data,
    PAYMENT_SIGNATURE_ORDER,
    creds.passphrase
  );
  return data;
}

/**
 * Build subscription payment data for MonoPage platform billing.
 * Uses platform credentials only. Passphrase REQUIRED for subscriptions.
 */
export function buildPayFastSubscription(
  mPaymentId: string,
  amountCents: number,
  itemName: string,
  returnUrl: string,
  cancelUrl: string,
  notifyUrl: string,
  userId: string,
  plan: "starter" | "pro",
  buyer?: { nameFirst?: string; nameLast?: string; email?: string }
): PayFastSubscriptionData | null {
  const creds = getPlatformPayFastCredentials();
  if (!creds || !creds.passphrase) return null;

  const amount = amountCents / 100;
  if (amount < PAYFAST_MIN_AMOUNT) return null;
  const amountStr = (Math.round(amount * 100) / 100).toFixed(2);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const data: PayFastSubscriptionData = {
    merchant_id: creds.merchantId,
    merchant_key: creds.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: mPaymentId,
    amount: amountStr,
    item_name: itemName,
    subscription_type: "1",
    recurring_amount: amountStr,
    frequency: "3", // 3 = Monthly
    cycles: "0", // 0 = indefinite
    billing_date: today,
    custom_str1: userId,
    custom_str2: plan,
    ...(buyer?.nameFirst && { name_first: buyer.nameFirst }),
    ...(buyer?.nameLast && { name_last: buyer.nameLast }),
    ...(buyer?.email && { email_address: buyer.email }),
  };

  data.signature = generateSignature(
    data as Record<string, string>,
    SUBSCRIPTION_SIGNATURE_ORDER,
    creds.passphrase
  );
  return data;
}

export function getPayFastFormAction(sandbox?: boolean): string {
  const creds = getPlatformPayFastCredentials();
  return getPayFastProcessUrl(
    sandbox ?? creds?.sandbox ?? process.env.PAYFAST_SANDBOX === "1"
  );
}

export function getPayFastSubscriptionFormAction(): string {
  const creds = getPlatformPayFastCredentials();
  const sandbox =
    creds?.sandbox ??
    (process.env.MONOPAGE_PAYFAST_SANDBOX === "1" ||
      process.env.PAYFAST_SANDBOX === "1");
  return getPayFastProcessUrl(sandbox);
}
