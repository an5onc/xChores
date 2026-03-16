"use client";

import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePolling } from "@/hooks/use-polling";

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

const statusColor: Record<string, string> = {
  AVAILABLE: "bg-gray-600",
  CLAIMED: "bg-yellow-600",
  IN_PROGRESS: "bg-blue-600",
  SUBMITTED: "bg-orange-600",
  APPROVED: "bg-green-600",
};

export default function TVDashboard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, error } = usePolling<TVData>({
    url: `/api/tv/${token}`,
    interval: 10000,
  });

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

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold">
            {data.familyName}{" "}
            <span className="text-emerald-400">xChores</span>
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-gray-400">
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p>
              Live &middot; Updated {new Date(data.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        </motion.div>

        {/* Family Members */}
        <div className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {data.members.map((member, i) => (
            <motion.div
              key={member.id}
              className="rounded-2xl bg-gray-800 p-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-6xl">{AVATARS[member.avatarId - 1] || "🧒"}</span>
              <h3 className="mt-3 text-xl font-bold">{member.name}</h3>
              <motion.p
                key={member.wallet?.availableBalance}
                className="mt-2 text-3xl font-bold text-emerald-400"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                ${member.wallet?.availableBalance.toFixed(2) || "0.00"}
              </motion.p>
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
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Today's Chores */}
          <motion.div
            className="rounded-2xl bg-gray-800 p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold">Today&apos;s Chores</h2>
            <div className="mt-4 space-y-3">
              {data.todayChores.length === 0 ? (
                <p className="text-gray-400">No chores today yet.</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {data.todayChores.map((c) => (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between rounded-xl bg-gray-700 p-4"
                    >
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="rounded-2xl bg-gray-800 p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {data.recentTransactions.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between rounded-xl bg-gray-700 p-4"
                  >
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-gray-400">
                        {AVATARS[t.wallet.user.avatarId - 1]} {t.wallet.user.name}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">
                      +${t.amount.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
