"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname } from "next/navigation";

import {
  type AppStorePromotionVariant,
  createAppStoreAnalyticsParams,
  createAppStoreDestination,
} from "@/lib/app-store-attribution";
import { PRODUCTION_HOSTNAMES } from "@/lib/analytics/google-analytics";

const APP_STORE_BADGE_URL =
  "https://toolbox.marketingtools.apple.com/api/badges/download-on-the-app-store/black/en-us?size=250x83";

const APP_STORE_PROVIDER_TOKEN =
  process.env.NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN;

type AppStoreEventName = "app_store_click" | "app_store_promotion_view";
type Gtag = (
  command: "event",
  name: AppStoreEventName,
  params: Record<string, string | boolean>,
) => void;

function getGtag() {
  if (typeof window === "undefined") return undefined;
  if (!PRODUCTION_HOSTNAMES.has(window.location.hostname)) return undefined;

  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

function trackAppStoreEvent(
  name: AppStoreEventName,
  variant: AppStorePromotionVariant,
) {
  const gtag = getGtag();
  if (!gtag) return;

  const currentUrl = new URL(window.location.href);
  const destination = createAppStoreDestination({
    currentUrl,
    providerToken: APP_STORE_PROVIDER_TOKEN,
  });
  gtag(
    "event",
    name,
    createAppStoreAnalyticsParams({ currentUrl, destination, variant }),
  );
}

const promotionCopy = {
  landing: {
    title: "A more focused practice, now on iPhone",
    body: "A more focused way to practice, with full-screen sessions, every breathing mode, sound, haptics, and pacing controls made for your phone.",
  },
  strip: {
    title: "Now an iPhone app",
    body: "Full-screen sessions with sound, haptics, and pacing controls, made for a more focused practice.",
  },
} satisfies Record<
  AppStorePromotionVariant,
  { title: string; body: string }
>;

export function AppStorePromotion({
  className,
  variant,
}: {
  className?: string;
  variant: AppStorePromotionVariant;
}) {
  const copy = promotionCopy[variant];
  const isLanding = variant === "landing";
  const pathname = usePathname();
  const sectionRef = useRef<HTMLElement>(null);
  const hasTrackedView = useRef(false);
  const appStoreHref = createAppStoreDestination({
    currentUrl: new URL(pathname, "https://deepbreathingexercises.com"),
    providerToken: APP_STORE_PROVIDER_TOKEN,
  });

  useEffect(() => {
    hasTrackedView.current = false;
    const section = sectionRef.current;
    if (!section || !getGtag() || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasTrackedView.current) return;
        hasTrackedView.current = true;
        trackAppStoreEvent("app_store_promotion_view", variant);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [pathname, variant]);

  const handleAppStoreClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const currentUrl = new URL(window.location.href);
    event.currentTarget.href = createAppStoreDestination({
      currentUrl,
      providerToken: APP_STORE_PROVIDER_TOKEN,
    });
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackAppStoreEvent("app_store_promotion_view", variant);
    }
    trackAppStoreEvent("app_store_click", variant);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`app-store-${variant}-title`}
      className={`app-store-promotion glow-card rounded-[32px] border bg-card p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8 ${
        isLanding ? "mt-8" : ""
      } ${className ?? ""}`}
    >
      <div className="max-w-2xl">
        <h2
          id={`app-store-${variant}-title`}
          className={`${isLanding ? "text-2xl sm:text-3xl" : "text-2xl"} font-semibold text-card-foreground`}
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {copy.body}
        </p>
      </div>

      <a
        href={appStoreHref}
        target="_blank"
        rel="noreferrer"
        onClick={handleAppStoreClick}
        aria-label="Download Deep Breathing on the App Store"
        className="mt-6 inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:mt-0 lg:shrink-0"
      >
        {/* Apple requires the official badge artwork to remain unmodified. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={APP_STORE_BADGE_URL}
          alt="Download on the App Store"
          width={180}
          height={60}
          className="h-[54px] w-auto"
        />
      </a>
    </section>
  );
}
