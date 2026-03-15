"use client";

import { useState, useEffect } from "react";

type Wallet = {
  id: string;
  availableBalance: number;
  savedBalance: number;
  investedBalance: number;
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }[];
};

type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};

export default function KidWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionAmount, setDecisionAmount] = useState(0);
  const [spendAmount, setSpendAmount] = useState(0);
  const [saveAmount, setSaveAmount] = useState(0);
  const [investAmount, setInvestAmount] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [lockDays, setLockDays] = useState(7);

  useEffect(() => {
    fetch("/api/wallet").then((r) => r.json()).then(setWallet);
    fetch("/api/savings-goals").then((r) => r.json()).then((d) => setGoals(Array.isArray(d) ? d.filter((g: SavingsGoal & { isCompleted?: boolean }) => !g.isCompleted) : []));
  }, []);

  function openDecision() {
    if (!wallet || wallet.availableBalance <= 0) return;
    setDecisionAmount(wallet.availableBalance);
    setSpendAmount(wallet.availableBalance);
    setSaveAmount(0);
    setInvestAmount(0);
    setShowDecision(true);
  }

  async function submitDecision() {
    const total = spendAmount + saveAmount + investAmount;
    if (Math.abs(total - decisionAmount) > 0.01) {
      alert("Amounts must add up to your total!");
      return;
    }

    const body: Record<string, unknown> = { spendAmount, saveAmount, investAmount };
    if (saveAmount > 0) body.savingsGoalId = selectedGoal;
    if (investAmount > 0) body.lockDays = lockDays;

    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setWallet({ ...wallet!, ...updated });
      setShowDecision(false);
      // Refresh full wallet
      fetch("/api/wallet").then((r) => r.json()).then(setWallet);
    }
  }

  const typeEmoji: Record<string, string> = {
    EARNING: "💰",
    SAVING: "🏦",
    SPENDING: "🛒",
    INVESTMENT: "🌱",
    MATURATION: "🌳",
    BONUS: "⭐",
    MATCH: "🤝",
  };

  if (!wallet) return <div className="py-12 text-center text-4xl">⏳</div>;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Available</p>
        <p className="text-5xl font-bold">${wallet.availableBalance.toFixed(2)}</p>
        <div className="mt-3 flex justify-center gap-6 text-sm opacity-80">
          <span>🏦 Saved: ${wallet.savedBalance.toFixed(2)}</span>
          <span>🌱 Invested: ${wallet.investedBalance.toFixed(2)}</span>
        </div>
        {wallet.availableBalance > 0 && (
          <button
            onClick={openDecision}
            className="mt-4 rounded-xl bg-white/20 px-6 py-3 font-bold backdrop-blur transition hover:bg-white/30"
          >
            Decide What To Do With My Money
          </button>
        )}
      </div>

      {/* Decision Point Modal */}
      {showDecision && (
        <div className="rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-lg">
          <h2 className="text-center text-xl font-bold text-gray-900">
            What do you want to do with ${decisionAmount.toFixed(2)}?
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <label className="flex items-center justify-between text-sm font-bold text-gray-700">
                <span>💵 Keep to Spend</span>
                <span>${spendAmount.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max={decisionAmount}
                step="0.25"
                value={spendAmount}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSpendAmount(v);
                  const remaining = decisionAmount - v;
                  setSaveAmount(Math.min(saveAmount, remaining));
                  setInvestAmount(remaining - Math.min(saveAmount, remaining));
                }}
                className="mt-2 w-full"
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <label className="flex items-center justify-between text-sm font-bold text-blue-700">
                <span>🏦 Save for a Goal</span>
                <span>${saveAmount.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max={decisionAmount - spendAmount}
                step="0.25"
                value={saveAmount}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSaveAmount(v);
                  setInvestAmount(decisionAmount - spendAmount - v);
                }}
                className="mt-2 w-full"
              />
              {saveAmount > 0 && goals.length > 0 && (
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-blue-200 p-2 text-sm text-gray-900"
                >
                  <option value="">Pick a goal...</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} (${g.currentAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-xl bg-purple-50 p-4">
              <label className="flex items-center justify-between text-sm font-bold text-purple-700">
                <span>🌱 Invest (grow it!)</span>
                <span>${investAmount.toFixed(2)}</span>
              </label>
              <p className="mt-1 text-xs text-purple-500">
                Lock your money and your parent will decide how much it grows!
              </p>
              {investAmount > 0 && (
                <div className="mt-2 flex gap-2">
                  {[
                    { days: 7, label: "1 Week" },
                    { days: 14, label: "2 Weeks" },
                    { days: 30, label: "1 Month" },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setLockDays(opt.days)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        lockDays === opt.days
                          ? "bg-purple-600 text-white"
                          : "bg-white text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={submitDecision}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white hover:bg-emerald-700 active:scale-95"
            >
              Confirm!
            </button>
            <button
              onClick={() => setShowDecision(false)}
              className="rounded-xl px-6 py-3 text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        <div className="mt-4 space-y-2">
          {wallet.transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeEmoji[t.type] || "💰"}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
              </span>
            </div>
          ))}
          {wallet.transactions.length === 0 && (
            <p className="py-4 text-center text-gray-500">No transactions yet. Complete a chore to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}
