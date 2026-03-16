"use client";

import Link from "next/link";
import {
  FadeIn,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  BalanceChange,
  GrowingPlant,
} from "@/components/shared/animations";

// ---------------------------------------------------------------------------
// Props (serializable data passed from the server component)
// ---------------------------------------------------------------------------

interface ChoreInstanceData {
  id: string;
  chore: {
    title: string;
    dollarValue: number;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    estimatedMinutes: number | null;
  };
}

interface SavingsGoalData {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
}

interface InvestmentData {
  id: string;
  principalAmount: number;
  maturationDate: string; // ISO string (serialized from Date)
}

interface KidDashboardContentProps {
  userName: string;
  avatarEmoji: string;
  wallet: {
    availableBalance: number;
    savedBalance: number;
    investedBalance: number;
  } | null;
  activeChores: ChoreInstanceData[];
  savingsGoals: SavingsGoalData[];
  investments: InvestmentData[];
}

export function KidDashboardContent({
  userName,
  avatarEmoji,
  wallet,
  activeChores,
  savingsGoals,
  investments,
}: KidDashboardContentProps) {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="text-center">
          <span className="text-6xl">{avatarEmoji}</span>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Hi, {userName}!
          </h1>
        </div>
      </FadeIn>

      {/* Wallet Summary */}
      <FadeIn delay={0.1}>
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">Your Money</p>
          <p className="mt-1 text-5xl font-bold">
            <BalanceChange value={wallet?.availableBalance ?? 0} />
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
      </FadeIn>

      {/* Quick Actions */}
      <StaggerContainer className="grid grid-cols-3 gap-3" delay={0.2}>
        <StaggerItem>
          <ScaleIn>
            <Link
              href="/kid/chores"
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl">📋</span>
              <span className="text-sm font-bold text-gray-700">Chores</span>
            </Link>
          </ScaleIn>
        </StaggerItem>
        <StaggerItem>
          <ScaleIn delay={0.05}>
            <Link
              href="/kid/savings"
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl">🎯</span>
              <span className="text-sm font-bold text-gray-700">Goals</span>
            </Link>
          </ScaleIn>
        </StaggerItem>
        <StaggerItem>
          <ScaleIn delay={0.1}>
            <Link
              href="/kid/investments"
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl">🌱</span>
              <span className="text-sm font-bold text-gray-700">Invest</span>
            </Link>
          </ScaleIn>
        </StaggerItem>
      </StaggerContainer>

      {/* Available Chores */}
      <FadeIn delay={0.3}>
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
            <StaggerContainer className="mt-4 space-y-3" delay={0.35}>
              {activeChores.map((instance) => (
                <StaggerItem key={instance.id}>
                  <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 p-4">
                    <div>
                      <p className="font-bold text-gray-900">{instance.chore.title}</p>
                      <p className="text-sm text-gray-500">
                        {instance.chore.difficulty === "EASY"
                          ? "⭐"
                          : instance.chore.difficulty === "MEDIUM"
                            ? "⭐⭐"
                            : "⭐⭐⭐"}
                        {instance.chore.estimatedMinutes
                          ? ` ~${instance.chore.estimatedMinutes}min`
                          : ""}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">
                      ${instance.chore.dollarValue.toFixed(2)}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </FadeIn>

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <FadeIn delay={0.4}>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Savings Goals</h2>
            <StaggerContainer className="mt-4 space-y-3" delay={0.45}>
              {savingsGoals.map((goal) => {
                const progress = Math.min(
                  (goal.currentAmount / goal.targetAmount) * 100,
                  100,
                );
                return (
                  <StaggerItem key={goal.id}>
                    <div className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900">{goal.name}</p>
                        <p className="text-sm text-gray-500">
                          ${goal.currentAmount.toFixed(2)} / $
                          {goal.targetAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}

      {/* Active Investments */}
      {investments.length > 0 && (
        <FadeIn delay={0.5}>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Growing Investments</h2>
            <StaggerContainer className="mt-4 space-y-3" delay={0.55}>
              {investments.map((inv, i) => (
                <StaggerItem key={inv.id}>
                  <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-purple-50 p-4">
                    <div>
                      <p className="font-bold text-purple-900">
                        <GrowingPlant delay={0.6 + i * 0.1} />{" "}
                        ${inv.principalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-purple-600">
                        Matures{" "}
                        {new Date(inv.maturationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-purple-600">
                      Growing...
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
