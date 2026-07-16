"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Gtag = (command: "event", name: "page_view", params: Record<string, string>) => void;

const INTERNAL_ROUTES = new Set(["/sensory-studio"]);

function shouldTrackPageView(pathname: string) {
  return !INTERNAL_ROUTES.has(pathname);
}

function getGtag(): Gtag | undefined {
  if (typeof window === "undefined") return undefined;
  const fn = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof fn === "function" ? fn : undefined;
}

function sendPageView(path: string) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !shouldTrackPageView(pathname)) return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    sendPageView(path);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!shouldTrackPageView(window.location.pathname)) return;
      sendPageView(window.location.pathname + window.location.search);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
