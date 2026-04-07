"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, X } from "lucide-react";

interface Props {
  tripId: string;
  hasItinerary: boolean;
}

export default function GenerateItineraryButton({ tripId, hasItinerary }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (hasItinerary) {
      if (!confirm("This will replace the current itinerary and all your edits. Are you sure?")) return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/trips/${tripId}/itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to generate itinerary.");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Sparkles className="w-4 h-4" />
        {hasItinerary ? "Regenerate" : "Generate with AI"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Generate itinerary with AI</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {hasItinerary ? "This will replace the current itinerary." : "Powered by GPT-4o mini."}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <div>
                <label className="label">
                  Preferences <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="e.g. We love street food, prefer walking tours, avoid tourist traps, one person is vegetarian…"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  maxLength={300}
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
