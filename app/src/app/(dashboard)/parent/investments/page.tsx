"use client";

import { useState, useEffect } from "react";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type Investment = {
  id: string;
  principalAmount: number;
  lockDays: number;
  maturationDate: string;
  status: string;
  returnAmount: number | null;
  user: { id: string; name: string; avatarId: number };
};

export default function ParentInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/investments").then((r) => r.json()).then((data) => {
      setInvestments(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  async function setReturn(investmentId: string) {
    const input = prompt("Enter the return amount (e.g., the original was $5, return $7.50):");
    if (!input) return;

    const returnAmount = parseFloat(input);
    if (isNaN(returnAmount)) return;

    const note = prompt("Add a note for your kid (optional):") || "";

    const res = await fetch("/api/investments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investmentId, returnAmount, parentNote: note }),
    });

    if (res.ok) {
      setInvestments(investments.map((i) =>
        i.id === investmentId ? { ...i, status: "MATURED", returnAmount } : i
      ));
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;

  const active = investments.filter((i) => i.status === "ACTIVE");
  const matured = investments.filter((i) => i.status === "MATURED");
  const ready = active.filter((i) => new Date(i.maturationDate) <= new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Investments</h1>

      {ready.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-800">Ready for Payout ({ready.length})</h2>
          <div className="mt-4 space-y-3">
            {ready.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{AVATARS[inv.user.avatarId - 1]}</span>
                  <div>
                    <p className="font-bold text-gray-900">{inv.user.name}</p>
                    <p className="text-sm text-gray-500">
                      Invested ${inv.principalAmount.toFixed(2)} for {inv.lockDays} days
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReturn(inv.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Set Return
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Active Investments</h2>
          <div className="mt-4 space-y-3">
            {active.filter((i) => new Date(i.maturationDate) > new Date()).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[inv.user.avatarId - 1]}</span>
                  <div>
                    <p className="font-medium text-gray-900">{inv.user.name}</p>
                    <p className="text-sm text-gray-500">
                      ${inv.principalAmount.toFixed(2)} &middot; {inv.lockDays} days &middot; Matures {new Date(inv.maturationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600">Growing...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {matured.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Past Investments</h2>
          <div className="mt-4 space-y-3">
            {matured.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[inv.user.avatarId - 1]}</span>
                  <div>
                    <p className="font-medium text-gray-900">{inv.user.name}</p>
                    <p className="text-sm text-gray-500">
                      Invested ${inv.principalAmount.toFixed(2)} → Returned ${inv.returnAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-emerald-600">Paid Out</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {investments.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">🌱</p>
          <p className="mt-4 text-lg text-gray-500">No investments yet. Kids can invest from their wallet!</p>
        </div>
      )}
    </div>
  );
}
