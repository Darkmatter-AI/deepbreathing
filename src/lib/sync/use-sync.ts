"use client";

import { useCallback, useRef, useState } from "react";

const STORAGE_KEYS = {
  SETTINGS: "resonance_settings",
  STATS: "resonance_stats",
};

export function useSync(isAuthenticated: boolean) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [currentStreak, setCurrentStreak] = useState(0);

  const mergeGuestData = useCallback(async () => {
    if (!isAuthenticated) return;

    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const stats = localStorage.getItem(STORAGE_KEYS.STATS);

    try {
      await fetch("/api/v1/sync/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: settings ? JSON.parse(settings) : null,
          stats: stats ? JSON.parse(stats) : null,
        }),
      });
    } catch {
      // Silent fail — data stays in localStorage
    }
  }, [isAuthenticated]);

  const hydrateFromServer = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch("/api/v1/sync/bootstrap");
      if (!res.ok) return;

      const data = await res.json();

      if (data.settings) {
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify({
            mode: data.settings.mode,
            speed: data.settings.speedMultiplier,
            duration: data.settings.selectedDuration,
          })
        );
      }

      if (data.stats) {
        const localStats = localStorage.getItem(STORAGE_KEYS.STATS);
        const parsed = localStats ? JSON.parse(localStats) : {};
        const localMinutes = parsed.totalMinutes ?? 0;
        const localSessions = parsed.sessionsCompleted ?? 0;
        // Server wins only if it has more minutes (monotonic)
        if (data.stats.totalMinutes >= localMinutes) {
          const serverStreak: number = data.stats.currentStreak ?? 0;
          setCurrentStreak(serverStreak);
          localStorage.setItem(
            STORAGE_KEYS.STATS,
            JSON.stringify({
              totalMinutes: data.stats.totalMinutes,
              sessionsCompleted: Math.max(
                data.stats.sessionsCompleted ?? 0,
                localSessions
              ),
              currentStreak: serverStreak,
              lastSessionDate: data.stats.lastSessionDate ?? null,
            })
          );
        }
      }
    } catch {
      // Silent fail
    }
  }, [isAuthenticated]);

  const syncSettings = useCallback(
    (settings: { mode: string; speed: number; duration: number | null }) => {
      if (!isAuthenticated) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch("/api/v1/sync/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: settings.mode,
              speedMultiplier: settings.speed,
              selectedDuration: settings.duration,
            }),
          });
        } catch {
          // Silent fail
        }
      }, 2000);
    },
    [isAuthenticated]
  );

  const syncStats = useCallback(
    (totalMinutes: number, sessionsCompleted: number, sessionDate?: string) => {
      if (!isAuthenticated) return;

      try {
        fetch("/api/v1/sync/stats", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalMinutes, sessionsCompleted, sessionDate }),
        });
      } catch {
        // Silent fail
      }
    },
    [isAuthenticated]
  );

  return { mergeGuestData, hydrateFromServer, syncSettings, syncStats, currentStreak };
}
