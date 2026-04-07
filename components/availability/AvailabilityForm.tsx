"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Availability } from "@prisma/client";

interface Props {
  tripId: string;
  existing: Availability | null;
}

function toInputValue(date: Date | null) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export default function AvailabilityForm({ tripId, existing }: Props) {
  const router = useRouter();
  const [startTime, setStartTime] = useState(toInputValue(existing?.startTime ?? null));
  const [endTime, setEndTime] = useState(toInputValue(existing?.endTime ?? null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Frontend validation
    if (!startTime || !endTime) {
      setError("Please fill in both start and end times.");
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      setError("Start time must be before end time.");
      return;
    }
    if (start < new Date()) {
      setError("Start time cannot be in the past.");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/trips/${tripId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save availability.");
    } else {
      setSuccess("Availability saved!");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{success}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Available from</label>
          <input
            type="datetime-local"
            className="input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Available until</label>
          <input
            type="datetime-local"
            className="input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : existing ? "Update availability" : "Submit availability"}
      </button>
    </form>
  );
}
