"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmailBranding } from "./email-actions";

type Props = {
  niche: string;
  initialData: {
    businessName: string;
    logoUrl: string;
    brandColor: string;
    footerText: string;
  };
};

export function EmailBrandingForm({ niche, initialData }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialData.businessName);
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [brandColor, setBrandColor] = useState(initialData.brandColor);
  const [footerText, setFooterText] = useState(initialData.footerText);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await updateEmailBranding(niche, {
      businessName: businessName.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      brandColor: brandColor.trim() || "#6366f1",
      footerText: footerText.trim() || undefined,
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
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Pieter's Plumbing"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Shown at the top of your emails and in the subject line.
          </p>
        </div>

        <div>
          <label
            htmlFor="logoUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Logo URL
          </label>
          <input
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use an image from My Images—copy the URL after uploading. If empty,
            your business name will be shown instead.
          </p>
        </div>

        <div>
          <label
            htmlFor="brandColor"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Brand color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#6366f1"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-base font-mono"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Used for the &quot;View & Pay&quot; button and accents.
          </p>
        </div>

        <div>
          <label
            htmlFor="footerText"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Footer / signature
          </label>
          <textarea
            id="footerText"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            rows={3}
            placeholder="Thanks for your business!&#10;Call me on 071 439 0187"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base resize-y"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional. Shown at the bottom of your invoice emails.
          </p>
        </div>
      </div>

      {message === "success" && (
        <p className="text-green-600 font-medium">Settings saved.</p>
      )}
      {message === "error" && (
        <p className="text-red-600 font-medium">Something went wrong. Try again.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save email design"}
      </button>
    </form>
  );
}
