import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export type EmailBranding = {
  businessName?: string;
  logoUrl?: string;
  brandColor?: string;
  footerText?: string;
};

function buildInvoiceEmailHtml(
  customerName: string,
  total: string,
  dueDate: string | null,
  invoiceUrl: string,
  branding: EmailBranding
): string {
  const brandColor = branding.brandColor || "#6366f1";
  const businessName = branding.businessName || "Your Business";
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${businessName}" style="max-height: 48px; max-width: 180px; display: block; margin-bottom: 24px;" />`
    : `<h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: ${brandColor};">${businessName}</h1>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 24px 40px; border-bottom: 1px solid #e5e7eb;">
              ${logoHtml}
              <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">Invoice for ${customerName}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Hi ${customerName},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Please find your invoice from ${businessName} below.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Amount due</p>
                    <p style="margin: 0; font-size: 22px; font-weight: 700; color: #111827;">R${total}</p>
                    ${dueDate ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">Due by ${dueDate}</p>` : ""}
                  </td>
                </tr>
              </table>
              <a href="${invoiceUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                View & Pay Invoice
              </a>
            </td>
          </tr>
          ${branding.footerText ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                ${branding.footerText.replace(/\n/g, "<br>")}
              </p>
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 16px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Sent via MonoPage
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendInvoiceEmail(
  to: string,
  customerName: string,
  total: number,
  dueDate: string | null,
  shareToken: string,
  branding: EmailBranding
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping invoice email");
    return { ok: false, error: "Email not configured" };
  }

  const invoiceUrl = `${APP_URL}/i/${shareToken}`;
  const totalStr = total.toFixed(2);
  const dueStr = dueDate
    ? new Date(dueDate).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your invoice from ${branding.businessName || "us"} – R${totalStr}`,
      html: buildInvoiceEmailHtml(
        customerName,
        totalStr,
        dueStr,
        invoiceUrl,
        branding
      ),
    });

    if (error) {
      console.error("[email] Invoice send error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] Invoice send error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send",
    };
  }
}

export async function sendNewQuoteRequestNotification(
  ownerEmail: string,
  customerName: string,
  customerEmail: string,
  messagePreview: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping notification");
    return { ok: false, error: "Email not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `New quote request from ${customerName}`,
      html: `
        <p>You have received a new quote request from your website.</p>
        <p><strong>From:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Message:</strong></p>
        <p>${messagePreview.slice(0, 500)}${messagePreview.length > 500 ? "..." : ""}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/dashboard">View in dashboard</a></p>
      `,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] Send error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send",
    };
  }
}
