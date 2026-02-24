import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * GET - List user's uploaded images
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: files, error } = await supabase.storage
      .from("site-images")
      .list(user.id, { sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      console.error("List images error:", error);
      return NextResponse.json(
        { error: "Failed to list images" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const images = (files ?? [])
      .filter((f) => !f.name.startsWith("."))
      .map((f) => ({
        name: f.name,
        url: `${supabaseUrl}/storage/v1/object/public/site-images/${user.id}/${f.name}`,
        size: f.metadata?.size ?? 0,
        createdAt: f.created_at,
      }));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload an image
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPG, GIF, WebP, SVG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    // Sanitize filename: keep original name but make it URL-safe
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const storagePath = `${user.id}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("site-images")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: true, // overwrite if same name
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const url = `${supabaseUrl}/storage/v1/object/public/site-images/${storagePath}`;

    return NextResponse.json({
      name: safeName,
      url,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove an image
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Missing image name" },
        { status: 400 }
      );
    }

    const storagePath = `${user.id}/${name}`;
    const { error } = await supabase.storage
      .from("site-images")
      .remove([storagePath]);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
