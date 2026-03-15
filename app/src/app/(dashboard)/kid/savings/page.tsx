"use client";

import { useState, useEffect } from "react";

type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl: string | null;
  parentMatchRate: number | null;
  isCompleted: boolean;
};

export default function KidSavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/savings-goals").then((r) => r.json()).then((data) => {
      setGoals(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  async function createGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/savings-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        targetAmount: form.get("targetAmount"),
      }),
    });
    if (res.ok) {
      const goal = await res.json();
      setGoals([goal, ...goals]);
      setShowCreate(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-4xl">⏳</div>;

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        {active.length < 3 && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            + New Goal
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createGoal} className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">What are you saving for?</h3>
          <div className="mt-4 space-y-3">
            <input
              name="name"
              required
              placeholder="e.g., New Video Game, Lego Set..."
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-lg text-gray-900 focus:border-emerald-400"
            />
            <input
              name="targetAmount"
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="How much does it cost? ($)"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-lg text-gray-900 focus:border-emerald-400"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">Create Goal</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-6 py-3 text-gray-500 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {/* Active Goals */}
      {active.length === 0 && !showCreate ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-5xl">🎯</p>
          <p className="mt-4 text-lg text-gray-500">No savings goals yet. What are you saving for?</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div key={goal.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{goal.name}</h3>
                  <p className="text-lg font-bold text-emerald-600">
                    ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                  </p>
                </div>
                {goal.parentMatchRate && (
                  <p className="mt-1 text-sm text-sky-600">
                    🤝 Parent matching: ${goal.parentMatchRate.toFixed(2)} per $1 you save!
                  </p>
                )}
                <div className="mt-3 h-6 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm text-gray-500">
                  {progress >= 100 ? "🎉 Goal reached!" : `${progress.toFixed(0)}% there!`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900">Completed Goals 🎉</h2>
          <div className="mt-3 space-y-2">
            {completed.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <span className="font-medium text-green-800">{goal.name}</span>
                <span className="font-bold text-green-600">${goal.targetAmount.toFixed(2)} ✅</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
