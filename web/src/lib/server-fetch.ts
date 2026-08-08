/**
 * Server-side fetch helper that resolves relative API URLs.
 *
 * In Next.js server components, Node.js's built-in `fetch` **cannot resolve
 * relative URLs** — it throws `Failed to parse URL` at runtime.
 *
 * This helper prepends the backend API URL (from `NEXT_PUBLIC_API_URL` or
 * the dev default `http://localhost:5000`) to any path that starts with `/`,
 * so the request goes directly to the API server rather than through the
 * Next.js rewrite layer.
 *
 * On the client side, the original relative path is preserved so the request
 * is made to the same origin and gets proxied through the Next.js rewrite
 * middleware — this avoids CORS issues and keeps cookies in the same domain.
 *
 * @example
 *   serverFetch("/api/website/product/details/my-product")
 *   // Server-side → fetch("http://localhost:5000/api/website/product/details/my-product")
 *   // Client-side → fetch("/api/website/product/details/my-product") — goes through rewrite
 */

export async function serverFetch(
  path: string,
  options?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 8000, ...fetchOptions } = options ?? {};

  const isServer = typeof window === "undefined";
  const url = isServer
    ? path.startsWith("/")
      ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "")}${path}`
      : path
    : path;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // Combine an injected signal (Next.js injects one during static
    // generation) with our own so the timeout always aborts the fetch —
    // otherwise a hanging request blocks/fails the whole build.
    const signal =
      fetchOptions.signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([fetchOptions.signal, controller.signal])
        : ((fetchOptions.signal ?? controller.signal) as AbortSignal);
    return await fetch(url, { ...fetchOptions, signal });
  } finally {
    clearTimeout(timer);
  }
}
