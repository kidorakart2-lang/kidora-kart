/**
 * Centralized API client for the admin panel.
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const users = await api.get("/api/admin/user/findAllUser");
 *   const created = await api.post("/api/admin/user/create", { name: "..." });
 *   const updated = await api.put("/api/admin/category/update/123", formData);
 *   await api.del("/api/admin/user/delete/123");
 *
 * All requests:
 * - Use relative URLs (via Next.js rewrites) for same-origin cookie support
 * - Include `credentials: "include"` automatically
 * - Read `adminToken` from cookies and send as `Authorization` header
 * - Parse `_status` and throw on failure with `_message`
 * - Return `_data` when present, otherwise the full response JSON
 * - Accept both JSON objects and FormData (auto-detected)
 * - Gracefully handle non-JSON responses (e.g. 500 HTML error pages)
 */

function resolveUrl(url: string): string {
  // If it's already an absolute URL, strip the host to use the Next.js rewrite
  // so cookies are set from the same origin.
  if (!url.startsWith("http")) {
    // Lowercase the path (not query params) to match Express routes (case-sensitive)
    const qIndex = url.indexOf("?");
    const path = qIndex < 0 ? url : url.slice(0, qIndex);
    const qs = qIndex < 0 ? "" : url.slice(qIndex);
    const normalised = path.toLowerCase() + qs;
    // Server-side (Next.js server components): Node.js fetch needs an absolute URL
    if (typeof window === "undefined") {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      return `${baseUrl.replace(/\/+$/, "")}${normalised}`;
    }
    return normalised;
  }
  const u = new URL(url);
  return u.pathname + u.search;
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)adminToken=([^;]*)/);
  return match ? match[1] : null;
}

let csrfTokenPromise: Promise<string | null> | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(resolveUrl("/api/admin/csrf-token"), {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
    return cookieMatch ? cookieMatch[1] : null;
  } catch {
    return null;
  }
}

function ensureCsrfToken(): Promise<string | null> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken();
  }
  return csrfTokenPromise;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T = unknown>(
  method: string,
  url: string,
  body?: unknown,
  tokenOverride?: string,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenOverride ?? getTokenFromCookie();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (method !== "GET") {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      headers["x-csrf-token"] = csrf;
    }
  }

  const res = await fetch(resolveUrl(url), {
    method,
    headers,
    credentials: "include",
    body: isFormData
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  // Handle non-JSON responses gracefully
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiClientError(
      `Unexpected response (status ${res.status})`,
      res.status,
      text.slice(0, 500),
    );
  }

  if (res.ok === false || json._status === false) {
    throw new ApiClientError(
      (json._message as string) ?? (json.message as string) ?? `Request failed with status ${res.status}`,
      res.status,
      json,
    );
  }

  // Return _data if present, otherwise the full response
  if (json._data !== undefined) {
    return json._data as T;
  }

  return json as T;
}

async function requestRaw<T = unknown>(
  method: string,
  url: string,
  body?: unknown,
  tokenOverride?: string,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenOverride ?? getTokenFromCookie();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (method !== "GET") {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      headers["x-csrf-token"] = csrf;
    }
  }

  const res = await fetch(resolveUrl(url), {
    method,
    headers,
    credentials: "include",
    body: isFormData
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiClientError(
      `Unexpected response (status ${res.status})`,
      res.status,
      text.slice(0, 500),
    );
  }

  if (res.ok === false || json._status === false) {
    throw new ApiClientError(
      (json._message as string) ?? (json.message as string) ?? `Request failed with status ${res.status}`,
      res.status,
      json,
    );
  }

  return json as T;
}

if (typeof document !== "undefined") {
  ensureCsrfToken();
}

export const api = {
  get<T = unknown>(url: string, tokenOverride?: string): Promise<T> {
    return request<T>("GET", url, undefined, tokenOverride);
  },

  post<T = unknown>(url: string, body?: unknown, tokenOverride?: string): Promise<T> {
    return request<T>("POST", url, body, tokenOverride);
  },

  put<T = unknown>(url: string, body?: unknown, tokenOverride?: string): Promise<T> {
    return request<T>("PUT", url, body, tokenOverride);
  },

  del<T = unknown>(url: string, tokenOverride?: string): Promise<T> {
    return request<T>("DELETE", url, undefined, tokenOverride);
  },

  /** Like post() but returns the full response JSON without extracting `_data`. */
  postRaw<T = unknown>(url: string, body?: unknown, tokenOverride?: string): Promise<T> {
    return requestRaw<T>("POST", url, body, tokenOverride);
  },
};
