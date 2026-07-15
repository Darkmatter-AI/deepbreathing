import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Suspense, type ReactNode } from "react";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SeasonalBanner } from "@/components/home/seasonal-banner";
import {
  GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT,
  GOOGLE_ANALYTICS_SCRIPT_SRC,
} from "@/lib/analytics/google-analytics";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

interface SiteDocumentProps {
  children: ReactNode;
  htmlLang: string;
  direction?: "ltr" | "rtl";
  disableSeasonalBanner?: boolean;
}

export function SiteDocument({
  children,
  htmlLang,
  direction,
  disableSeasonalBanner = false,
}: SiteDocumentProps) {
  return (
    <html lang={htmlLang} dir={direction} suppressHydrationWarning>
      <body className={`${fontSans.variable} min-h-screen bg-background text-foreground`}>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script id="resonance-theme-init" strategy="beforeInteractive">
          {`(function(){try{var storageKey='resonance_theme';var root=document.documentElement;var stored=localStorage.getItem(storageKey);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=stored&&stored!=='system'?stored:(prefersDark?'dark':'light');if(theme==='dark'){root.classList.add('dark');}else{root.classList.remove('dark');}root.dataset.theme=theme;}catch(_e){}})();`}
        </Script>
        <Script src={GOOGLE_ANALYTICS_SCRIPT_SRC} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT}
        </Script>
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="uzrT/cO760nX502p37kP0g"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <SeasonalBanner disabled={disableSeasonalBanner} />
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
