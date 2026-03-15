import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

export default async function KidDashboard() {
  const session = await auth();
  const userId = session!.user.id;
  const avatarId = session!.user.avatarId;

  const [wallet, activeChores, savingsGoals, investments] = await Promise.all([
    db.wallet.findUnique({ where: { userId } }),
    db.choreInstance.findMany({
      where: {
        OR: [
          { claimedById: userId, status: { in: ["CLAIMED", "IN_PROGRESS"] } },
          { status: "AVAILABLE", assignedToId: null },
          { status: "AVAILABLE", assignedToId: userId },
        ],
      },
      include: { chore: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.savingsGoal.findMany({
      where: { userId, isCompleted: false },
    }),
    db.investment.findMany({
      where: { userId, status: "ACTIVE" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-6xl">{AVATARS[avatarId - 1] || "🧒"}</span>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Hi, {session!.user.name}!
        </h1>
      </div>

      {/* Wallet Summary */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Your Money</p>
        <p className="mt-1 text-5xl font-bold">
          ${wallet?.availableBalance.toFixed(2) || "0.00"}
        </p>
        <div className="mt-3 flex gap-6 text-sm opacity-80">
          <span>Saved: ${wallet?.savedBalance.toFixed(2) || "0.00"}</span>
          <span>Invested: ${wallet?.investedBalance.toFixed(2) || "0.00"}</span>
        </div>
        <Link
          href="/kid/wallet"
          className="mt-4 inline-block rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
        >
          View Wallet
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/kid/chores"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <span className="text-3xl">📋</span>
          <span className="text-sm font-bold text-gray-700">Chores</span>
        </Link>
        <Link
          href="/kid/savings"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <span className="text-3xl">🎯</span>
          <span className="text-sm font-bold text-gray-700">Goals</span>
        </Link>
        <Link
          href="/kid/investments"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <span className="text-3xl">🌱</span>
          <span className="text-sm font-bold text-gray-700">Invest</span>
        </Link>
      </div>

      {/* Available Chores */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Your Chores</h2>
          <Link href="/kid/chores" className="text-sm text-emerald-600 hover:underline">
            See all
          </Link>
        </div>
        {activeChores.length === 0 ? (
          <p className="mt-4 text-center text-gray-500">No chores right now. Check back later!</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activeChores.map((instance: typeof activeChores[number]) => (
              <div
                key={instance.id}
                className="flex items-center justify-between rounded-xl border-2 border-gray-100 p-4"
              >
                <div>
                  <p className="font-bold text-gray-900">{instance.chore.title}</p>
                  <p className="text-sm text-gray-500">
                    {instance.chore.difficulty === "EASY" ? "⭐" : instance.chore.difficulty === "MEDIUM" ? "⭐⭐" : "⭐⭐⭐"}
                    {instance.chore.estimatedMinutes ? ` ~${instance.chore.estimatedMinutes}min` : ""}
                  </p>
                </div>
                <span className="text-xl font-bold text-emerald-600">
                  ${instance.chore.dollarValue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Savings Goals</h2>
          <div className="mt-4 space-y-3">
            {savingsGoals.map((goal: typeof savingsGoals[number]) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">{goal.name}</p>
                    <p className="text-sm text-gray-500">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Investments */}
      {investments.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Growing Investments</h2>
          <div className="mt-4 space-y-3">
            {investments.map((inv: typeof investments[number]) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl border border-purple-100 bg-purple-50 p-4">
                <div>
                  <p className="font-bold text-purple-900">🌱 ${inv.principalAmount.toFixed(2)}</p>
                  <p className="text-sm text-purple-600">
                    Matures {new Date(inv.maturationDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium text-purple-600">Growing...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
