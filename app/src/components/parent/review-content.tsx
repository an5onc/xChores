"use client";

import { useState, useCallback } from "react";
import { CelebrationOverlay } from "@/components/shared/celebration-overlay";
import {
  useRewardToasts,
  RewardToastContainer,
} from "@/components/shared/reward-toast";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PendingInstance = {
  id: string;
  timeSpentSeconds: number | null;
  proofPhotoUrl: string | null;
  completedAt: string;
  chore: { title: string; dollarValue: number };
  claimedBy: { name: string; avatarId: number } | null;
};

interface ReviewContentProps {
  initialInstances: PendingInstance[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATARS = [
  "\u{1F981}", "\u{1F42F}", "\u{1F43B}", "\u{1F43C}", "\u{1F98A}", "\u{1F430}", "\u{1F438}", "\u{1F435}",
  "\u{1F984}", "\u{1F432}", "\u{1F98B}", "\u{1F422}", "\u{1F42C}", "\u{1F99C}", "\u{1F436}", "\u{1F431}",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getChildName(instance: PendingInstance): string {
  return instance.claimedBy?.name ?? "Unknown";
}

function getAvatar(instance: PendingInstance): string {
  return AVATARS[(instance.claimedBy?.avatarId ?? 1) - 1] ?? "\u{1F981}";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CelebrationState = {
  show: boolean;
  message: string;
  emoji: string;
};

export function ReviewContent({ initialInstances }: ReviewContentProps) {
  const [pending, setPending] = useState<PendingInstance[]>(initialInstances);
  const [celebration, setCelebration] = useState<CelebrationState>({
    show: false,
    message: "",
    emoji: "\u{1F389}",
  });
  const { toasts, addToast, dismissToast } = useRewardToasts();

  const dismissCelebration = useCallback(() => {
    setCelebration((prev) => ({ ...prev, show: false }));
  }, []);

  async function handleAction(
    instance: PendingInstance,
    action: string,
    bonusAmount?: number,
  ) {
    const res = await fetch("/api/chore-instances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId: instance.id, action, bonusAmount }),
    });

    if (!res.ok) return;

    // Remove from the pending list
    setPending((prev) => prev.filter((p) => p.id !== instance.id));

    const childName = getChildName(instance);

    if (action === "approve") {
      const total = instance.chore.dollarValue + (bonusAmount ?? 0);

      // Show full-screen celebration for approval
      setCelebration({
        show: true,
        message: `${childName} earned $${total.toFixed(2)}!`,
        emoji: "\u{1F389}",
      });

      // If there's a bonus, also fire a toast
      if (bonusAmount && bonusAmount > 0) {
        addToast({
          emoji: "\u2B50",
          message: `+$${bonusAmount.toFixed(2)} bonus for ${childName}!`,
        });
      }
    }
  }

  async function handleApproveAll() {
    // Process all approvals in parallel
    const promises = pending.map((p) =>
      fetch("/api/chore-instances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: p.id, action: "approve" }),
      }),
    );
    await Promise.all(promises);

    // Show celebration for bulk approval
    const totalEarned = pending.reduce(
      (sum, p) => sum + p.chore.dollarValue,
      0,
    );
    setCelebration({
      show: true,
      message: `All approved! $${totalEarned.toFixed(2)} earned!`,
      emoji: "\u{1F389}",
    });

    setPending([]);
  }

  return (
    <>
      <CelebrationOverlay
        show={celebration.show}
        onDismiss={dismissCelebration}
        message={celebration.message}
        emoji={celebration.emoji}
      />
      <RewardToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
            {pending.length > 1 && (
              <button
                onClick={handleApproveAll}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Approve All ({pending.length})
              </button>
            )}
          </div>
        </FadeIn>

        {pending.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <p className="text-5xl">{"\u2705"}</p>
              <p className="mt-4 text-lg font-medium text-gray-600">
                All caught up! Nothing to review.
              </p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="space-y-4" delay={0.1}>
            {pending.map((instance) => (
              <StaggerItem key={instance.id}>
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getAvatar(instance)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {instance.chore.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getChildName(instance)} &middot; Time:{" "}
                          {formatTime(instance.timeSpentSeconds)} &middot; $
                          {instance.chore.dollarValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction(instance, "approve")}
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(instance, "approve", 1)}
                      className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                      Approve + $1 Bonus
                    </button>
                    <button
                      onClick={() => handleAction(instance, "redo")}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Redo
                    </button>
                    <button
                      onClick={() => handleAction(instance, "reject")}
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </>
  );
}
