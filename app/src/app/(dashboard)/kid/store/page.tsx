"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, BounceOnTap } from "@/components/shared/animations";

type StoreItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

type Purchase = {
  id: string;
  status: string;
  createdAt: string;
  storeItem: StoreItem;
};

type Wallet = {
  availableBalance: number;
};

export default function KidStorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/store").then((r) => r.json()),
      fetch("/api/store/purchases").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
    ]).then(([itemData, purchaseData, walletData]) => {
      setItems(Array.isArray(itemData) ? itemData : []);
      setPurchases(Array.isArray(purchaseData) ? purchaseData : []);
      setWallet(walletData?.availableBalance !== undefined ? walletData : null);
      setLoading(false);
    });
  }, []);

  async function requestPurchase(itemId: string) {
    setRequesting(itemId);
    const res = await fetch("/api/store/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeItemId: itemId }),
    });
    if (res.ok) {
      const purchase = await res.json();
      setPurchases([purchase, ...purchases]);
    }
    setRequesting(null);
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">🛍️</div>;

  const balance = wallet?.availableBalance ?? 0;
  const pendingItemIds = new Set(
    purchases.filter((p) => p.status === "PENDING").map((p) => p.storeItem.id)
  );

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <div className="rounded-xl bg-emerald-50 px-4 py-2">
            <span className="text-sm text-gray-500">Balance: </span>
            <span className="text-lg font-bold text-emerald-600">${balance.toFixed(2)}</span>
          </div>
        </div>
      </FadeIn>

      {items.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-5xl">🛍️</p>
            <p className="mt-3 text-gray-500">The store is empty right now. Ask your parents to add items!</p>
          </div>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2" delay={0.1}>
          {items.map((item) => {
            const canAfford = balance >= item.price;
            const hasPending = pendingItemIds.has(item.id);
            return (
              <StaggerItem key={item.id}>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{item.imageUrl ? "📦" : "🎁"}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                      )}
                      <p className="mt-2 text-xl font-bold text-emerald-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {hasPending ? (
                      <p className="rounded-xl bg-sky-50 px-4 py-2.5 text-center text-sm font-medium text-sky-600">
                        Request pending...
                      </p>
                    ) : (
                      <BounceOnTap>
                        <button
                          onClick={() => requestPurchase(item.id)}
                          disabled={!canAfford || requesting === item.id}
                          className={`w-full rounded-xl px-4 py-2.5 font-bold text-white transition disabled:opacity-50 ${
                            canAfford
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {!canAfford ? "Not enough $" : requesting === item.id ? "Requesting..." : "I Want This!"}
                        </button>
                      </BounceOnTap>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {/* Purchase History */}
      {purchases.length > 0 && (
        <FadeIn delay={0.2}>
          <h2 className="text-lg font-bold text-gray-800">My Requests</h2>
          <div className="mt-2 space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{p.storeItem.name}</p>
                  <p className="text-sm text-gray-500">${p.storeItem.price.toFixed(2)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  p.status === "PENDING" ? "bg-sky-100 text-sky-700" :
                  p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {p.status === "PENDING" ? "Pending" : p.status === "APPROVED" ? "Approved!" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
