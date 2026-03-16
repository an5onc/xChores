"use client";

import { useState, useEffect, useMemo } from "react";
import { FadeIn } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-gray-200 text-gray-700",
  CLAIMED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-sky-200 text-sky-800",
  SUBMITTED: "bg-orange-100 text-orange-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  REDO: "bg-amber-100 text-amber-700",
};

type ChoreInstance = {
  id: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  chore: { title: string; dollarValue: number };
  claimedBy: { name: string; avatarId: number } | null;
};

export default function ParentCalendarPage() {
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    fetch("/api/chore-instances")
      .then((r) => r.json())
      .then((data) => {
        setInstances(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const dayMap = useMemo(() => {
    const map: Record<string, ChoreInstance[]> = {};
    for (const inst of instances) {
      const dateStr = (inst.dueDate || inst.createdAt).split("T")[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(inst);
    }
    return map;
  }, [instances]);

  const today = new Date().toISOString().split("T")[0];

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">📅</div>;

  return (
    <div className="space-y-4">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Chore Calendar</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100">←</button>
            <span className="min-w-[160px] text-center font-bold text-gray-900">{monthName}</span>
            <button onClick={nextMonth} className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100">→</button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-gray-50 p-1" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayInstances = dayMap[dateStr] || [];
              const isToday = dateStr === today;

              return (
                <div
                  key={day}
                  className={`min-h-[80px] border-b border-r p-1 ${isToday ? "bg-emerald-50" : ""}`}
                >
                  <div className={`text-xs font-medium ${isToday ? "text-emerald-700 font-bold" : "text-gray-500"}`}>
                    {day}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayInstances.slice(0, 3).map((inst) => (
                      <div
                        key={inst.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${STATUS_COLORS[inst.status] || "bg-gray-100"}`}
                        title={`${inst.chore.title} - ${inst.status}${inst.claimedBy ? ` (${inst.claimedBy.name})` : ""}`}
                      >
                        {inst.claimedBy && `${AVATARS[inst.claimedBy.avatarId - 1]} `}
                        {inst.chore.title}
                      </div>
                    ))}
                    {dayInstances.length > 3 && (
                      <p className="text-[10px] text-gray-400">+{dayInstances.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Legend */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className={`rounded-full px-2 py-0.5 ${color}`}>
              {status}
            </span>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
