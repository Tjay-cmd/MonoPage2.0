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
