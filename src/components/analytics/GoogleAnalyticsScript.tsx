"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT,
  GOOGLE_ANALYTICS_SCRIPT_SRC,
  PRODUCTION_HOSTNAMES,
} from "@/lib/analytics/google-analytics";

export function GoogleAnalyticsScript() {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsProduction(PRODUCTION_HOSTNAMES.has(window.location.hostname));
    }
  }, []);

  if (!isProduction) return null;

  return (
    <>
      <Script src={GOOGLE_ANALYTICS_SCRIPT_SRC} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT}
      </Script>
    </>
  );
}
