/**
 * Server-side fetch helper that resolves relative API URLs.
 *
 * In Next.js server components Node.js's built-in `fetch` **cannot resolve
 * relative URLs** — it throws `Failed to parse URL` at runtime.
 *
 * This helper prepends the backend API URL (from `NEXT_PUBLIC_API_URL` or
 * the dev default `http://localhost:5000`) to any path that starts with `/`,
 * so the request goes directly to the API server rather than through the
 * Next.js rewrite layer.
 *
 * @example
 *   serverFetch("/api/website/cart/view")
 *   // → fetch("http://localhost:5000/api/website/cart/view")  (dev)
 *
 * @example
 *   serverFetch("/api/website/nav", { method: "POST" })
 *   // → fetch("https://api.kidorakart.com/api/website/nav", { method: "POST" })  (prod)
 */

export async function serverFetch(
  path: string,
  options?: RequestInit & { timeout?: number },
): Promise<Response> {
  // Strip trailing slash so the join is clean: "http://localhost:5000" + "/api/..."
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const url = path.startsWith("/") ? `${baseUrl}${path}` : path;

  const { timeout = 8000, ...fetchOptions } = options ?? {};

  // AbortController-based timeout — prevents build/prerender hangs when
  // the API server isn't running.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: (fetchOptions.signal ?? controller.signal) as AbortSignal,
    });
  } finally {
    clearTimeout(timer);
  }
}
