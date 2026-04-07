"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface Props {
  tripId: string;
  commonStart: string; // ISO string
  commonEnd: string;
}

export default function ConfirmDatesButton({ tripId, commonStart, commonEnd }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!confirm("Confirm these dates as the trip dates? This will advance to destination selection."))
      return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/trips/${tripId}/confirm-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: commonStart,
          endDate: commonEnd,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to confirm dates.");
        return;
      }
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleConfirm} disabled={loading} className="btn-primary text-sm">
        <CheckCircle2 className="w-4 h-4" />
        {loading ? "Confirming…" : "Confirm these dates"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
