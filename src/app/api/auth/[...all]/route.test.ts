import { describe, expect, it } from "vitest";
import { parseAllowedExpoAuthorizationURL } from "../../../../lib/auth";
import { GET } from "./route";

describe("Expo authorization proxy destination validation", () => {
  it("accepts the exact Google and Apple authorization endpoints", () => {
    expect(
      parseAllowedExpoAuthorizationURL(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&state=google-state",
      )?.origin,
    ).toBe("https://accounts.google.com");
    expect(
      parseAllowedExpoAuthorizationURL(
        "https://appleid.apple.com/auth/authorize?client_id=test&state=apple-state",
      )?.origin,
    ).toBe("https://appleid.apple.com");
  });

  it("rejects off-list origins and malformed provider URLs", () => {
    const rejected = [
      "https://evil.example.test/collect?state=stolen",
      "https://accounts.google.com.evil.example.test/o/oauth2/v2/auth?state=stolen",
      "javascript:alert(1)",
      "https://accounts.google.com/o/oauth2/v2/auth",
      "https://accounts.google.com/evil?state=present",
      "https://accounts.google.com/o/oauth2/v2/auth?state=present#fragment",
      "https://user:password@accounts.google.com/o/oauth2/v2/auth?state=present",
    ];

    for (const value of rejected) {
      expect(parseAllowedExpoAuthorizationURL(value), value).toBeNull();
    }
  });

  it("returns a generic client error without invoking Better Auth for an off-list URL", async () => {
    const response = await GET(
      new Request(
        "https://origin.deepbreathingexercises.com/api/auth/expo-authorization-proxy?authorizationURL=https%3A%2F%2Fevil.example.test%2Fcollect%3Fstate%3Dstolen",
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid authorization URL",
    });
    expect(response.headers.get("location")).toBeNull();
  });
});
