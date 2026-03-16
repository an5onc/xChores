"use client";

import { useState, useEffect } from "react";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/animations";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  wallet: { user: { name: string } };
};

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/export?type=transactions&format=json")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  function exportCSV(type: string) {
    window.open(`/api/export?type=${type}&format=csv`, "_blank");
  }

  const typeColors: Record<string, string> = {
    EARNING: "bg-green-100 text-green-700",
    SAVING: "bg-blue-100 text-blue-700",
    SPENDING: "bg-red-100 text-red-700",
    INVESTMENT: "bg-purple-100 text-purple-700",
    MATURATION: "bg-amber-100 text-amber-700",
    BONUS: "bg-yellow-100 text-yellow-700",
    MATCH: "bg-cyan-100 text-cyan-700",
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header + Export Buttons */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Family Ledger</h1>
          <div className="flex gap-2">
            <button onClick={() => exportCSV("transactions")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Export Transactions CSV
            </button>
            <button onClick={() => exportCSV("chores")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Export Chores CSV
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Transaction Rows */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-white shadow-sm">
          <StaggerContainer className="divide-y divide-gray-100" delay={0.05}>
            {transactions.map((t) => (
              <StaggerItem key={t.id}>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeColors[t.type] || "bg-gray-100 text-gray-600"}`}>
                      {t.type}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{t.description}</p>
                      <p className="text-xs text-gray-500">
                        {t.wallet?.user?.name} &middot; {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              </StaggerItem>
            ))}
            {transactions.length === 0 && (
              <StaggerItem>
                <p className="py-12 text-center text-gray-500">No transactions yet.</p>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </FadeIn>
    </div>
  );
}
