"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function SkipToSchedulingButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSkip() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SCHEDULING" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSkip}
      disabled={loading}
      className="btn-primary text-sm py-1.5 flex items-center gap-1"
    >
      {loading ? "..." : (
        <>
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  );
}
