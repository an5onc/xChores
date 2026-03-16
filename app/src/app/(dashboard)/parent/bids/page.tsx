"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, BounceOnTap } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type Bid = {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; avatarId: number };
  choreInstance: {
    id: string;
    chore: { title: string; dollarValue: number };
  };
};

export default function ParentBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chore-bids")
      .then((r) => r.json())
      .then((data) => {
        setBids(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function handleBid(bidId: string, action: "accept" | "reject") {
    setActing(bidId);
    const res = await fetch("/api/chore-bids", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bidId, action }),
    });
    if (res.ok) {
      setBids((prev) =>
        prev.map((b) => {
          if (b.id === bidId) return { ...b, status: action === "accept" ? "ACCEPTED" : "REJECTED" };
          // If accepted, reject other pending bids on same instance
          const targetBid = bids.find((x) => x.id === bidId);
          if (action === "accept" && targetBid && b.choreInstance.id === targetBid.choreInstance.id && b.status === "PENDING") {
            return { ...b, status: "REJECTED" };
          }
          return b;
        })
      );
    }
    setActing(null);
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">🏷️</div>;

  const pending = bids.filter((b) => b.status === "PENDING");
  const resolved = bids.filter((b) => b.status !== "PENDING");

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">Chore Bids</h1>
        <p className="text-sm text-gray-500">Review offers from your kids on available chores.</p>
      </FadeIn>

      {pending.length === 0 && resolved.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🏷️</p>
            <p className="mt-3 text-gray-500">No bids yet. Kids can make offers on available chores.</p>
          </div>
        </FadeIn>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <FadeIn delay={0.1}>
                <h2 className="text-lg font-bold text-gray-800">Pending Bids ({pending.length})</h2>
              </FadeIn>
              <StaggerContainer className="space-y-3" delay={0.15}>
                {pending.map((bid) => (
                  <StaggerItem key={bid.id}>
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{bid.choreInstance.chore.title}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-xl">{AVATARS[bid.user.avatarId - 1] || "🧒"}</span>
                            <span>{bid.user.name}</span>
                          </div>
                          {bid.message && (
                            <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600 italic">
                              &ldquo;{bid.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400 line-through">
                            ${bid.choreInstance.chore.dollarValue.toFixed(2)}
                          </p>
                          <p className="text-xl font-bold text-emerald-600">
                            ${bid.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {bid.amount >= bid.choreInstance.chore.dollarValue ? "at or above" : "below"} listed
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <BounceOnTap>
                          <button
                            onClick={() => handleBid(bid.id, "accept")}
                            disabled={acting === bid.id}
                            className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                          >
                            Accept
                          </button>
                        </BounceOnTap>
                        <BounceOnTap>
                          <button
                            onClick={() => handleBid(bid.id, "reject")}
                            disabled={acting === bid.id}
                            className="rounded-xl bg-red-100 px-5 py-2.5 font-bold text-red-600 hover:bg-red-200 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </BounceOnTap>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}

          {resolved.length > 0 && (
            <FadeIn delay={0.2}>
              <h2 className="text-lg font-bold text-gray-800">Resolved</h2>
              <div className="mt-2 space-y-2">
                {resolved.slice(0, 20).map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <div>
                      <p className="font-medium text-gray-900">{bid.choreInstance.chore.title}</p>
                      <p className="text-sm text-gray-500">
                        {AVATARS[bid.user.avatarId - 1]} {bid.user.name} · ${bid.amount.toFixed(2)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      bid.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {bid.status === "ACCEPTED" ? "Accepted" : "Declined"}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
        </>
      )}
    </div>
  );
}
