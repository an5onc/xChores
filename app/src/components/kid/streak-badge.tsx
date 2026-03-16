"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreakBadgeProps {
  streak: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStreakColor(streak: number): string {
  if (streak >= 30) return "text-emerald-500";
  if (streak >= 14) return "text-yellow-500";
  if (streak >= 7) return "text-amber-500";
  if (streak >= 3) return "text-orange-500";
  if (streak >= 1) return "text-orange-400";
  return "text-gray-400";
}

function getStreakBgColor(streak: number): string {
  if (streak >= 30) return "bg-emerald-500/10";
  if (streak >= 14) return "bg-yellow-500/10";
  if (streak >= 7) return "bg-amber-500/10";
  if (streak >= 3) return "bg-orange-500/10";
  if (streak >= 1) return "bg-orange-400/10";
  return "bg-gray-400/10";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StreakBadge({ streak }: StreakBadgeProps) {
  const colorClass = getStreakColor(streak);
  const bgClass = getStreakBgColor(streak);
  const shouldPulse = streak >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1.5
        font-semibold text-sm
        ${bgClass} ${colorClass}
        ${shouldPulse ? "animate-pulse" : ""}
      `}
    >
      <motion.span
        animate={
          shouldPulse
            ? {
                scale: [1, 1.2, 1],
              }
            : undefined
        }
        transition={
          shouldPulse
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : undefined
        }
        className="text-base"
        aria-hidden
      >
        {streak > 0 ? "\uD83D\uDD25" : "\u2B50"}
      </motion.span>
      <span>
        {streak === 0
          ? "No streak"
          : `${streak} day${streak === 1 ? "" : "s"}`}
      </span>
    </motion.div>
  );
}
