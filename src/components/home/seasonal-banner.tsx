'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Paths where the banner should NOT show
const HOLIDAY_PATHS = [
  '/embed',
  '/holiday-breathing-exercises',
  '/for/holiday-stress',
  '/for/travel-anxiety',
];

export function SeasonalBanner() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check feature flag
    const featureEnabled = process.env.NEXT_PUBLIC_HOLIDAY_BANNER === 'true';
    if (!featureEnabled) {
      setShouldShow(false);
      return;
    }

    // Check if on a holiday page
    const isHolidayPage = HOLIDAY_PATHS.some(path => pathname?.startsWith(path));
    if (isHolidayPage) {
      setShouldShow(false);
      return;
    }

    // Check if holiday season (December or January)
    const month = new Date().getMonth();
    const isHolidaySeason = month === 11 || month === 0;

    setShouldShow(isHolidaySeason);

    // Check if user dismissed it this session
    const wasDismissed = sessionStorage.getItem('holiday-banner-dismissed');
    if (wasDismissed) setDismissed(true);
  }, [pathname]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('holiday-banner-dismissed', 'true');
  };

  if (!shouldShow || dismissed) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Link
        href="/holiday-breathing-exercises"
        className="group relative block rounded-2xl border border-slate-600/50 bg-gradient-to-r from-slate-800/95 to-slate-900/95 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-slate-500/60 hover:shadow-2xl"
      >
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❄️</span>
            <div>
              <p className="font-medium text-slate-100">
                Holiday Breathing Exercises
              </p>
              <p className="text-sm text-slate-400">
                Calm techniques for family stress, travel anxiety, and seasonal overwhelm
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-slate-300 transition-transform group-hover:translate-x-1">
            Explore →
          </span>
        </div>
      </Link>
    </div>
  );
}
