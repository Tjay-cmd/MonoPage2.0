import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TemplateUploadForm from "@/components/editor/TemplateUploadForm";
import SeedTemplateButton from "@/components/editor/SeedTemplateButton";

export default async function AdminTemplatesPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect(`/dashboard/${niche}`);
  }

  return (
    <div className="py-8 px-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Upload Template
      </h1>
      <p className="text-gray-600 mb-6">
        Upload a ZIP file containing index.html (required), and optionally
        styles.css, script.js, and assets/ folder.
      </p>
      <SeedTemplateButton />
      <TemplateUploadForm />
    </div>
  );
}
