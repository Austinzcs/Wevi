"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function AddDestinationForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", country: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/trips/${tripId}/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to add destination.");
    } else {
      setForm({ name: "", country: "", description: "" });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">City / Place *</label>
          <input className="input" placeholder="e.g. Tokyo" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="label">Country</label>
          <input className="input" placeholder="e.g. Japan" value={form.country} onChange={set("country")} />
        </div>
      </div>
      <div>
        <label className="label">Why do you want to go?</label>
        <textarea className="input resize-none" rows={2} placeholder="Cherry blossoms, amazing food…" value={form.description} onChange={set("description")} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary text-sm">
        <Plus className="w-4 h-4" />
        {loading ? "Adding…" : "Add suggestion"}
      </button>
    </form>
  );
}
