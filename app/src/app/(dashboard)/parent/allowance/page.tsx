"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, BounceOnTap } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Kid = { id: string; name: string; avatarId: number };
type AllowanceRule = {
  id: string;
  userId: string;
  amount: number;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  isActive: boolean;
  lastPaidAt: string | null;
  user: Kid;
};

export default function ParentAllowancePage() {
  const [rules, setRules] = useState<AllowanceRule[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/allowance").then((r) => r.json()),
      fetch("/api/family/children").then((r) => r.json()),
    ]).then(([ruleData, kidData]) => {
      setRules(Array.isArray(ruleData) ? ruleData : []);
      setKids(Array.isArray(kidData) ? kidData : []);
      setLoading(false);
    });
  }, []);

  async function addRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/allowance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.get("userId"),
        amount: form.get("amount"),
        frequency: form.get("frequency"),
        dayOfWeek: form.get("frequency") === "WEEKLY" ? parseInt(form.get("dayOfWeek") as string) : undefined,
        dayOfMonth: form.get("frequency") === "MONTHLY" ? parseInt(form.get("dayOfMonth") as string) : undefined,
      }),
    });
    if (res.ok) {
      const rule = await res.json();
      setRules([rule, ...rules]);
      setShowAdd(false);
    }
  }

  async function toggleRule(ruleId: string, isActive: boolean) {
    const res = await fetch("/api/allowance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, isActive: !isActive }),
    });
    if (res.ok) {
      setRules(rules.map((r) => (r.id === ruleId ? { ...r, isActive: !isActive } : r)));
    }
  }

  async function processNow() {
    setProcessing(true);
    const res = await fetch("/api/allowance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process" }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Processed ${data.processed} allowance${data.processed !== 1 ? "s" : ""}!`);
      // Refresh rules to update lastPaidAt
      const updated = await fetch("/api/allowance").then((r) => r.json());
      setRules(Array.isArray(updated) ? updated : []);
    }
    setProcessing(false);
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">💸</div>;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Allowances</h1>
            <p className="text-sm text-gray-500">Set up automatic weekly or monthly allowances for your kids.</p>
          </div>
          <div className="flex gap-2">
            <BounceOnTap>
              <button
                onClick={processNow}
                disabled={processing}
                className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>
            </BounceOnTap>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              {showAdd ? "Cancel" : "+ Add Rule"}
            </button>
          </div>
        </div>
      </FadeIn>

      {showAdd && (
        <FadeIn>
          <form onSubmit={addRule} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <select name="userId" required className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900">
              <option value="">Select a child...</option>
              {kids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {AVATARS[kid.avatarId - 1]} {kid.name}
                </option>
              ))}
            </select>
            <input name="amount" type="number" step="0.25" min="0.25" required placeholder="Amount ($)" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400" />
            <select name="frequency" required className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <select name="dayOfWeek" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900">
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
            <select name="dayOfMonth" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900">
              {Array.from({ length: 28 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
              Create Allowance
            </button>
          </form>
        </FadeIn>
      )}

      {rules.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-5xl">💸</p>
            <p className="mt-3 text-gray-500">No allowance rules yet. Set up automatic payments for your kids!</p>
          </div>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" delay={0.1}>
          {rules.map((rule) => (
            <StaggerItem key={rule.id}>
              <div className={`rounded-2xl bg-white p-5 shadow-sm ${!rule.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{AVATARS[rule.user.avatarId - 1] || "🧒"}</span>
                    <div>
                      <p className="font-bold text-gray-900">{rule.user.name}</p>
                      <p className="text-sm text-gray-500">
                        ${rule.amount.toFixed(2)} · {rule.frequency === "WEEKLY" ? `Every ${DAYS[rule.dayOfWeek ?? 0]}` : `Monthly on the ${rule.dayOfMonth ?? 1}${["st","nd","rd"][((rule.dayOfMonth ?? 1) - 1) % 10] || "th"}`}
                      </p>
                      {rule.lastPaidAt && (
                        <p className="text-xs text-gray-400">
                          Last paid: {new Date(rule.lastPaidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id, rule.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      rule.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Paused"}
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
