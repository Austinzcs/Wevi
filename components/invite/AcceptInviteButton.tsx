"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function AcceptInviteButton({ token, tripId }: { token: string; tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/invite/${token}`, { method: "POST" });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to accept invitation.");
      setLoading(false);
    } else {
      router.push(`/trips/${tripId}`);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="btn-primary w-full justify-center py-3"
      >
        <CheckCircle2 className="w-5 h-5" />
        {loading ? "Joining…" : "Accept & join trip"}
      </button>
    </div>
  );
}
