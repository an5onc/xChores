"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// CelebrationOverlay - full-screen reward celebration with confetti burst
// ---------------------------------------------------------------------------

interface ConfettiParticle {
  id: number;
  /** Horizontal launch angle in radians */
  angle: number;
  /** How far the particle travels horizontally */
  distance: number;
  /** Particle width */
  width: number;
  /** Particle height */
  height: number;
  color: string;
  /** Rotation on z-axis (degrees) */
  rotation: number;
  /** Vertical gravity drop distance */
  gravity: number;
  /** Animation duration variation */
  duration: number;
  /** Slight random start delay */
  delay: number;
}

const CONFETTI_COLORS = [
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fb923c", // orange
  "#2dd4bf", // teal
  "#facc15", // yellow
];

function generateParticles(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4,
    distance: 80 + Math.random() * 200,
    width: 6 + Math.random() * 8,
    height: 4 + Math.random() * 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotation: Math.random() * 720 - 360,
    gravity: 120 + Math.random() * 180,
    duration: 0.8 + Math.random() * 0.6,
    delay: Math.random() * 0.15,
  }));
}

export interface CelebrationOverlayProps {
  /** Whether the overlay is visible */
  show: boolean;
  /** Callback when the overlay dismisses (auto or tap) */
  onDismiss: () => void;
  /** Main message displayed below the emoji */
  message: string;
  /** Large emoji shown at center. Defaults to party popper. */
  emoji?: string;
  /** Auto-dismiss delay in ms. Defaults to 3000. Set to 0 to disable. */
  duration?: number;
  /** Number of confetti particles. Defaults to 40. */
  particleCount?: number;
}

export function CelebrationOverlay({
  show,
  onDismiss,
  message,
  emoji = "🎉",
  duration = 3000,
  particleCount = 40,
}: CelebrationOverlayProps) {
  // Memoize particles so they don't regenerate on every render
  const particles = useMemo(
    () => generateParticles(particleCount),
    [particleCount]
  );

  // Auto-dismiss timer
  useEffect(() => {
    if (!show || duration === 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onDismiss]);

  const handleTap = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="celebration-overlay"
          role="status"
          aria-live="polite"
          aria-label={message}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          onClick={handleTap}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              handleTap();
            }
          }}
          tabIndex={0}
        >
          {/* Backdrop — green/gold gradient with blur */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(22, 163, 74, 0.85) 0%, rgba(234, 179, 8, 0.75) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti particles */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p) => {
              const x = Math.cos(p.angle) * p.distance;
              const y = Math.sin(p.angle) * p.distance;

              return (
                <motion.div
                  key={p.id}
                  className="absolute rounded-sm"
                  style={{
                    width: p.width,
                    height: p.height,
                    backgroundColor: p.color,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x,
                    // Particles launch upward/outward then fall with gravity
                    y: [0, y - 40, y + p.gravity],
                    scale: [0, 1.3, 0.6],
                    rotate: p.rotation,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                />
              );
            })}
          </div>

          {/* Center content — emoji + message */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4 px-8"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 18,
                delay: 0.05,
              },
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              transition: { duration: 0.2 },
            }}
          >
            {/* Emoji with bounce */}
            <motion.span
              className="text-7xl sm:text-8xl select-none drop-shadow-lg"
              animate={{
                y: [0, -12, 0],
                rotate: [0, -8, 8, -4, 0],
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut",
              }}
            >
              {emoji}
            </motion.span>

            {/* Message */}
            <motion.p
              className="text-center text-2xl font-bold text-white sm:text-3xl drop-shadow-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { delay: 0.15, duration: 0.35 },
              }}
            >
              {message}
            </motion.p>

            {/* Tap to dismiss hint */}
            <motion.p
              className="mt-2 text-sm text-white/70"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.6, duration: 0.4 },
              }}
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
