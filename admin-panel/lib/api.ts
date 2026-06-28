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
 * - Include `credentials: "include"` automatically
 * - Parse `_status` and throw on failure with `_message`
 * - Return `_data` when present, otherwise the full response JSON
 * - Accept both JSON objects and FormData (auto-detected)
 * - Gracefully handle non-JSON responses (e.g. 500 HTML error pages)
 */

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
): Promise<T> {
  const isFormData = body instanceof FormData;

  const res = await fetch(url, {
    method,
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
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
      (json._message as string) ?? `Request failed with status ${res.status}`,
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

export const api = {
  get<T = unknown>(url: string): Promise<T> {
    return request<T>("GET", url);
  },

  post<T = unknown>(url: string, body?: unknown): Promise<T> {
    return request<T>("POST", url, body);
  },

  put<T = unknown>(url: string, body?: unknown): Promise<T> {
    return request<T>("PUT", url, body);
  },

  del<T = unknown>(url: string): Promise<T> {
    return request<T>("DELETE", url);
  },
};
