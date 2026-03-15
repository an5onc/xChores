"use client";

import { useState, useEffect } from "react";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type Child = { id: string; name: string; avatarId: number; age?: number };

export default function FamilyPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);

  useEffect(() => {
    fetch("/api/family/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children || []))
      .catch(() => {});
  }, []);

  async function addChild(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        age: form.get("age"),
        avatarId: selectedAvatar,
        pin: form.get("pin"),
      }),
    });
    if (res.ok) {
      const child = await res.json();
      setChildren([...children, child]);
      setShowAdd(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add Child
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addChild} className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Add a Child</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input name="name" required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input name="age" type="number" min="1" max="18" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">4-Digit PIN</label>
              <input name="pin" required pattern="[0-9]{4}" maxLength={4} placeholder="1234" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Choose Avatar</label>
            <div className="mt-2 grid grid-cols-8 gap-2">
              {AVATARS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(i + 1)}
                  className={`rounded-xl p-3 text-3xl transition ${
                    selectedAvatar === i + 1
                      ? "bg-sky-100 ring-2 ring-sky-500"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Add Child</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg px-6 py-3 text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div key={child.id} className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
            <span className="text-5xl">{AVATARS[child.avatarId - 1] || "🧒"}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
              {child.age && <p className="text-sm text-gray-500">Age {child.age}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
