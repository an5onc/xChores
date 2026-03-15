"use client";

import { useState, useEffect, useRef } from "react";

type ChoreInstance = {
  id: string;
  status: string;
  startedAt: string | null;
  timeSpentSeconds: number | null;
  chore: {
    title: string;
    description: string | null;
    dollarValue: number;
    estimatedMinutes: number | null;
    difficulty: string;
  };
};

export default function KidChoresPage() {
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    fetch("/api/chore-instances")
      .then((r) => r.json())
      .then((data) => {
        setInstances(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function handleAction(instanceId: string, action: string) {
    const body: Record<string, unknown> = { instanceId, action };
    if (action === "submit") body.timeSpentSeconds = timerSeconds;

    const res = await fetch("/api/chore-instances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setInstances(instances.map((i) => (i.id === instanceId ? { ...i, ...updated } : i)));

      if (action === "start") {
        setActiveTimer(instanceId);
        setTimerSeconds(0);
        timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
      }

      if (action === "submit") {
        if (timerRef.current) clearInterval(timerRef.current);
        setActiveTimer(null);
        setTimerSeconds(0);
      }
    }
  }

  function formatTime(s: number) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  const difficultyStars = (d: string) =>
    d === "EASY" ? "⭐" : d === "MEDIUM" ? "⭐⭐" : "⭐⭐⭐";

  if (loading) return <div className="py-12 text-center text-4xl">⏳</div>;

  const available = instances.filter((i) => i.status === "AVAILABLE");
  const claimed = instances.filter((i) => ["CLAIMED", "IN_PROGRESS"].includes(i.status));
  const submitted = instances.filter((i) => i.status === "SUBMITTED");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Chores</h1>

      {/* Active / In Progress */}
      {claimed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-sky-600">In Progress</h2>
          {claimed.map((instance) => (
            <div key={instance.id} className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{instance.chore.title}</h3>
                  <p className="text-sm text-gray-500">
                    {difficultyStars(instance.chore.difficulty)} &middot; ${instance.chore.dollarValue.toFixed(2)}
                  </p>
                </div>
                {activeTimer === instance.id && (
                  <div className="text-3xl font-bold font-mono text-sky-600">
                    {formatTime(timerSeconds)}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {instance.status === "CLAIMED" && (
                  <button
                    onClick={() => handleAction(instance.id, "start")}
                    className="rounded-xl bg-sky-500 px-6 py-3 text-lg font-bold text-white hover:bg-sky-600 active:scale-95"
                  >
                    ▶ Start Timer
                  </button>
                )}
                {instance.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleAction(instance.id, "submit")}
                    className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-bold text-white hover:bg-emerald-600 active:scale-95"
                  >
                    ✅ Done!
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submitted / Waiting */}
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-orange-600">Waiting for Approval</h2>
          {submitted.map((instance) => (
            <div key={instance.id} className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5">
              <h3 className="font-bold text-gray-900">{instance.chore.title}</h3>
              <p className="text-sm text-orange-600">
                Submitted! Waiting for parent review... ⏳
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Available */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-emerald-600">Available Chores</h2>
        {available.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-lg text-gray-500">No chores available right now!</p>
          </div>
        ) : (
          available.map((instance) => (
            <div key={instance.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{instance.chore.title}</h3>
                  {instance.chore.description && (
                    <p className="mt-1 text-sm text-gray-500">{instance.chore.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-400">
                    {difficultyStars(instance.chore.difficulty)}
                    {instance.chore.estimatedMinutes ? ` ~${instance.chore.estimatedMinutes}min` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-2xl font-bold text-emerald-600">
                    ${instance.chore.dollarValue.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAction(instance.id, "claim")}
                    className="rounded-xl bg-emerald-500 px-5 py-2 font-bold text-white hover:bg-emerald-600 active:scale-95"
                  >
                    Claim!
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
