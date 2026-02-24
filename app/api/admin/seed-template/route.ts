import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * POST /api/admin/seed-template
 * Seeds the Plumber Pro template into the database. Admin only.
 * Call once to add the template, or to update it with the latest from templates/plumber-pro/index.html
 */
export async function POST() {
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

    const templatePath = join(process.cwd(), "templates", "plumber-pro", "index.html");
    const html = await readFile(templatePath, "utf-8");

    const { data, error } = await supabase
      .from("templates")
      .upsert(
        {
          name: "Plumber Pro",
          slug: "plumber-pro",
          html,
          css: "",
          js: "",
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug", ignoreDuplicates: false }
      )
      .select("id, name, slug")
      .single();

    if (error) {
      console.error("Seed template error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, template: data });
  } catch (err) {
    console.error("Seed template error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed template" },
      { status: 500 }
    );
  }
}
