import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { validateAnalyticsPayload } from "./validation";

// This endpoint is intentionally unauthenticated: guests may opt in to
// optional pseudonymous usage analytics. It is still a narrow server-side proxy, not a generic
// Measurement Protocol relay. Credentials are read only from server env vars;
// clients cannot choose a measurement ID, API secret, event name, or payload
// shape that this route forwards to Google.
export const dynamic = "force-dynamic";

const GOOGLE_MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MAX_BODY_BYTES = 12_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const RATE_WINDOW_MS = 60_000;
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

type RateWindow = { startedAt: number; count: number };
const rateWindows = new Map<string, RateWindow>();

function requestKey(request: NextRequest): string {
  // Vercel's trusted edge writes x-real-ip before invoking the function;
  // @vercel/functions reads that value without trusting user-controlled
  // forwarding headers. If the platform does not provide an IP, deliberately
  // share one bounded fallback window instead of allowing arbitrary headers to
  // bypass the limiter.
  const platformIp = ipAddress(request);
  return typeof platformIp === "string" && platformIp.trim()
    ? platformIp.trim()
    : "unknown";
}

function isRateLimited(request: NextRequest): boolean {
  const now = Date.now();
  const key = requestKey(request);
  const current = rateWindows.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(key, { startedAt: now, count: 1 });
    // Bound memory if a deployment receives many spoofed forwarding headers.
    if (rateWindows.size > 2_048) {
      const oldest = rateWindows.keys().next().value;
      if (oldest) rateWindows.delete(oldest);
    }
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return errorResponse("Too many requests", 429, { "Retry-After": "60" });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return errorResponse("JSON body required", 415);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Invalid request body", 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return errorResponse("Request body too large", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
  const payload = validateAnalyticsPayload(parsed);
  if (!payload) return errorResponse("Invalid analytics event", 400);

  const apiSecret = process.env.GA4_MP_API_SECRET;
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  if (
    typeof apiSecret !== "string" ||
    apiSecret.length < 1 ||
    apiSecret.length > 256 ||
    typeof measurementId !== "string" ||
    !MEASUREMENT_ID_PATTERN.test(measurementId)
  ) {
    // Do not reveal which server variable is missing.
    return errorResponse("Analytics unavailable", 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  try {
    const upstream = await fetch(
      `${GOOGLE_MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: payload.clientId,
          events: [
            {
              name: payload.eventName,
              params: {
                ...payload.params,
                app_platform: payload.platform,
              },
            },
          ],
        }),
        signal: controller.signal,
      },
    );
    if (!upstream.ok) return errorResponse("Analytics unavailable", 502);
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return errorResponse("Analytics unavailable", 502);
  } finally {
    clearTimeout(timer);
  }
}
