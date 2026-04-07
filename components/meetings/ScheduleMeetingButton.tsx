"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, X, Calendar } from "lucide-react";

export default function ScheduleMeetingButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "Destination discussion",
    scheduledAt: "",
    duration: 30,
    meetingUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: field === "duration" ? Number(e.target.value) : e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/trips/${tripId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          meetingUrl: form.meetingUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to schedule meeting.");
        return;
      }
      setOpen(false);
      setForm({ title: "Destination discussion", scheduledAt: "", duration: 30, meetingUrl: "" });
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        <Video className="w-4 h-4" />
        Schedule a meeting
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                Schedule meeting
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={set("title")} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.scheduledAt}
                    onChange={set("scheduledAt")}
                    required
                  />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <select className="input" value={form.duration} onChange={set("duration")}>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Meeting URL <span className="text-gray-400">(optional)</span></label>
                <input
                  className="input"
                  placeholder="https://meet.google.com/..."
                  value={form.meetingUrl}
                  onChange={set("meetingUrl")}
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Scheduling…" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
