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
  // Client-side: use the relative path so it goes through the Next.js rewrite
  if (typeof window !== "undefined") {
    const { timeout = 8000, ...fetchOptions } = options ?? {};
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(path, {
        ...fetchOptions,
        signal: (fetchOptions.signal ?? controller.signal) as AbortSignal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  // Server-side: resolve to the backend API URL
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const url = path.startsWith("/") ? `${baseUrl}${path}` : path;

  const { timeout = 8000, ...fetchOptions } = options ?? {};

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
