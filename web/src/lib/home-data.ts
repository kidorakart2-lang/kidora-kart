/**
 * Server-only data fetching helpers for the home page.
 *
 * Extracted into this file so they stay server-only even when imported
 * by components that are dynamically loaded (and thus treated as Client
 * Component boundaries by Next.js).
 *
 * All functions use `"use cache"` for tag-based revalidation.
 */

import { cacheLife, cacheTag } from "next/cache";
import {
  TAG_PRODUCTS,
  TAG_HOMEPAGE,
  TAG_TESTIMONIALS,
} from "@/lib/revalidation-tags";
import type { BannerItem } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────

export interface HomeSection {
  _id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

// ── Home page sections ─────────────────────────────────────────────────

export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const res = await fetch(
      "/api/website/home-page",
    );
    const data = await res.json();
    return (data._data?.sections ?? []) as HomeSection[];
  } catch {
    return [];
  }
}

// ── Banners ────────────────────────────────────────────────────────────

export async function getWebsiteBanners(): Promise<BannerItem[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const res = await fetch(
      "/api/website/banner",
    );
    const data = await res.json();
    return (data._data as BannerItem[]) ?? [];
  } catch {
    return [];
  }
}

// ── Products ───────────────────────────────────────────────────────────

export async function fetchProducts(
  source: string,
  limit: number,
): Promise<any[]> {
  "use cache";
  cacheLife("products");
  cacheTag(TAG_PRODUCTS);

  try {
    const res = await fetch(`/api/website/product/${source}?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}

export async function fetchProductsBySearch(
  term: string,
): Promise<any[]> {
  "use cache";
  cacheLife("search");
  cacheTag(TAG_PRODUCTS);

  try {
    const res = await fetch(`/api/website/product/get-by-search?search=${encodeURIComponent(term)}&limit=8`);
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}

// ── Testimonials ───────────────────────────────────────────────────────

export async function fetchTestimonials(): Promise<any> {
  "use cache";
  cacheLife("testimonials");
  cacheTag(TAG_TESTIMONIALS, TAG_HOMEPAGE);

  try {
    const res = await fetch(
      "/api/website/testimonial",
    );
    const data = await res.json();
    return data._data;
  } catch {
    return null;
  }
}
