"use client";

import { useState, useEffect } from "react";
import { FadeIn, BounceOnTap } from "@/components/shared/animations";

type Settings = {
  maxDailyEarnings: number | null;
  maxSpendingPerDay: number | null;
  investmentApproval: boolean;
  investmentMaxAmount: number | null;
  savingsInterestRate: number | null;
};

export default function ParentSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [processingInterest, setProcessingInterest] = useState(false);

  useEffect(() => {
    fetch("/api/family/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/family/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function processInterest() {
    setProcessingInterest(true);
    const res = await fetch("/api/savings-goals/interest", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(`Applied interest to ${data.processed} savings goal${data.processed !== 1 ? "s" : ""} at ${data.rate}`);
    }
    setProcessingInterest(false);
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">⚙️</div>;
  if (!settings) return null;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">Family Settings</h1>
        <p className="text-sm text-gray-500">Configure limits, controls, and financial rules for your family.</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Earning Limits */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Earning Limits</h2>
            <p className="text-sm text-gray-500 mt-1">Cap how much kids can earn per day from chores.</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Max daily earnings per kid ($)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                placeholder="No limit"
                value={settings.maxDailyEarnings ?? ""}
                onChange={(e) => setSettings({ ...settings, maxDailyEarnings: e.target.value ? parseFloat(e.target.value) : null })}
                className="mt-1 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Spending Limits */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Spending Limits</h2>
            <p className="text-sm text-gray-500 mt-1">Limit store spending per day.</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Max spending per kid per day ($)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                placeholder="No limit"
                value={settings.maxSpendingPerDay ?? ""}
                onChange={(e) => setSettings({ ...settings, maxSpendingPerDay: e.target.value ? parseFloat(e.target.value) : null })}
                className="mt-1 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Investment Controls */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Investment Controls</h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.investmentApproval}
                  onChange={(e) => setSettings({ ...settings, investmentApproval: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600"
                />
                <span className="text-sm text-gray-700">Require parent approval for all investments</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max investment without approval ($)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="No limit"
                  value={settings.investmentMaxAmount ?? ""}
                  onChange={(e) => setSettings({ ...settings, investmentMaxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Savings Interest */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Savings Interest</h2>
            <p className="text-sm text-gray-500 mt-1">Weekly interest rate applied to savings goal balances. Teaches compound interest.</p>
            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Weekly interest rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  placeholder="2"
                  value={settings.savingsInterestRate ? (settings.savingsInterestRate * 100) : ""}
                  onChange={(e) => setSettings({ ...settings, savingsInterestRate: e.target.value ? parseFloat(e.target.value) / 100 : null })}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
                />
              </div>
              <BounceOnTap>
                <button
                  type="button"
                  onClick={processInterest}
                  disabled={processingInterest}
                  className="rounded-xl bg-sky-500 px-4 py-3 font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {processingInterest ? "Applying..." : "Apply Interest Now"}
                </button>
              </BounceOnTap>
            </div>
          </div>

          <BounceOnTap>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
            </button>
          </BounceOnTap>
        </form>
      </FadeIn>
    </div>
  );
}
