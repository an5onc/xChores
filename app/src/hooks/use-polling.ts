"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions<T> {
  /** URL to fetch */
  url: string;
  /** Polling interval in ms (default: 10000) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Transform the response before setting state */
  transform?: (data: unknown) => T;
}

/**
 * Hook for polling an API endpoint at a regular interval.
 * Pauses when the tab is hidden and resumes when visible.
 */
export function usePolling<T>({
  url,
  interval = 10000,
  enabled = true,
  transform,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(transform ? transform(json) : json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [url, transform]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Start polling
    intervalRef.current = setInterval(fetchData, interval);

    // Pause on tab hide, resume on tab show
    function handleVisibility() {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, interval);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, interval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
