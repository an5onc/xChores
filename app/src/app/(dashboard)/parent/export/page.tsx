"use client";

import { useState } from "react";
import { FadeIn, BounceOnTap, StaggerContainer, StaggerItem } from "@/components/shared/animations";

type KidSummary = {
  name: string;
  choresCompleted: number;
  totalEarnings: number;
  totalBonuses: number;
  totalSaved: number;
  totalSpent: number;
  totalInvested: number;
  totalMatured: number;
  totalMatched: number;
  netEarnings: number;
};

export default function ParentExportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<{ year: number; kids: KidSummary[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    const res = await fetch(`/api/export/annual?year=${year}&format=json`);
    if (res.ok) {
      setReport(await res.json());
    }
    setLoading(false);
  }

  function downloadCSV() {
    window.open(`/api/export/annual?year=${year}&format=csv`, "_blank");
  }

  function downloadLedger() {
    window.open(`/api/export?format=csv`, "_blank");
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">Export & Reports</h1>
        <p className="text-sm text-gray-500">Download annual summaries and transaction history.</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Annual Summary</h2>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="mt-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <BounceOnTap>
              <button
                onClick={loadReport}
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "View Report"}
              </button>
            </BounceOnTap>
            <BounceOnTap>
              <button
                onClick={downloadCSV}
                className="rounded-xl bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-600"
              >
                Download CSV
              </button>
            </BounceOnTap>
          </div>
        </div>
      </FadeIn>

      {/* Quick exports */}
      <FadeIn delay={0.15}>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Quick Exports</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <BounceOnTap>
              <button onClick={downloadLedger} className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50">
                Full Transaction Ledger (CSV)
              </button>
            </BounceOnTap>
            <BounceOnTap>
              <button onClick={downloadCSV} className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50">
                Annual Summary (CSV)
              </button>
            </BounceOnTap>
          </div>
        </div>
      </FadeIn>

      {/* Report display */}
      {report && (
        <StaggerContainer className="space-y-4" delay={0.2}>
          <StaggerItem>
            <h2 className="text-lg font-bold text-gray-900">{report.year} Summary</h2>
          </StaggerItem>
          {report.kids.map((kid) => (
            <StaggerItem key={kid.name}>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">{kid.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">{kid.choresCompleted}</p>
                    <p className="text-xs text-emerald-600">Chores</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">${kid.totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-emerald-600">Earned</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 text-center">
                    <p className="text-xl font-bold text-sky-700">${kid.totalSaved.toFixed(2)}</p>
                    <p className="text-xs text-sky-600">Saved</p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3 text-center">
                    <p className="text-xl font-bold text-purple-700">${kid.totalInvested.toFixed(2)}</p>
                    <p className="text-xs text-purple-600">Invested</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-xl font-bold text-amber-700">${kid.totalBonuses.toFixed(2)}</p>
                    <p className="text-xs text-amber-600">Bonuses</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-center">
                    <p className="text-xl font-bold text-rose-700">${kid.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-rose-600">Spent</p>
                  </div>
                  <div className="rounded-xl bg-teal-50 p-3 text-center">
                    <p className="text-xl font-bold text-teal-700">${kid.totalMatched.toFixed(2)}</p>
                    <p className="text-xs text-teal-600">Matched</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-xl font-bold text-gray-700">${kid.netEarnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Net Total</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
