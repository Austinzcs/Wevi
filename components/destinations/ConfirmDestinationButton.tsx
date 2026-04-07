"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface Props {
  tripId: string;
  destination: string;
  country: string;
}

export default function ConfirmDestinationButton({ tripId, destination, country }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!confirm(`Confirm "${destination}" as the trip destination?`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, country, status: "ITINERARY" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to confirm destination.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="btn-secondary text-xs py-1 px-2"
        title="Confirm this destination"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        {loading ? "…" : "Confirm"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 max-w-[120px]">{error}</p>}
    </div>
  );
}
