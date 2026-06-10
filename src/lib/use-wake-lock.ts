'use client';

import { useEffect, useRef } from 'react';

export interface WakeLockCallbacks {
  onInterrupted?: (params: { reason: 'visibility' | 'sentinel_release'; wakeLockSupported: boolean }) => void;
  onResumed?: () => void;
}

export function useWakeLock(active: boolean, callbacks?: WakeLockCallbacks) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const interruptedRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;

    const wakeLockSupported = 'wakeLock' in navigator;
    let cancelled = false;

    function onSentinelRelease() {
      // Fires when the system releases the lock (screen about to sleep)
      // Only treat as interruption if the page is still hidden at this point
      if (!cancelled && document.visibilityState === 'hidden') {
        interruptedRef.current = true;
        callbacksRef.current?.onInterrupted?.({ reason: 'sentinel_release', wakeLockSupported });
      }
    }

    async function acquire() {
      if (!wakeLockSupported) return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        sentinel.addEventListener('release', onSentinelRelease);
        sentinelRef.current = sentinel;
      } catch {
        // Permission denied or not supported — fail silently
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // Page went to background; may be sleep, app switch, or home button
        interruptedRef.current = true;
        callbacksRef.current?.onInterrupted?.({ reason: 'visibility', wakeLockSupported });
      } else if (document.visibilityState === 'visible') {
        if (interruptedRef.current) {
          interruptedRef.current = false;
          callbacksRef.current?.onResumed?.();
        }
        // Re-acquire — spec releases the lock when page is hidden
        if (!cancelled) acquire();
      }
    }

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      interruptedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}
