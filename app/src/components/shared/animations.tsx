"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// FadeIn - fade + slide up on mount
// ---------------------------------------------------------------------------
interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.35,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ScaleIn - scale from 0.8 to 1 on mount
// ---------------------------------------------------------------------------
interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerContainer + StaggerItem - staggered children animations
// ---------------------------------------------------------------------------
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  delay = 0,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// BalanceChange - animated number counter for wallet balances
// ---------------------------------------------------------------------------
interface BalanceChangeProps {
  value: number;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function BalanceChange({
  value,
  prefix = "$",
  className,
  duration = 0.6,
}: BalanceChangeProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(2));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${prefix}${v}`;
      }
    });
    return () => unsubscribe();
  }, [rounded, prefix]);

  return <span ref={nodeRef} className={className}>{prefix}{value.toFixed(2)}</span>;
}

// ---------------------------------------------------------------------------
// Celebration - confetti/sparkle burst (shown on chore approval or goal reached)
// ---------------------------------------------------------------------------
interface CelebrationProps {
  show: boolean;
  className?: string;
}

const sparkles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (360 / 12) * i,
  distance: 40 + Math.random() * 30,
  size: 6 + Math.random() * 6,
  color: ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"][i % 5],
}));

export function Celebration({ show, className }: CelebrationProps) {
  if (!show) return null;

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ""}`}
      initial="hidden"
      animate="visible"
    >
      {sparkles.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        return (
          <motion.div
            key={s.id}
            className="absolute rounded-full"
            style={{
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
            }}
            variants={{
              hidden: { opacity: 1, x: 0, y: 0, scale: 0 },
              visible: {
                opacity: [1, 1, 0],
                x: Math.cos(rad) * s.distance,
                y: Math.sin(rad) * s.distance,
                scale: [0, 1.2, 0],
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
          />
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GrowingPlant - simple animation for investment growth
// ---------------------------------------------------------------------------
interface GrowingPlantProps {
  className?: string;
  delay?: number;
}

export function GrowingPlant({ className, delay = 0 }: GrowingPlantProps) {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
        scale: {
          type: "spring",
          stiffness: 200,
          damping: 12,
          delay,
        },
      }}
      style={{ display: "inline-block", transformOrigin: "bottom center" }}
    >
      🌱
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// FloatingEmoji - subtle floating animation for decorative emoji
// ---------------------------------------------------------------------------
interface FloatingEmojiProps {
  children: ReactNode;
  className?: string;
}

export function FloatingEmoji({ children, className }: FloatingEmojiProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Shake - horizontal shake for error states
// ---------------------------------------------------------------------------
interface ShakeProps {
  children: ReactNode;
  trigger: boolean;
  className?: string;
}

export function Shake({ children, trigger, className }: ShakeProps) {
  return (
    <motion.div
      className={className}
      animate={trigger ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// BounceOnTap - adds a bounce effect when tapped/clicked
// ---------------------------------------------------------------------------
interface BounceOnTapProps {
  children: ReactNode;
  className?: string;
}

export function BounceOnTap({ children, className }: BounceOnTapProps) {
  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PinDot - animated PIN dot that scales in when filled
// ---------------------------------------------------------------------------
interface PinDotProps {
  filled: boolean;
  className?: string;
}

export function PinDot({ filled, className }: PinDotProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: filled ? 1.15 : 1,
        backgroundColor: filled ? "rgb(14, 165, 233)" : "rgb(229, 231, 235)",
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 20,
      }}
    />
  );
}
