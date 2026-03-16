"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BounceOnTap } from "@/components/shared/animations";
import { ChoreTimer } from "@/components/kid/chore-timer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChoreStatus =
  | "AVAILABLE"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "REDO";

export interface ChoreInstanceData {
  id: string;
  status: ChoreStatus;
  startedAt: string | null;
  completedAt: string | null;
  timeSpentSeconds: number | null;
  claimedBy: { id: string; name: string; avatarId: number | null } | null;
  chore: {
    title: string;
    description: string | null;
    dollarValue: number;
    estimatedMinutes: number | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  };
}

interface ChoreCardProps {
  instance: ChoreInstanceData;
  /** Current user ID, needed for the PATCH body */
  userId: string;
  /** Called after a successful action so the parent can refresh / update state */
  onUpdate?: (updated: ChoreInstanceData) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_STARS: Record<string, string> = {
  EASY: "⭐",
  MEDIUM: "⭐⭐",
  HARD: "⭐⭐⭐",
};

/** Border / background combos per status group */
const STATUS_STYLES: Record<
  string,
  { border: string; bg: string; badge: string; badgeText: string }
> = {
  AVAILABLE: {
    border: "border-gray-200",
    bg: "bg-white",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  CLAIMED: {
    border: "border-sky-200",
    bg: "bg-sky-50",
    badge: "bg-sky-100",
    badgeText: "text-sky-700",
  },
  IN_PROGRESS: {
    border: "border-sky-300",
    bg: "bg-sky-50",
    badge: "bg-sky-100",
    badgeText: "text-sky-700",
  },
  SUBMITTED: {
    border: "border-orange-200",
    bg: "bg-orange-50",
    badge: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  APPROVED: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  REJECTED: {
    border: "border-red-200",
    bg: "bg-red-50",
    badge: "bg-red-100",
    badgeText: "text-red-700",
  },
  REDO: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    badge: "bg-amber-100",
    badgeText: "text-amber-700",
  },
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  CLAIMED: "Claimed",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Waiting for Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REDO: "Redo Requested",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChoreCard({
  instance,
  userId,
  onUpdate,
  className,
}: ChoreCardProps) {
  const [optimistic, setOptimistic] = useState<ChoreInstanceData>(instance);
  const [loading, setLoading] = useState(false);

  // Keep in sync if parent passes new data
  // (e.g., from a refetch or websocket update)
  if (instance.id === optimistic.id && instance.status !== optimistic.status) {
    setOptimistic(instance);
  }

  const { chore } = optimistic;
  const styles = STATUS_STYLES[optimistic.status] ?? STATUS_STYLES.AVAILABLE;

  // ------ Action handler with optimistic update ------
  const handleAction = useCallback(
    async (action: string) => {
      if (loading) return;
      setLoading(true);

      // Build optimistic next state
      const now = new Date().toISOString();
      let nextStatus: ChoreStatus = optimistic.status;
      let nextStartedAt = optimistic.startedAt;

      switch (action) {
        case "claim":
          nextStatus = "CLAIMED";
          break;
        case "start":
          nextStatus = "IN_PROGRESS";
          nextStartedAt = now;
          break;
        case "submit":
          nextStatus = "SUBMITTED";
          break;
      }

      const optimisticInstance: ChoreInstanceData = {
        ...optimistic,
        status: nextStatus,
        startedAt: nextStartedAt,
      };
      setOptimistic(optimisticInstance);

      try {
        const body: Record<string, unknown> = { instanceId: optimistic.id, action, userId };

        // Calculate elapsed seconds when submitting
        if (action === "submit" && optimistic.startedAt) {
          body.timeSpentSeconds = Math.floor(
            (Date.now() - new Date(optimistic.startedAt).getTime()) / 1000,
          );
        }

        const res = await fetch("/api/chore-instances", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const updated = await res.json();
          const merged: ChoreInstanceData = { ...optimistic, ...updated };
          setOptimistic(merged);
          onUpdate?.(merged);
        } else {
          // Revert optimistic update on error
          setOptimistic(instance);
        }
      } catch {
        // Revert on network failure
        setOptimistic(instance);
      } finally {
        setLoading(false);
      }
    },
    [loading, optimistic, instance, userId, onUpdate],
  );

  return (
    <motion.div
      layout
      className={`rounded-2xl border-2 p-5 shadow-sm transition-colors ${styles.border} ${styles.bg} ${className ?? ""}`}
    >
      {/* Header row: title + dollar value */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-gray-900">
            {chore.title}
          </h3>

          {chore.description && optimistic.status === "AVAILABLE" && (
            <p className="mt-1 text-sm leading-snug text-gray-500">
              {chore.description}
            </p>
          )}

          {/* Meta: difficulty, estimate, status badge */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">{DIFFICULTY_STARS[chore.difficulty]}</span>

            {chore.estimatedMinutes != null && (
              <span className="text-gray-400">
                ~{chore.estimatedMinutes}min
              </span>
            )}

            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge} ${styles.badgeText}`}
            >
              {STATUS_LABELS[optimistic.status]}
            </span>
          </div>
        </div>

        <span className="flex-shrink-0 text-2xl font-bold text-emerald-600">
          ${chore.dollarValue.toFixed(2)}
        </span>
      </div>

      {/* Timer (shown when IN_PROGRESS) */}
      <AnimatePresence>
        {optimistic.status === "IN_PROGRESS" && optimistic.startedAt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <ChoreTimer
              startedAt={optimistic.startedAt}
              estimatedMinutes={chore.estimatedMinutes}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {optimistic.status === "AVAILABLE" && (
          <BounceOnTap>
            <button
              onClick={() => handleAction("claim")}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
            >
              Claim!
            </button>
          </BounceOnTap>
        )}

        {optimistic.status === "CLAIMED" && (
          <BounceOnTap>
            <button
              onClick={() => handleAction("start")}
              disabled={loading}
              className="rounded-xl bg-sky-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
            >
              Start
            </button>
          </BounceOnTap>
        )}

        {optimistic.status === "IN_PROGRESS" && (
          <BounceOnTap>
            <button
              onClick={() => handleAction("submit")}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
            >
              I'm Done!
            </button>
          </BounceOnTap>
        )}

        {optimistic.status === "SUBMITTED" && (
          <p className="py-2 text-sm font-medium text-orange-600">
            Waiting for parent review...
          </p>
        )}

        {optimistic.status === "REDO" && (
          <BounceOnTap>
            <button
              onClick={() => handleAction("start")}
              disabled={loading}
              className="rounded-xl bg-amber-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
            >
              Try Again
            </button>
          </BounceOnTap>
        )}

        {optimistic.status === "APPROVED" && (
          <p className="py-2 text-sm font-medium text-emerald-600">
            Great job!
          </p>
        )}
      </div>
    </motion.div>
  );
}
