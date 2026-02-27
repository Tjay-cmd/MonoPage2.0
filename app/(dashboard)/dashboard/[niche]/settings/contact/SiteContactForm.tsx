"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteContact } from "./contact-actions";

type Props = {
  niche: string;
  initialData: {
    businessName: string;
    sitePhone: string;
    siteEmail: string;
    siteAddress: string;
    siteWhatsapp: string;
  };
};

export function SiteContactForm({ niche, initialData }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialData.businessName);
  const [sitePhone, setSitePhone] = useState(initialData.sitePhone);
  const [siteEmail, setSiteEmail] = useState(initialData.siteEmail);
  const [siteAddress, setSiteAddress] = useState(initialData.siteAddress);
  const [siteWhatsapp, setSiteWhatsapp] = useState(initialData.siteWhatsapp);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorDetail(null);
    const res = await updateSiteContact(niche, {
      businessName: businessName.trim() || undefined,
      sitePhone: sitePhone.trim() || undefined,
      siteEmail: siteEmail.trim() || undefined,
      siteAddress: siteAddress.trim() || undefined,
      siteWhatsapp: siteWhatsapp.trim() || undefined,
    });
    setSaving(false);
    if (res.error) {
      setMessage("error");
      setErrorDetail(res.error);
    } else {
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
            Shown in the header, footer, and across your website.
          </p>
        </div>

        <div>
          <label
            htmlFor="sitePhone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone number
          </label>
          <input
            id="sitePhone"
            type="tel"
            value={sitePhone}
            onChange={(e) => setSitePhone(e.target.value)}
            placeholder="+27 12 345 6789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Display format. Used for click-to-call links.
          </p>
        </div>

        <div>
          <label
            htmlFor="siteEmail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="siteEmail"
            type="email"
            value={siteEmail}
            onChange={(e) => setSiteEmail(e.target.value)}
            placeholder="info@yourbusiness.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Shown on your website for contact.
          </p>
        </div>

        <div>
          <label
            htmlFor="siteAddress"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="siteAddress"
            rows={2}
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            placeholder="123 Business Street, Johannesburg, Gauteng"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
        </div>

        <div>
          <label
            htmlFor="siteWhatsapp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            WhatsApp number
          </label>
          <input
            id="siteWhatsapp"
            type="text"
            value={siteWhatsapp}
            onChange={(e) => setSiteWhatsapp(e.target.value)}
            placeholder="27123456789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
          />
          <p className="mt-1 text-xs text-gray-500">
            Digits only (no + or spaces). Used for the WhatsApp button link. Leave empty to use phone number.
          </p>
        </div>
      </div>

      {message === "success" && (
        <p className="text-sm text-green-600 font-medium">Saved successfully.</p>
      )}
      {message === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-sm text-red-700 font-medium">Failed to save.</p>
          {errorDetail?.includes("does not exist") ? (
            <div className="text-sm text-red-600">
              <p className="mb-2">The database needs new columns. In Supabase Dashboard → SQL Editor, run:</p>
              <pre className="p-3 bg-white rounded border border-red-100 text-xs overflow-x-auto">
{`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS site_phone text,
  ADD COLUMN IF NOT EXISTS site_email text,
  ADD COLUMN IF NOT EXISTS site_address text,
  ADD COLUMN IF NOT EXISTS site_whatsapp text;`}
              </pre>
            </div>
          ) : (
            errorDetail && <p className="text-xs text-red-600 font-mono">{errorDetail}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save site contact"}
      </button>
    </form>
  );
}
