import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import type { RevalidateRequest, RevalidateResponse } from "@/lib/revalidation-tags";

// ── Tag → cacheLife profile mapping ────────────────────────────────
//
// When a tag is invalidated, the next fetch for that resource uses the
// corresponding cacheLife profile to determine stale/revalidate/expire
// timing.  Tags not listed here fall back to the "max" profile.

const TAG_PROFILES: Record<string, string> = {
  products: "products",
  product: "products",          // for product:{id} scoped tags
  homepage: "homepage",
  categories: "categories",
  category: "categories",       // for category:{slug} scoped tags
  filters: "filters",
  faq: "faq",
  testimonials: "testimonials",
  search: "search",
  "best-sellers": "best-sellers",
  "flash-sale": "best-sellers",   // same cadence as best-sellers
  tabs: "tabs",
  navigation: "navigation",
  brand: "max",                   // brand:{slug} — no dedicated profile yet
};

/**
 * Pick the best matching cacheLife profile for a tag.
 * Scoped tags like `product:abc123` use the base profile (e.g., "products").
 */
function profileForTag(tag: string): string {
  const base = tag.split(":")[0];
  return TAG_PROFILES[base] ?? "max";
}

// ── Environment ─────────────────────────────────────────────────────

const AUTH_TOKEN = process.env.REVALIDATE_SECRET ?? "";

if (!AUTH_TOKEN && process.env.NODE_ENV === "production") {
  console.warn(
    "[revalidate] REVALIDATE_SECRET is not set!  The endpoint will reject all requests.",
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function unauthorized(message = "Unauthorized"): NextResponse<RevalidateResponse> {
  return NextResponse.json(
    { success: false, revalidated: [], error: message },
    { status: 401 },
  );
}

function badRequest(error: string): NextResponse<RevalidateResponse> {
  return NextResponse.json(
    { success: false, revalidated: [], error },
    { status: 400 },
  );
}

function serverError(error: string): NextResponse<RevalidateResponse> {
  return NextResponse.json(
    { success: false, revalidated: [], error },
    { status: 500 },
  );
}

// ── POST handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authenticate ---------------------------------------------------
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return unauthorized("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return unauthorized("Invalid Authorization format. Use: Bearer <secret>");
  }

  if (!AUTH_TOKEN) {
    return serverError("REVALIDATE_SECRET is not configured on the server");
  }

  // Timing-safe comparison prevents timing attacks
  if (token.length !== AUTH_TOKEN.length || !timingSafeEqual(token, AUTH_TOKEN)) {
    return unauthorized("Invalid token");
  }

  // 2. Parse body -----------------------------------------------------
  let body: RevalidateRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body || !Array.isArray(body.tags)) {
    return badRequest('Body must contain a "tags" array');
  }

  if (body.tags.length === 0) {
    return badRequest('"tags" array must not be empty');
  }

  // 3. Deduplicate ----------------------------------------------------
  const uniqueTags = [...new Set(body.tags)];

  // Validate each tag is a non-empty string
  for (const tag of uniqueTags) {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      return badRequest('Each tag must be a non-empty string');
    }
  }

  // 4. Revalidate -----------------------------------------------------
  const revalidated: string[] = [];
  const errors: string[] = [];

  for (const tag of uniqueTags) {
    const profile = profileForTag(tag);
    try {
      revalidateTag(tag, profile);
      revalidated.push(tag);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to revalidate tag "${tag}": ${message}`);
    }
  }

  // 5. Logging --------------------------------------------------------
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[revalidate] Revalidated:\n${revalidated.map((t) => `  ${t}`).join("\n")}`,
    );
    if (errors.length > 0) {
      console.error(`[revalidate] Errors:\n${errors.map((e) => `  ${e}`).join("\n")}`);
    }
  }

  // 6. Response -------------------------------------------------------
  if (errors.length > 0 && revalidated.length === 0) {
    return serverError("All revalidation attempts failed");
  }

  return NextResponse.json({
    success: errors.length === 0,
    revalidated,
    ...(errors.length > 0 ? { error: errors.join("; ") } : {}),
  });
}

// ── Timing-safe string comparison ───────────────────────────────────
// Prevents attackers from guessing the secret character-by-character
// by measuring response time.

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
