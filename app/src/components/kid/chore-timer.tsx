"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// ChoreTimer - live elapsed timer with circular progress ring
// ---------------------------------------------------------------------------

interface ChoreTimerProps {
  /** ISO date string for when the chore was started */
  startedAt: string;
  /** Expected duration in minutes (null = no estimate, hides progress ring) */
  estimatedMinutes: number | null;
  className?: string;
}

/** How far through the estimate we are (0..1+). >1 means overtime. */
function getProgress(elapsedSeconds: number, estimatedMinutes: number): number {
  const estimatedSeconds = estimatedMinutes * 60;
  return estimatedSeconds > 0 ? elapsedSeconds / estimatedSeconds : 0;
}

/** Pick a color tier based on how far through the estimate we are. */
function getTimerColor(progress: number): {
  text: string;
  ring: string;
  ringTrack: string;
  dot: string;
} {
  if (progress <= 0.75) {
    return {
      text: "text-emerald-600",
      ring: "stroke-emerald-500",
      ringTrack: "stroke-emerald-100",
      dot: "bg-emerald-500",
    };
  }
  if (progress <= 1) {
    return {
      text: "text-amber-600",
      ring: "stroke-amber-500",
      ringTrack: "stroke-amber-100",
      dot: "bg-amber-500",
    };
  }
  return {
    text: "text-red-600",
    ring: "stroke-red-500",
    ringTrack: "stroke-red-100",
    dot: "bg-red-500",
  };
}

function formatElapsed(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// SVG ring constants
const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ChoreTimer({
  startedAt,
  estimatedMinutes,
  className,
}: ChoreTimerProps) {
  const startTime = useMemo(() => new Date(startedAt).getTime(), [startedAt]);

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startTime) / 1000)),
  );

  // Tick every second
  useEffect(() => {
    // Immediately sync in case component re-mounted
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));

    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startTime) / 1000)),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const hasEstimate = estimatedMinutes != null && estimatedMinutes > 0;
  const progress = hasEstimate ? getProgress(elapsedSeconds, estimatedMinutes) : 0;
  const colors = hasEstimate
    ? getTimerColor(progress)
    : {
        text: "text-sky-600",
        ring: "stroke-sky-500",
        ringTrack: "stroke-sky-100",
        dot: "bg-sky-500",
      };

  // dashoffset controls how much of the ring is "filled"
  const clampedProgress = Math.min(progress, 1);
  const dashOffset = CIRCUMFERENCE * (1 - clampedProgress);

  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
      role="timer"
      aria-label={`Elapsed time: ${formatElapsed(elapsedSeconds)}`}
    >
      {/* Circular progress ring (only when we have an estimate) */}
      {hasEstimate ? (
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              className={colors.ringTrack}
            />
            {/* Progress */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              className={colors.ring}
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>

          {/* Centered elapsed time inside the ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-base font-bold tabular-nums ${colors.text}`}
            >
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>
      ) : (
        /* No estimate: just show the time large */
        <span
          className={`text-3xl font-bold tabular-nums tracking-tight ${colors.text}`}
        >
          {formatElapsed(elapsedSeconds)}
        </span>
      )}

      {/* Pulsing active dot */}
      <motion.div
        className={`h-2.5 w-2.5 rounded-full ${colors.dot}`}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Overtime label */}
      {hasEstimate && progress > 1 && (
        <motion.span
          className="text-xs font-semibold text-red-500"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          Overtime!
        </motion.span>
      )}
    </div>
  );
}
