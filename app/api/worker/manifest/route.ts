import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const origin = req.nextUrl.origin;
  const startUrl = token ? `${origin}/worker/${token}` : origin;

  const manifest = {
    name: "MonoPage Job Board",
    short_name: "Job Board",
    description: "View and manage your assigned jobs",
    start_url: startUrl,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    icons: [
      { src: `${origin}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${origin}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/json" },
  });
}
