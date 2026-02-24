"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidNiche } from "@/lib/constants";
import { nanoid } from "nanoid";

export async function setNiche(formData: FormData) {
  const niche = formData.get("niche") as string;
  const nicheLower = niche?.toLowerCase();
  if (!nicheLower || !isValidNiche(nicheLower)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("profiles")
    .update({ niche: nicheLower, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect(`/dashboard/${nicheLower}`);
}

export async function createDraftFromTemplate(templateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: template } = await supabase
    .from("templates")
    .select("id, html, css, js")
    .eq("id", templateId)
    .single();

  if (!template) {
    return { error: "Template not found" };
  }

  const { error } = await supabase.from("user_sites").upsert(
    {
      user_id: user.id,
      template_id: template.id,
      html: template.html,
      css: template.css,
      js: template.js,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,status",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function deleteDraft(userSiteId: string, path?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Delete site_versions first (foreign key)
  await supabase
    .from("site_versions")
    .delete()
    .eq("user_site_id", userSiteId);

  const { error } = await supabase
    .from("user_sites")
    .delete()
    .eq("id", userSiteId)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (error) {
    return { error: error.message };
  }
  if (path) revalidatePath(path);
  return { ok: true };
}

export async function saveDraft(userSiteId: string, html: string, css: string, js: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error: updateError } = await supabase
    .from("user_sites")
    .update({
      html,
      css,
      js,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userSiteId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from("site_versions").insert({
    user_site_id: userSiteId,
    html,
    css,
    js,
  });

  const { data: versions } = await supabase
    .from("site_versions")
    .select("id")
    .eq("user_site_id", userSiteId)
    .order("created_at", { ascending: false });

  if (versions && versions.length > 20) {
    const toDelete = versions.slice(20);
    for (const v of toDelete) {
      await supabase.from("site_versions").delete().eq("id", v.id);
    }
  }

  return { ok: true };
}

export async function getSiteVersions(userSiteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", versions: [] };
  }

  const { data: draft } = await supabase
    .from("user_sites")
    .select("id")
    .eq("id", userSiteId)
    .eq("user_id", user.id)
    .single();

  if (!draft) {
    return { error: "Not found", versions: [] };
  }

  const { data: versions } = await supabase
    .from("site_versions")
    .select("id, created_at")
    .eq("user_site_id", userSiteId)
    .order("created_at", { ascending: false })
    .limit(20);

  return { versions: versions ?? [] };
}

export async function loadVersion(
  userSiteId: string,
  versionId: string
): Promise<{ error?: string } | { html: string; css: string; js: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: version } = await supabase
    .from("site_versions")
    .select("html, css, js, user_site_id")
    .eq("id", versionId)
    .single();

  if (!version) {
    return { error: "Version not found" };
  }

  const { data: site } = await supabase
    .from("user_sites")
    .select("id")
    .eq("id", version.user_site_id)
    .eq("user_id", user.id)
    .single();

  if (!site) {
    return { error: "Forbidden" };
  }

  return {
    html: version.html,
    css: version.css,
    js: version.js,
  };
}

export async function publishSite(
  userSiteId: string,
  currentContent?: { html: string; css: string; js: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: draft } = await supabase
    .from("user_sites")
    .select("id, template_id, html, css, js")
    .eq("id", userSiteId)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .single();

  if (!draft) {
    return { error: "Draft not found" };
  }

  const html = currentContent?.html ?? draft.html;
  const css = currentContent?.css ?? draft.css;
  const js = currentContent?.js ?? draft.js;

  let slug = `${user.id.slice(0, 8)}-${nanoid(10)}`;
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("user_sites")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!existing) break;
    slug = `${user.id.slice(0, 8)}-${nanoid(10)}`;
    attempts++;
  }

  const { error } = await supabase.from("user_sites").upsert(
    {
      user_id: user.id,
      template_id: draft.template_id,
      html,
      css,
      js,
      status: "published",
      slug,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,status", ignoreDuplicates: false }
  );

  if (error) {
    return { error: error.message };
  }
  return { ok: true, slug };
}
