import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaymentsForm } from "./PaymentsForm";
import Link from "next/link";

export default async function PaymentsSettingsPage({
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
    .select("plan, payfast_merchant_id, payfast_merchant_key, payfast_passphrase, payfast_sandbox")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="text-amber-800 font-medium">Pro plan required</p>
          <p className="mt-2 text-amber-700 text-sm">
            Configure your PayFast account to collect invoice payments from your customers.
            Upgrade to Pro to access this feature.
          </p>
          <Link
            href={`/dashboard/${niche}/subscription`}
            className="mt-4 inline-block py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
      <p className="text-gray-600 mb-8">
        Connect your PayFast account to accept payments from customers on your invoices.
      </p>

      <PaymentsForm
        niche={niche}
        initialData={{
          merchantId: profile?.payfast_merchant_id ?? "",
          merchantKey: profile?.payfast_merchant_key ?? "",
          passphrase: profile?.payfast_passphrase ?? "",
          sandbox: profile?.payfast_sandbox ?? false,
        }}
      />
    </div>
  );
}
