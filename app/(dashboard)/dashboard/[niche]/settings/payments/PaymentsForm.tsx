"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePayFastSettings } from "./payment-actions";

type Props = {
  niche: string;
  initialData: {
    merchantId: string;
    merchantKey: string;
    passphrase: string;
    sandbox: boolean;
  };
};

export function PaymentsForm({ niche, initialData }: Props) {
  const router = useRouter();
  const [merchantId, setMerchantId] = useState(initialData.merchantId);
  const [merchantKey, setMerchantKey] = useState(initialData.merchantKey);
  const [passphrase, setPassphrase] = useState(initialData.passphrase);
  const [sandbox, setSandbox] = useState(initialData.sandbox);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await updatePayFastSettings(niche, {
      merchantId: merchantId.trim() || undefined,
      merchantKey: merchantKey.trim() || undefined,
      passphrase: passphrase.trim() || undefined,
      sandbox,
    });
    setSaving(false);
    if (res.error) setMessage("error");
    else {
      setMessage("success");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <p className="text-sm text-gray-600">
          Configure your PayFast account to collect payments from your customers when they pay invoices. Get your credentials from{" "}
          <a
            href="https://www.payfast.co.za/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            PayFast
          </a>
          .
        </p>
        <div>
          <label
            htmlFor="merchantId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Merchant ID
          </label>
          <input
            id="merchantId"
            type="text"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            placeholder="10000100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
        </div>
        <div>
          <label
            htmlFor="merchantKey"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Merchant Key
          </label>
          <input
            id="merchantKey"
            type="text"
            value={merchantKey}
            onChange={(e) => setMerchantKey(e.target.value)}
            placeholder="46f0cd694581a"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
        </div>
        <div>
          <label
            htmlFor="passphrase"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Passphrase
          </label>
          <input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Your PayFast passphrase"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Set in PayFast Dashboard under Settings.
          </p>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Use PayFast Sandbox (for testing)
            </span>
          </label>
        </div>
        {message === "success" && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}
        {message === "error" && (
          <p className="text-sm text-red-600">Failed to save. Try again.</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
