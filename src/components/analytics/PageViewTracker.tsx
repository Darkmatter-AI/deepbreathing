"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Gtag = (command: "event", name: "page_view", params: Record<string, string>) => void;

const INTERNAL_ROUTES = new Set(["/sensory-studio"]);
const PRODUCTION_HOSTNAMES = new Set([
  "deepbreathingexercises.com",
  "www.deepbreathingexercises.com",
]);

function shouldTrackPageView(pathname: string) {
  return !INTERNAL_ROUTES.has(pathname);
}

function isProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return PRODUCTION_HOSTNAMES.has(hostname);
}

function getGtag(): Gtag | undefined {
  if (typeof window === "undefined") return undefined;
  const fn = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof fn === "function" ? fn : undefined;
}

function sendPageView(pathname: string, search: string) {
  const gtag = getGtag();
  if (!gtag) return;
  if (!isProductionHost()) return;

  const pagePath = pathname;
  const pageLocation = search ? `${window.location.origin}${pathname}${search}` : `${window.location.origin}${pathname}`;

  gtag("event", "page_view", {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: document.title,
  });
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !shouldTrackPageView(pathname)) return;
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    sendPageView(pathname, search);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!shouldTrackPageView(window.location.pathname)) return;
      sendPageView(window.location.pathname, window.location.search);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
