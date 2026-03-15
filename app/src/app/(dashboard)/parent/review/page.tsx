"use client";

import { useState, useEffect } from "react";

type PendingInstance = {
  id: string;
  timeSpentSeconds: number | null;
  proofPhotoUrl: string | null;
  completedAt: string;
  chore: { title: string; dollarValue: number };
  claimedBy: { name: string; avatarId: number } | null;
};

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

export default function ReviewPage() {
  const [pending, setPending] = useState<PendingInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chore-instances?status=SUBMITTED")
      .then((r) => r.json())
      .then((data) => {
        setPending(Array.isArray(data) ? data.filter((i: PendingInstance & { status: string }) => i.status === "SUBMITTED") : []);
        setLoading(false);
      });
  }, []);

  async function handleAction(instanceId: string, action: string, bonusAmount?: number) {
    await fetch("/api/chore-instances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId, action, bonusAmount }),
    });
    setPending(pending.filter((p) => p.id !== instanceId));
  }

  function formatTime(seconds: number | null) {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        {pending.length > 1 && (
          <button
            onClick={() => pending.forEach((p) => handleAction(p.id, "approve"))}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Approve All ({pending.length})
          </button>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">✅</p>
          <p className="mt-4 text-lg font-medium text-gray-600">All caught up! Nothing to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((instance) => (
            <div key={instance.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {AVATARS[(instance.claimedBy?.avatarId || 1) - 1]}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{instance.chore.title}</h3>
                    <p className="text-sm text-gray-500">
                      {instance.claimedBy?.name} &middot; Time: {formatTime(instance.timeSpentSeconds)} &middot; ${instance.chore.dollarValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAction(instance.id, "approve")}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(instance.id, "approve", 1)}
                  className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Approve + $1 Bonus
                </button>
                <button
                  onClick={() => handleAction(instance.id, "redo")}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Redo
                </button>
                <button
                  onClick={() => handleAction(instance.id, "reject")}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
