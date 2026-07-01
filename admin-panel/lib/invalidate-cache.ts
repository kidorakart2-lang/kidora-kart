/**
 * Admin-panel helper to invalidate Next.js caches on the web frontend.
 *
 * Call this function after any successful CRUD operation so that the
 * public-facing store reflects changes immediately.
 *
 * Usage:
 * ```ts
 * import { invalidateCache } from "@/lib/invalidate-cache";
 *
 * // After updating a product
 * await invalidateCache(["products", "product:abc123", "homepage"]);
 * ```
 *
 * The function never throws — failures are logged to the console so they
 * don't crash the admin panel, but the cache invalidation is best-effort.
 * In production you may want to wire this into a background-queue or a
 * webhook workflow for reliable delivery.
 */

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? "";

export interface InvalidateResult {
  success: boolean;
  revalidated: string[];
  error?: string;
}

/**
 * Send a batch of cache tags to the frontend's `/api/revalidate`
 * endpoint so it can purge the corresponding data-fetch caches.
 *
 * @param tags  One or more cache tags to invalidate.
 * @returns     The parsed response from the frontend.
 */
export async function invalidateCache(tags: string[]): Promise<InvalidateResult> {
  if (tags.length === 0) {
    return { success: true, revalidated: [] };
  }

  if (!REVALIDATE_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[invalidateCache] REVALIDATE_SECRET / NEXT_PUBLIC_REVALIDATE_SECRET is not set. Skipping cache invalidation.",
      );
    }
    return { success: false, revalidated: [], error: "Secret not configured" };
  }

  try {
    const res = await fetch(`${FRONTEND_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REVALIDATE_SECRET}`,
      },
      body: JSON.stringify({ tags }),
    });

    const body = (await res.json()) as InvalidateResult;

    if (!res.ok || !body.success) {
      console.error("[invalidateCache] Revalidation failed:", body.error ?? `HTTP ${res.status}`);
      return { success: false, revalidated: body.revalidated ?? [], error: body.error ?? `HTTP ${res.status}` };
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[invalidateCache] Revalidated:", body.revalidated);
    }

    return body;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[invalidateCache] Network error:", message);
    return { success: false, revalidated: [], error: message };
  }
}

export default invalidateCache;
