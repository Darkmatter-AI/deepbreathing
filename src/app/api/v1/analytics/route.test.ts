import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";
import { validateAnalyticsPayload } from "./validation";

const CLIENT_ID = "123e4567-e89b-42d3-a456-426614174000";
const VALID_PAYLOAD = {
  eventName: "breathing_session_end",
  clientId: CLIENT_ID,
  params: {
    mode: "Box Breathing",
    reason: "completed",
    seconds_elapsed: 60,
  },
  platform: "ios",
} as const;

function request(body: unknown, ip = "198.51.100.10", forwardedFor?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-real-ip": ip,
  };
  if (forwardedFor !== undefined) headers["x-forwarded-for"] = forwardedFor;
  const nextRequest = new NextRequest("https://origin.deepbreathingexercises.com/api/v1/analytics", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return nextRequest;
}

afterEach(() => {
  delete process.env.GA4_MP_API_SECRET;
  delete process.env.GA4_MEASUREMENT_ID;
  vi.restoreAllMocks();
});

describe("validateAnalyticsPayload", () => {
  it("accepts the narrow supported event envelope", () => {
    expect(validateAnalyticsPayload(VALID_PAYLOAD)).toEqual(VALID_PAYLOAD);
  });

  it("rejects unknown event names and arbitrary parameters", () => {
    expect(
      validateAnalyticsPayload({ ...VALID_PAYLOAD, eventName: "custom_event" }),
    ).toBeNull();
    expect(
      validateAnalyticsPayload({
        ...VALID_PAYLOAD,
        params: { ...VALID_PAYLOAD.params, arbitrary: "secret" },
      }),
    ).toBeNull();
  });

  it("rejects malformed client IDs and out-of-range values", () => {
    expect(validateAnalyticsPayload({ ...VALID_PAYLOAD, clientId: "not-a-uuid" })).toBeNull();
    expect(
      validateAnalyticsPayload({
        ...VALID_PAYLOAD,
        params: { ...VALID_PAYLOAD.params, seconds_elapsed: 999_999 },
      }),
    ).toBeNull();
  });
});

describe("POST /api/v1/analytics", () => {
  it("fails closed when server analytics credentials are unavailable", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await POST(request(VALID_PAYLOAD, "198.51.100.11"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Analytics unavailable" });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects an oversized body before validation or upstream fetch", async () => {
    process.env.GA4_MP_API_SECRET = "server-only-secret";
    process.env.GA4_MEASUREMENT_ID = "G-TESTTEST01";
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await POST(request({ ...VALID_PAYLOAD, padding: "x".repeat(20_000) }, "198.51.100.12"));
    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards only validated data using server-held credentials", async () => {
    process.env.GA4_MP_API_SECRET = "server-only-secret";
    process.env.GA4_MEASUREMENT_ID = "G-TESTTEST01";
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    const response = await POST(request(VALID_PAYLOAD, "198.51.100.13"));
    expect(response.status).toBe(204);
    expect(upstream).toHaveBeenCalledOnce();
    const [url, init] = upstream.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("measurement_id=G-TESTTEST01");
    expect(url).toContain("api_secret=server-only-secret");
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).toEqual({
      client_id: CLIENT_ID,
      events: [
        {
          name: "breathing_session_end",
          params: {
            mode: "Box Breathing",
            reason: "completed",
            seconds_elapsed: 60,
            app_platform: "ios",
          },
        },
      ],
    });
  });

  it("returns a generic error when Google is unavailable", async () => {
    process.env.GA4_MP_API_SECRET = "server-only-secret";
    process.env.GA4_MEASUREMENT_ID = "G-TESTTEST01";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const response = await POST(request(VALID_PAYLOAD, "198.51.100.14"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Analytics unavailable" });
  });

  it("does not let spoofed forwarding headers bypass the rate limit", async () => {
    process.env.GA4_MP_API_SECRET = "server-only-secret";
    process.env.GA4_MEASUREMENT_ID = "G-TESTTEST01";
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    const trustedIp = "198.51.100.200";
    let lastResponse: Response | undefined;

    // The platform-provided x-real-ip stays fixed while an attacker rotates
    // x-forwarded-for on every request. The 121st request must still be
    // rejected instead of opening a fresh bucket for each spoofed value.
    for (let attempt = 0; attempt < 121; attempt += 1) {
      lastResponse = await POST(
        request(VALID_PAYLOAD, trustedIp, `203.0.113.${attempt}`),
      );
    }

    expect(lastResponse?.status).toBe(429);
    expect(upstream).toHaveBeenCalledTimes(120);
  });
});
