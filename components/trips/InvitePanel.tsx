"use client";

import { useState } from "react";
import { Mail, Plus } from "lucide-react";

export default function InvitePanel({ tripId }: { tripId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/trips/${tripId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to send invite.");
    } else {
      setSuccess(`Invitation sent to ${email}!`);
      setEmail("");
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" /> Invite friends
      </h3>
      <form onSubmit={handleInvite} className="space-y-3">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
        {success && <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2">{success}</p>}
        <input
          type="email"
          className="input text-sm"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-2">
          <Plus className="w-4 h-4" />
          {loading ? "Sending…" : "Send invite"}
        </button>
      </form>
    </div>
  );
}
