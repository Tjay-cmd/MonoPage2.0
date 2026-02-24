import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailBrandingForm } from "./EmailBrandingForm";

export default async function EmailSettingsPage({
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
    .select(
      "plan, business_name, email_logo_url, email_brand_color, email_footer_text"
    )
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Design</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 mt-4">
          <p className="text-amber-800 font-medium">Pro plan required</p>
          <p className="mt-2 text-amber-700 text-sm">
            Customize how your invoice and quote emails look. Upgrade to Pro to access this feature.
          </p>
          <a
            href={`/dashboard/${niche}/subscription`}
            className="mt-4 inline-block py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Email Design
      </h1>
      <p className="text-gray-600 mb-8">
        Customize how your invoice and quote emails look. This is your
        business—make it recognizable.
      </p>

      <EmailBrandingForm
        niche={niche}
        initialData={{
          businessName: profile?.business_name ?? "",
          logoUrl: profile?.email_logo_url ?? "",
          brandColor: profile?.email_brand_color ?? "#6366f1",
          footerText: profile?.email_footer_text ?? "",
        }}
      />
    </div>
  );
}
