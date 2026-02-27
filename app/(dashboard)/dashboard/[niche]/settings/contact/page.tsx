import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteContactForm } from "./SiteContactForm";
import { CopyPromptButton } from "./CopyPromptButton";

export default async function SiteContactPage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, site_phone, site_email, site_address, site_whatsapp")
    .eq("id", user.id)
    .single();

  const address = profile?.site_address ?? "";
  const addressEnc = encodeURIComponent((address).replace(/\n/g, " "));
  const hasAddress = address.trim().length > 0;

  // The map section snippet — AI just needs to drop this in, no guesswork
  const mapSnippet = `<div class="our-location-section" style="margin-top:2rem;">
  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">Our Location</h2>
  <p style="margin-bottom:1rem;">__ADDRESS__</p>
  __MAP_EMBED__
</div>`;

  const mapPrompt = `Replace the entire "Our Location" section (including any "Interactive Map" placeholder) with this exact code block — do not change anything else on the page:\n\n${mapSnippet}`;

  const contactPrompt = `Update only the contact details on this page—do not touch the map, do not remove any other content, and do not change any other sections (hero, services, about, testimonials, form, footer, etc.).

Only make these changes:
- Phone number display text → __PHONE__
- Phone click-to-call href → tel:__PHONE_RAW__
- Email display text → __EMAIL__
- Email mailto href → mailto:__EMAIL__
- Business name text → __BUSINESS_NAME__
- WhatsApp wa.me link number → __WHATSAPP__

Do NOT touch the map, address, or "Our Location" section. Do NOT invent or change any other content.`;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Site Contact
      </h1>
      <p className="text-gray-600 mb-8">
        This information appears on your published website. Templates use placeholders like __BUSINESS_NAME__ and __PHONE__—these get replaced automatically when visitors view your site.
      </p>

      <SiteContactForm
        niche={niche}
        initialData={{
          businessName: profile?.business_name ?? "",
          sitePhone: profile?.site_phone ?? "",
          siteEmail: profile?.site_email ?? "",
          siteAddress: address,
          siteWhatsapp: profile?.site_whatsapp ?? "",
        }}
      />

      {/* Map embed section */}
      <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Map embed for your website</h3>
          <p className="text-sm text-gray-500">
            {hasAddress
              ? "Your address is saved. Use the steps below to add a real interactive map to your website."
              : "Save your address above first, then come back here to get your map embed."}
          </p>
        </div>

        {hasAddress && (
          <>
            {/* Live preview of the map */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Preview — this is how the map will look on your site:</p>
              <iframe
                src={`https://www.google.com/maps?q=${addressEnc}&output=embed`}
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 8 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map preview"
              />
            </div>

            {/* Step-by-step with copy button */}
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-indigo-900">How to add this map to your website:</p>
              <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                <li>Click <strong>Copy map prompt</strong> below</li>
                <li>Open <strong>Your Website</strong> and paste it into the AI chat</li>
                <li>The AI will replace the map placeholder with your real address map</li>
              </ol>
              <div className="relative">
                <pre className="p-3 pr-28 bg-white rounded border border-indigo-100 text-xs text-gray-700 whitespace-pre-wrap font-sans">
                  {mapPrompt}
                </pre>
                <CopyPromptButton text={mapPrompt} label="Copy map prompt" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* General contact fix prompt */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Fix all contact info on your website</h3>
        <p className="text-sm text-gray-600 mb-3">
          If your website shows wrong phone, email, or address anywhere, use this prompt. It updates only the contact sections and leaves everything else untouched.
        </p>
        <div className="relative">
          <pre className="p-4 pr-24 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-sans">
            {contactPrompt}
          </pre>
          <CopyPromptButton text={contactPrompt} label="Copy prompt" />
        </div>
      </div>
    </div>
  );
}
