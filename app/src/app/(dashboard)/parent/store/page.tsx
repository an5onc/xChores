"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, BounceOnTap } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type StoreItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
};

type Purchase = {
  id: string;
  status: string;
  createdAt: string;
  parentNote: string | null;
  storeItem: { name: string; price: number };
  user: { id: string; name: string; avatarId: number };
};

export default function ParentStorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/store").then((r) => r.json()),
      fetch("/api/store/purchases").then((r) => r.json()),
    ]).then(([itemData, purchaseData]) => {
      setItems(Array.isArray(itemData) ? itemData : []);
      setPurchases(Array.isArray(purchaseData) ? purchaseData : []);
      setLoading(false);
    });
  }, []);

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        price: form.get("price"),
        description: form.get("description") || undefined,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems([item, ...items]);
      setShowAdd(false);
    }
  }

  async function toggleActive(itemId: string, isActive: boolean) {
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, isActive: !isActive }),
    });
    if (res.ok) {
      setItems(items.map((i) => (i.id === itemId ? { ...i, isActive: !isActive } : i)));
    }
  }

  async function handlePurchase(purchaseId: string, action: "approve" | "reject") {
    setActing(purchaseId);
    const res = await fetch("/api/store/purchases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, action }),
    });
    if (res.ok) {
      setPurchases(
        purchases.map((p) =>
          p.id === purchaseId
            ? { ...p, status: action === "approve" ? "APPROVED" : "REJECTED" }
            : p
        )
      );
    }
    setActing(null);
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">🛍️</div>;

  const pending = purchases.filter((p) => p.status === "PENDING");
  const resolved = purchases.filter((p) => p.status !== "PENDING");

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Family Store</h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            {showAdd ? "Cancel" : "+ Add Item"}
          </button>
        </div>
      </FadeIn>

      {showAdd && (
        <FadeIn>
          <form onSubmit={addItem} className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
            <input
              name="name"
              required
              placeholder="Item name (e.g., Movie Night, Ice Cream Trip)"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
            />
            <input
              name="price"
              type="number"
              step="0.25"
              min="0.25"
              required
              placeholder="Price ($)"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
            />
            <input
              name="description"
              placeholder="Description (optional)"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-400"
            />
            <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
              Add to Store
            </button>
          </form>
        </FadeIn>
      )}

      {/* Pending Purchase Requests */}
      {pending.length > 0 && (
        <>
          <FadeIn delay={0.1}>
            <h2 className="text-lg font-bold text-gray-800">Pending Requests ({pending.length})</h2>
          </FadeIn>
          <StaggerContainer className="space-y-3" delay={0.15}>
            {pending.map((p) => (
              <StaggerItem key={p.id}>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{p.storeItem.name}</p>
                      <p className="text-sm text-gray-500">
                        {AVATARS[p.user.avatarId - 1]} {p.user.name} · ${p.storeItem.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <BounceOnTap>
                        <button
                          onClick={() => handlePurchase(p.id, "approve")}
                          disabled={acting === p.id}
                          className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </BounceOnTap>
                      <BounceOnTap>
                        <button
                          onClick={() => handlePurchase(p.id, "reject")}
                          disabled={acting === p.id}
                          className="rounded-xl bg-red-100 px-4 py-2 font-bold text-red-600 hover:bg-red-200 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </BounceOnTap>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      )}

      {/* Store Items */}
      <FadeIn delay={0.2}>
        <h2 className="text-lg font-bold text-gray-800">Store Items</h2>
      </FadeIn>

      {items.length === 0 ? (
        <FadeIn delay={0.25}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🛍️</p>
            <p className="mt-3 text-gray-500">No items yet. Add rewards for your kids to work toward!</p>
          </div>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" delay={0.25}>
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <div className={`rounded-2xl bg-white p-5 shadow-sm ${!item.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    <p className="mt-1 text-lg font-bold text-emerald-600">${item.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      item.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Resolved purchases */}
      {resolved.length > 0 && (
        <FadeIn delay={0.3}>
          <h2 className="text-lg font-bold text-gray-800">Purchase History</h2>
          <div className="mt-2 space-y-2">
            {resolved.slice(0, 20).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{p.storeItem.name}</p>
                  <p className="text-sm text-gray-500">{AVATARS[p.user.avatarId - 1]} {p.user.name}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {p.status === "APPROVED" ? "Purchased" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
