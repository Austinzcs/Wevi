"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LeaveTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this trip? You can be re-invited later."))
      return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/trips/${tripId}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to leave trip.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleLeave}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
      >
        <LogOut className="w-3 h-3" />
        {loading ? "Leaving…" : "Leave trip"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
