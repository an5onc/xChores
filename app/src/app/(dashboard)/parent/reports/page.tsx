"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type KidReport = {
  id: string;
  name: string;
  avatarId: number;
  wallet: { availableBalance: number; savedBalance: number; investedBalance: number } | null;
  choresCompleted: number;
  choresPending: number;
  totalEarned: number;
  totalSaved: number;
  totalMatched: number;
  activeInvestments: number;
  newAchievements: { name: string; emoji: string }[];
  savingsGoals: { name: string; targetAmount: number; currentAmount: number }[];
};

type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  familySummary: {
    totalChoresCompleted: number;
    totalEarned: number;
    totalSaved: number;
  };
  kids: KidReport[];
};

export default function ParentReportsPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/weekly")
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">📊</div>;
  if (!report) return <div className="py-12 text-center text-gray-500">Unable to load report.</div>;

  const weekStart = new Date(report.weekStart).toLocaleDateString();
  const weekEnd = new Date(report.weekEnd).toLocaleDateString();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
            <p className="text-sm text-gray-500">{weekStart} — {weekEnd}</p>
          </div>
        </div>
      </FadeIn>

      {/* Family Summary */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-emerald-600">{report.familySummary.totalChoresCompleted}</p>
            <p className="mt-1 text-sm text-gray-500">Chores Done</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-emerald-600">${report.familySummary.totalEarned.toFixed(2)}</p>
            <p className="mt-1 text-sm text-gray-500">Total Earned</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-sky-600">${report.familySummary.totalSaved.toFixed(2)}</p>
            <p className="mt-1 text-sm text-gray-500">Total Saved</p>
          </div>
        </div>
      </FadeIn>

      {/* Per-Kid Reports */}
      <StaggerContainer className="space-y-6" delay={0.2}>
        {report.kids.map((kid) => (
          <StaggerItem key={kid.id}>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{AVATARS[kid.avatarId - 1] || "🧒"}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{kid.name}</h2>
                  <p className="text-sm text-gray-500">
                    Balance: ${kid.wallet?.availableBalance.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{kid.choresCompleted}</p>
                  <p className="text-xs text-emerald-600">Chores Done</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">${kid.totalEarned.toFixed(2)}</p>
                  <p className="text-xs text-emerald-600">Earned</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-3 text-center">
                  <p className="text-2xl font-bold text-sky-700">${kid.totalSaved.toFixed(2)}</p>
                  <p className="text-xs text-sky-600">Saved</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{kid.activeInvestments}</p>
                  <p className="text-xs text-purple-600">Investments</p>
                </div>
              </div>

              {/* Match earnings */}
              {kid.totalMatched > 0 && (
                <p className="mt-3 text-sm text-sky-600">
                  🤝 Parent match earned: ${kid.totalMatched.toFixed(2)}
                </p>
              )}

              {/* Pending chores */}
              {kid.choresPending > 0 && (
                <p className="mt-2 text-sm text-orange-600">
                  ⏳ {kid.choresPending} chore{kid.choresPending > 1 ? "s" : ""} pending review
                </p>
              )}

              {/* Achievements */}
              {kid.newAchievements.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">New Achievements:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {kid.newAchievements.map((a, i) => (
                      <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-sm">
                        {a.emoji} {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings Goals */}
              {kid.savingsGoals.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Savings Progress:</p>
                  <div className="mt-2 space-y-2">
                    {kid.savingsGoals.map((goal, i) => {
                      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{goal.name}</span>
                            <span>${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
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
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
