"use client";

/**
 * Geolocation helper for the checkout page.
 *
 * `detectLocation()` wraps the browser Geolocation API in a Promise, then
 * sends the coordinates to the backend's reverse-geocode proxy
 * (`/api/website/location/reverse-geocode`) which calls LocationIQ
 * (the API key stays server-side).
 *
 * All failure modes are returned as typed results so the caller can decide
 * how to surface them (silent no-op for auto-detect, toast for the manual
 * "Detect Location" button).
 */

export interface DetectedAddress {
  pincode?: string;
  city?: string;
  state?: string;
  area?: string;
  street?: string;
}

export type LocationResult =
  | { ok: true; address: DetectedAddress }
  | { ok: false; reason: "denied" | "unsupported" | "api" | "outside-india" };

const GEOLOCATION_TIMEOUT_MS = 10000;
const GEOLOCATION_MAX_AGE_MS = 600000; // 10 min — cached position is fine
const AUTO_DETECT_SESSION_FLAG = "geoAutoDetectAttempted";

/** True if this browser can use the Geolocation API (secure context required). */
export function isGeolocationSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    !!navigator.geolocation &&
    window.isSecureContext
  );
}

/**
 * Mark that auto-detect already ran this session (avoids re-prompting the
 * browser permission dialog on every visit to /checkout). The manual button
 * is always available regardless of this flag.
 */
export function hasAutoDetectRanThisSession(): boolean {
  try {
    return sessionStorage.getItem(AUTO_DETECT_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markAutoDetectRanThisSession(): void {
  try {
    sessionStorage.setItem(AUTO_DETECT_SESSION_FLAG, "1");
  } catch {
    // sessionStorage may be unavailable — ignore
  }
}

/**
 * Get the current position and reverse-geocode it to shipping address fields.
 * Returns `{ ok: true, address }` or a typed failure reason.
 */
export function detectLocation(): Promise<LocationResult> {
  return new Promise<LocationResult>((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({ ok: false, reason: "unsupported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch("/api/website/location/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (!response.ok) {
            resolve({
              ok: false,
              reason: response.status === 422 ? "outside-india" : "api",
            });
            return;
          }

          const data = (await response.json()) as {
            _status?: boolean;
            _data?: DetectedAddress;
          };
          if (!data._status || !data._data) {
            resolve({ ok: false, reason: "api" });
            return;
          }

          resolve({ ok: true, address: data._data });
        } catch {
          resolve({ ok: false, reason: "api" });
        }
      },
      (error) => {
        // GeolocationPositionError codes:
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (error.code === 1) {
          resolve({ ok: false, reason: "denied" });
        } else if (error.code === 2) {
          resolve({ ok: false, reason: "api" });
        } else if (error.code === 3) {
          resolve({ ok: false, reason: "api" });
        } else {
          resolve({ ok: false, reason: "denied" });
        }
      },
      {
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
        enableHighAccuracy: true,
      },
    );
  });
}
