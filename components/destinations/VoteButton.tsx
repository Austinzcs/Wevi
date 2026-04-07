"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tripId: string;
  destId: string;
  hasVoted: boolean;
  voteCount: number;
}

export default function VoteButton({ tripId, destId, hasVoted, voteCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(hasVoted);
  const [count, setCount] = useState(voteCount);
  const [error, setError] = useState("");

  async function handleVote() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/trips/${tripId}/destinations/${destId}/vote`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Vote failed");
        return;
      }
      const data = await res.json();
      setVoted(data.voted);
      setCount(data.votes);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleVote}
        disabled={loading}
        className={cn(
          "p-1.5 rounded-lg transition-colors disabled:opacity-50",
          voted
            ? "text-white bg-brand-500 hover:bg-brand-600"
            : "text-brand-500 hover:bg-brand-50"
        )}
        title={voted ? "Remove vote" : "Vote"}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-gray-700">{count}</span>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
