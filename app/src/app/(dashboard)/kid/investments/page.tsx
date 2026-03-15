"use client";

import { useState, useEffect } from "react";

type Investment = {
  id: string;
  principalAmount: number;
  lockDays: number;
  maturationDate: string;
  status: string;
  returnAmount: number | null;
  parentNote: string | null;
  createdAt: string;
};

export default function KidInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/investments").then((r) => r.json()).then((data) => {
      setInvestments(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-12 text-center text-4xl">⏳</div>;

  const active = investments.filter((i) => i.status === "ACTIVE");
  const matured = investments.filter((i) => i.status === "MATURED");

  function daysRemaining(date: string) {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Investments</h1>
      <p className="text-gray-500">
        Invest your money and watch it grow! Go to your{" "}
        <a href="/kid/wallet" className="text-emerald-600 underline">wallet</a>{" "}
        to invest.
      </p>

      {/* Active Investments */}
      {active.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-purple-600">🌱 Growing</h2>
          {active.map((inv) => {
            const remaining = daysRemaining(inv.maturationDate);
            const elapsed = inv.lockDays - remaining;
            const progress = Math.min((elapsed / inv.lockDays) * 100, 100);

            return (
              <div key={inv.id} className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      ${inv.principalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-purple-600">
                      Locked for {inv.lockDays} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl">🌱</p>
                    <p className="text-sm font-medium text-purple-600">
                      {remaining > 0 ? `${remaining} days left` : "Ready!"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matured Investments */}
      {matured.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-600">🌳 Harvested</h2>
          {matured.map((inv) => (
            <div key={inv.id} className="rounded-2xl bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-green-900">
                    Invested ${inv.principalAmount.toFixed(2)} → Got ${inv.returnAmount?.toFixed(2)}!
                  </p>
                  {inv.parentNote && (
                    <p className="mt-1 text-sm text-green-600">
                      &quot;{inv.parentNote}&quot;
                    </p>
                  )}
                </div>
                <span className="text-3xl">🌳</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {investments.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-6xl">🌱</p>
          <p className="mt-4 text-xl font-bold text-gray-900">Plant Your Money!</p>
          <p className="mt-2 text-gray-500">
            Invest from your wallet and your parent will decide how much it grows.
            The longer you wait, the more you could earn!
          </p>
        </div>
      )}
    </div>
  );
}
