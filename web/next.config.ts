import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  script-src 'self' https://checkout.razorpay.com 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.r2.dev https://cdn.jewellerywalla.com https://lh3.googleusercontent.com;
  font-src 'self' data:;
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"};
  frame-src https://*.razorpay.com;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheLife: {
    // Products: price/stock changes propagate quickly
    products: {
      stale: 300,       // 5 min  — serve stale while revalidating
      revalidate: 1800, // 30 min — max age before re-fetch
      expire: 7200,     // 2 hr   — hard expiry from cache store
    },
    // Homepage: banners, sections, testimonials, why-choose-us
    homepage: {
      stale: 600,       // 10 min
      revalidate: 3600, // 1 hr
      expire: 21600,    // 6 hr
    },
    // Categories: hierarchy changes rarely
    categories: {
      stale: 3600,       // 1 hr
      revalidate: 86400, // 24 hr
      expire: 604800,    // 7 days
    },
    // Filters: colors, materials — very stable
    filters: {
      stale: 3600,
      revalidate: 86400,
      expire: 604800,
    },
    // FAQ content: almost never changes
    faq: {
      stale: 86400,       // 24 hr
      revalidate: 604800, // 7 days
      expire: 2592000,    // 30 days
    },
    // Testimonials
    testimonials: {
      stale: 3600,
      revalidate: 86400,
      expire: 604800,
    },
    // Search results
    search: {
      stale: 300,
      revalidate: 1800,
      expire: 7200,
    },
    // Navigation menu
    navigation: {
      stale: 86400,
      revalidate: 604800,
      expire: 2592000,
    },
    // Best sellers / flash sale product lists
    "best-sellers": {
      stale: 300,
      revalidate: 1800,
      expire: 7200,
    },
    // Tab products (silver/gold/gift)
    tabs: {
      stale: 300,
      revalidate: 3600,
      expire: 14400,
    },
    // Default max-age profile used by revalidateTag()
    max: {
      stale: 3600,
      revalidate: 86400,
      expire: 604800,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-50951b7722e041bebc7b86688a160a35.r2.dev",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jewellerywalla.com",
      },
    ],
    deviceSizes: [360, 640, 750, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/category/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" },
        ],
      },
      {
        source: "/product-details/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" },
        ],
      },
      {
        source: "/(about-us|contact-us|faq|story|our-policy|order-track)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=900, stale-while-revalidate=3600" },
        ],
      },
      {
        source: "/(cart|checkout|order-success|profile)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
