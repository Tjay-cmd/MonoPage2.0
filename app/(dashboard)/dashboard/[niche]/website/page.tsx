import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TemplatePicker from "@/components/editor/TemplatePicker";
import WebsiteEditor from "@/components/editor/WebsiteEditor";
import { createDraftFromTemplate, saveDraft, publishSite, getSiteVersions, loadVersion, deleteDraft } from "../../actions";

export default async function WebsitePage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, slug, thumbnail_url")
    .order("name");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, site_phone, site_email, site_address, site_whatsapp")
    .eq("id", user.id)
    .single();

  const addressRaw = profile?.site_address ?? "123 Business Street, Johannesburg, Gauteng";
  const placeholders = {
    businessName: profile?.business_name ?? "Your Business",
    phone: profile?.site_phone ?? "+27 12 345 6789",
    phoneRaw: (profile?.site_phone ?? profile?.site_whatsapp ?? "27123456789").replace(/\D/g, "") || "27123456789",
    email: profile?.site_email ?? "info@example.com",
    address: addressRaw.replace(/\n/g, "<br>"),
    addressEnc: encodeURIComponent(addressRaw.replace(/\n/g, " ")),
    whatsapp: profile?.site_whatsapp ?? ((profile?.site_phone ?? "27123456789").replace(/\D/g, "") || "27123456789"),
    mapEmbed: `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(addressRaw.replace(/\n/g, " "))}&output=embed" width="100%" height="300" style="border:0;border-radius:8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>`,
  };

  const { data: draft } = await supabase
    .from("user_sites")
    .select("id, html, css, js")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .single();

  if (draft) {
    return (
      <WebsiteEditor
        initialHtml={draft.html}
        initialCss={draft.css}
        initialJs={draft.js}
        userSiteId={draft.id}
        placeholders={placeholders}
        saveDraft={saveDraft}
        publish={publishSite}
        getVersions={getSiteVersions}
        loadVersion={loadVersion}
        deleteDraft={deleteDraft}
      />
    );
  }

  return (
    <TemplatePicker
      templates={templates ?? []}
      onSelect={createDraftFromTemplate}
    />
  );
}
