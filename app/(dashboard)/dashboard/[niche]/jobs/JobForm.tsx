"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob, type JobInput } from "./job-actions";
import type { Technician } from "./TechniciansSection";

export type JobFormData = {
  id?: string;
  title: string;
  description: string;
  scheduled_at: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  technician_id: string;
  quote_request_id: string;
  quote_id: string;
};

export function JobForm({
  niche,
  userSiteId,
  technicians,
  initialData,
  quoteRequestId,
  quoteId,
}: {
  niche: string;
  userSiteId: string;
  technicians: Technician[];
  initialData?: Partial<JobFormData>;
  quoteRequestId?: string;
  quoteId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduled_at ? formatDateTimeLocal(initialData.scheduled_at) : ""
  );
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [customerName, setCustomerName] = useState(
    initialData?.customer_name ?? ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialData?.customer_phone ?? ""
  );
  const [technicianId, setTechnicianId] = useState(
    initialData?.technician_id ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const dt = scheduledAt
      ? new Date(scheduledAt).toISOString()
      : new Date().toISOString();
    if (isNaN(new Date(dt).getTime())) {
      setError("Invalid date/time");
      return;
    }

    setError(null);
    setSaving(true);

    const data: JobInput = {
      user_site_id: userSiteId,
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_at: dt,
      address: address.trim() || undefined,
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      technician_id: technicianId || null,
      quote_request_id: quoteRequestId ?? initialData?.quote_request_id ?? null,
      quote_id: quoteId ?? initialData?.quote_id ?? null,
    };

    const result = isEdit
      ? await updateJob(niche, initialData!.id!, data)
      : await createJob(niche, data);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/${niche}/jobs`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Burst pipe repair"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scheduled date & time *
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer phone
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign technician
        </label>
        <select
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        >
          <option value="">None</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update job" : "Create job"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
