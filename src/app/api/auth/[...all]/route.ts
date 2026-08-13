import {
  auth,
  parseAllowedExpoAuthorizationURL,
} from "../../../../lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Never prerendered at build time. These handlers read request state (session,
// database) and a build-time prerender attempt evaluates that state with no env
// configured, which crashed the static worker on deployments without secrets.
// Cacheability is expressed per-response via Cache-Control, not by prerendering.
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = [
  "https://deepbreathingexercises.com",
  "https://origin.deepbreathingexercises.com",
  "http://localhost:3000",
];

function invalidExpoAuthorizationResponse() {
  return new Response(
    JSON.stringify({ error: "Invalid authorization URL" }),
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

function isExpoAuthorizationProxyRequest(request: Request): boolean {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  return pathname.endsWith("/expo-authorization-proxy");
}

function withCors(response: Response, origin: string | null) {
  const allowedOrigin = ALLOWED_ORIGINS.find((o) => o === origin);
  if (!allowedOrigin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Built on first request, not at module load. `auth` is a lazy Proxy, so calling
// toNextJsHandler() here reads auth.handler and constructs betterAuth() — which
// throws without BETTER_AUTH_SECRET. Next imports this module during the build to
// collect route info, so doing it at module scope crashed the static worker on
// every deployment without the secret (i.e. every preview branch).
let handler: ReturnType<typeof toNextJsHandler> | null = null;

function getHandler() {
  handler ??= toNextJsHandler(auth);
  return handler;
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (isExpoAuthorizationProxyRequest(request)) {
    const authorizationURL = new URL(request.url).searchParams.get(
      "authorizationURL",
    );
    if (!parseAllowedExpoAuthorizationURL(authorizationURL)) {
      return withCors(invalidExpoAuthorizationResponse(), origin);
    }
  }
  const response = await getHandler().GET(request);
  return withCors(response, origin);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const response = await getHandler().POST(request);
    return withCors(response, origin);
  } catch (error) {
    console.error("[auth] POST error:", error);
    return withCors(
      new Response(
        JSON.stringify({ error: "Internal auth error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
      origin
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return withCors(new Response(null, { status: 204 }), origin);
}
