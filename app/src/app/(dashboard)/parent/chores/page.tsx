"use client";

import { useState, useEffect } from "react";
import {
  FadeIn,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/animations";

type Chore = {
  id: string;
  title: string;
  description: string | null;
  dollarValue: number;
  estimatedMinutes: number | null;
  difficulty: string;
  recurrence: string;
  isActive: boolean;
  assignedTo: { id: string; name: string } | null;
};

type FamilyMember = { id: string; name: string };

export default function ManageChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);

  useEffect(() => {
    fetch("/api/chores").then((r) => r.json()).then(setChores);
    fetch("/api/family/children").then((r) => r.json()).then((d) => setChildren(d.children || [])).catch(() => {});
  }, []);

  async function createChore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const chore = await res.json();
      setChores([chore, ...chores]);
      setShowForm(false);
      setQuickAdd(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Chores</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setQuickAdd(true); setShowForm(false); }}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
            >
              Quick Add
            </button>
            <button
              onClick={() => { setShowForm(true); setQuickAdd(false); }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Full Chore
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Quick Add Form */}
      {quickAdd && (
        <ScaleIn>
          <form onSubmit={createChore} className="rounded-2xl bg-sky-50 p-6">
            <h3 className="text-lg font-bold text-gray-900">Quick Add Task</h3>
            <div className="mt-4 flex gap-3">
              <input
                name="title"
                required
                placeholder="Task name"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
              <input
                name="dollarValue"
                type="number"
                step="0.25"
                min="0"
                required
                placeholder="$"
                className="w-24 rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-600"
              >
                Add
              </button>
            </div>
          </form>
        </ScaleIn>
      )}

      {/* Full Chore Form */}
      {showForm && (
        <FadeIn>
          <form onSubmit={createChore} className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Create Chore</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input name="title" required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dollar Value</label>
                <input name="dollarValue" type="number" step="0.25" min="0" required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Minutes</label>
                <input name="estimatedMinutes" type="number" min="1" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select name="difficulty" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Recurrence</label>
                <select name="recurrence" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900">
                  <option value="ONCE">One-time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select name="assignedToId" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900">
                  <option value="">Open (any kid)</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-6 py-3 text-gray-600 hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        </FadeIn>
      )}

      {/* Chore List */}
      <StaggerContainer className="space-y-3" delay={0.1}>
        {chores.map((chore) => (
          <StaggerItem key={chore.id}>
            <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <h3 className="font-bold text-gray-900">{chore.title}</h3>
                <p className="text-sm text-gray-500">
                  {chore.difficulty} &middot; {chore.recurrence} &middot;
                  {chore.estimatedMinutes ? ` ~${chore.estimatedMinutes}min` : ""} &middot;
                  {chore.assignedTo ? ` ${chore.assignedTo.name}` : " Open"}
                </p>
              </div>
              <span className="text-xl font-bold text-emerald-600">${chore.dollarValue.toFixed(2)}</span>
            </div>
          </StaggerItem>
        ))}
        {chores.length === 0 && (
          <StaggerItem>
            <p className="py-12 text-center text-gray-500">No chores yet. Create your first one above!</p>
          </StaggerItem>
        )}
      </StaggerContainer>
    </div>
  );
}
