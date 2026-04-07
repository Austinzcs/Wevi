"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function CreateTripButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create trip");
      setLoading(false);
      return;
    }

    const { trip } = await res.json();
    setOpen(false);
    setForm({ title: "", description: "" });
    router.push(`/trips/${trip.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        New trip
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Create a new trip</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}
              <div>
                <label className="label">Trip name *</label>
                <input
                  className="input"
                  placeholder="e.g. Tokyo Summer 2025"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="label">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="What's this trip about?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Creating…" : "Create trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
