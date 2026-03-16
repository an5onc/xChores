"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, BounceOnTap } from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type ChoreInstance = {
  id: string;
  status: string;
  chore: {
    title: string;
    dollarValue: number;
    description: string | null;
    difficulty: string;
    estimatedMinutes: number | null;
  };
};

type Bid = {
  id: string;
  choreInstanceId: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
  choreInstance: {
    chore: { title: string; dollarValue: number };
  };
};

export default function KidMarketplacePage() {
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/chore-instances").then((r) => r.json()),
      fetch("/api/chore-bids").then((r) => r.json()),
    ]).then(([instanceData, bidData]) => {
      setInstances(
        (Array.isArray(instanceData) ? instanceData : []).filter(
          (i: ChoreInstance) => i.status === "AVAILABLE"
        )
      );
      setMyBids(Array.isArray(bidData) ? bidData : []);
      setLoading(false);
    });
  }, []);

  async function placeBid(instanceId: string) {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) return;

    const res = await fetch("/api/chore-bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId, bidAmount: amount, message: bidMessage || undefined }),
    });

    if (res.ok) {
      const bid = await res.json();
      setMyBids([bid, ...myBids.filter((b) => b.choreInstanceId !== instanceId)]);
      setBidding(null);
      setBidAmount("");
      setBidMessage("");
    }
  }

  if (loading) return <div className="py-12 text-center text-4xl animate-pulse">🏪</div>;

  const pendingBids = myBids.filter((b) => b.status === "PENDING");
  const resolvedBids = myBids.filter((b) => b.status !== "PENDING");

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">Chore Marketplace</h1>
        <p className="text-sm text-gray-500">
          Make an offer on chores you want to do!
        </p>
      </FadeIn>

      {/* Available Chores */}
      <FadeIn delay={0.1}>
        <h2 className="text-lg font-bold text-gray-800">Available Chores</h2>
      </FadeIn>

      {instances.length === 0 ? (
        <FadeIn delay={0.15}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🏪</p>
            <p className="mt-3 text-gray-500">No chores available right now. Check back later!</p>
          </div>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" delay={0.15}>
          {instances.map((inst) => {
            const myBid = myBids.find(
              (b) => b.choreInstanceId === inst.id && b.status === "PENDING"
            );
            return (
              <StaggerItem key={inst.id}>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{inst.chore.title}</h3>
                      {inst.chore.description && (
                        <p className="mt-1 text-sm text-gray-500">{inst.chore.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                        {inst.chore.estimatedMinutes && <span>~{inst.chore.estimatedMinutes}min</span>}
                        <span className="capitalize">{inst.chore.difficulty.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-600">
                        ${inst.chore.dollarValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">listed price</p>
                    </div>
                  </div>

                  {myBid ? (
                    <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm">
                      <p className="font-medium text-sky-700">
                        Your bid: ${myBid.amount.toFixed(2)}
                      </p>
                      <p className="text-sky-600">Waiting for parent to review...</p>
                    </div>
                  ) : bidding === inst.id ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          placeholder="Your offer ($)"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 text-gray-900 focus:border-emerald-400"
                        />
                        <BounceOnTap>
                          <button
                            onClick={() => placeBid(inst.id)}
                            className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white hover:bg-emerald-600"
                          >
                            Submit
                          </button>
                        </BounceOnTap>
                      </div>
                      <input
                        type="text"
                        placeholder="Why should I pick you? (optional)"
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-400"
                      />
                      <button
                        onClick={() => { setBidding(null); setBidAmount(""); setBidMessage(""); }}
                        className="text-sm text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <BounceOnTap>
                        <button
                          onClick={() => setBidding(inst.id)}
                          className="rounded-xl bg-sky-500 px-5 py-2.5 font-bold text-white hover:bg-sky-600"
                        >
                          Make an Offer
                        </button>
                      </BounceOnTap>
                    </div>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {/* My Pending Bids */}
      {pendingBids.length > 0 && (
        <FadeIn delay={0.2}>
          <h2 className="text-lg font-bold text-gray-800">My Pending Offers</h2>
          <div className="mt-2 space-y-2">
            {pendingBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between rounded-xl bg-sky-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{bid.choreInstance.chore.title}</p>
                  <p className="text-sm text-gray-500">
                    Listed: ${bid.choreInstance.chore.dollarValue.toFixed(2)} · Your offer: ${bid.amount.toFixed(2)}
                  </p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Pending</span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Resolved Bids */}
      {resolvedBids.length > 0 && (
        <FadeIn delay={0.25}>
          <h2 className="text-lg font-bold text-gray-800">Past Offers</h2>
          <div className="mt-2 space-y-2">
            {resolvedBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{bid.choreInstance.chore.title}</p>
                  <p className="text-sm text-gray-500">${bid.amount.toFixed(2)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  bid.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {bid.status === "ACCEPTED" ? "Accepted!" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
