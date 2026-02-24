import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseTemplateZip, slugify } from "@/lib/template-parser";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file || !name?.trim()) {
      return NextResponse.json(
        { error: "Missing file or template name" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "File must be a ZIP archive" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const parsed = await parseTemplateZip(arrayBuffer);

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json(
        { error: "Invalid template name" },
        { status: 400 }
      );
    }

    const { data: template, error: insertError } = await supabase
      .from("templates")
      .insert({
        name: name.trim(),
        slug,
        html: parsed.html,
        css: parsed.css,
        js: parsed.js,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: `Template with slug "${slug}" already exists` },
          { status: 409 }
        );
      }
      throw insertError;
    }

    for (const asset of parsed.assets) {
      const storagePath = `${template.id}/${asset.path.replace("assets/", "")}`;
      await supabase.storage
        .from("template-assets")
        .upload(storagePath, asset.content, {
          contentType: getMimeType(asset.path),
          upsert: true,
        });
    }

    return NextResponse.json({ id: template.id, slug });
  } catch (err) {
    console.error("Template upload error:", err);
    return NextResponse.json(
      { error: "Failed to process template" },
      { status: 500 }
    );
  }
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
