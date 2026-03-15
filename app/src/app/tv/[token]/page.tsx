"use client";

import { useState, useEffect, use } from "react";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type TVData = {
  familyName: string;
  members: {
    id: string;
    name: string;
    avatarId: number;
    wallet: { availableBalance: number; savedBalance: number; investedBalance: number } | null;
    savingsGoals: { name: string; targetAmount: number; currentAmount: number }[];
    activeInvestments: number;
  }[];
  todayChores: {
    id: string;
    status: string;
    chore: { title: string; dollarValue: number };
    claimedBy: { name: string; avatarId: number } | null;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
    wallet: { user: { name: string; avatarId: number } };
  }[];
  updatedAt: string;
};

export default function TVDashboard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<TVData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    function fetchData() {
      fetch(`/api/tv/${token}`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(setData)
        .catch(() => setError(true));
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-2xl">Invalid dashboard link.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-4xl animate-pulse">Loading...</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    AVAILABLE: "bg-gray-600",
    CLAIMED: "bg-yellow-600",
    IN_PROGRESS: "bg-blue-600",
    SUBMITTED: "bg-orange-600",
    APPROVED: "bg-green-600",
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold">
            {data.familyName}{" "}
            <span className="text-emerald-400">xChores</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Live Dashboard &middot; Updated {new Date(data.updatedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Family Members */}
        <div className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {data.members.map((member) => (
            <div key={member.id} className="rounded-2xl bg-gray-800 p-6 text-center">
              <span className="text-6xl">{AVATARS[member.avatarId - 1] || "🧒"}</span>
              <h3 className="mt-3 text-xl font-bold">{member.name}</h3>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                ${member.wallet?.availableBalance.toFixed(2) || "0.00"}
              </p>
              <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
                <span>Saved: ${member.wallet?.savedBalance.toFixed(2) || "0.00"}</span>
                <span>Invested: ${member.wallet?.investedBalance.toFixed(2) || "0.00"}</span>
              </div>
              {member.savingsGoals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.name} className="mt-3">
                    <p className="text-xs text-gray-400">🎯 {goal.name}</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-700">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Today's Chores */}
          <div className="rounded-2xl bg-gray-800 p-6">
            <h2 className="text-2xl font-bold">Today&apos;s Chores</h2>
            <div className="mt-4 space-y-3">
              {data.todayChores.length === 0 ? (
                <p className="text-gray-400">No chores today yet.</p>
              ) : (
                data.todayChores.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-gray-700 p-4">
                    <div>
                      <p className="font-medium">{c.chore.title}</p>
                      <p className="text-sm text-gray-400">
                        {c.claimedBy ? `${AVATARS[c.claimedBy.avatarId - 1]} ${c.claimedBy.name}` : "Unclaimed"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-400">${c.chore.dollarValue.toFixed(2)}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${statusColor[c.status] || "bg-gray-600"}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl bg-gray-800 p-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-gray-700 p-4">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-gray-400">
                      {AVATARS[t.wallet.user.avatarId - 1]} {t.wallet.user.name}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    +${t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
