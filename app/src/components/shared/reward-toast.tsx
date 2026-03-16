"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useState, useRef } from "react";

// ---------------------------------------------------------------------------
// RewardToast - stackable slide-in reward notifications
// ---------------------------------------------------------------------------

export interface RewardToastData {
  /** Unique id for AnimatePresence keying */
  id: string;
  /** Emoji shown before the message */
  emoji: string;
  /** Toast message (e.g., "+$0.50 bonus!") */
  message: string;
  /** Auto-dismiss delay in ms. Defaults to 2500. */
  duration?: number;
}

interface RewardToastItemProps {
  toast: RewardToastData;
  onDismiss: (id: string) => void;
}

function RewardToastItem({ toast, onDismiss }: RewardToastItemProps) {
  const duration = toast.duration ?? 2500;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      aria-label={`${toast.emoji} ${toast.message}`}
      className="pointer-events-auto w-full max-w-sm cursor-pointer"
      initial={{ y: -80, opacity: 0, scale: 0.85 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 24,
        },
      }}
      exit={{
        y: -40,
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2, ease: "easeIn" },
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg ring-1 ring-black/5">
        <span className="text-2xl select-none">{toast.emoji}</span>
        <p className="text-sm font-semibold text-gray-800">{toast.message}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// RewardToastContainer - manages a stack of toasts
// ---------------------------------------------------------------------------

interface RewardToastContainerProps {
  toasts: RewardToastData[];
  onDismiss: (id: string) => void;
}

export function RewardToastContainer({
  toasts,
  onDismiss,
}: RewardToastContainerProps) {
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <RewardToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useRewardToasts - convenience hook for managing toast state
// ---------------------------------------------------------------------------

let toastCounter = 0;

export function useRewardToasts() {
  const [toasts, setToasts] = useState<RewardToastData[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const addToast = useCallback(
    (toast: Omit<RewardToastData, "id"> & { id?: string }) => {
      const id = toast.id ?? `reward-toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, addToast, dismissToast, clearAll };
}
