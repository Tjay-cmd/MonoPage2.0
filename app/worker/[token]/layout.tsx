import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    manifest: `/api/worker/manifest?token=${encodeURIComponent(token)}`,
  };
}

export default function WorkerTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
