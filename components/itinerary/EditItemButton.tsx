"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save, Trash2 } from "lucide-react";
import type { ItineraryItem } from "@prisma/client";

export default function EditItemButton({ item }: { item: ItineraryItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: item.title,
    description: item.description ?? "",
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Frontend validation
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      setError("Start time must be before end time.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/itinerary/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save changes.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/itinerary/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit activity</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-3">{error}</p>}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={set("title")} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start</label>
                  <input type="time" className="input" value={form.startTime} onChange={set("startTime")} />
                </div>
                <div>
                  <label className="label">End</label>
                  <input type="time" className="input" value={form.endTime} onChange={set("endTime")} />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={set("location")} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={set("description")} />
              </div>
              <div className="flex gap-3 justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-secondary text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    <Save className="w-4 h-4" />
                    {loading ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
