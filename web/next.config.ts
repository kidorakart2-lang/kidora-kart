import type { NextConfig } from "next";
import { CACHE } from "./src/lib/cache-config";

const csp = `
  default-src 'self';
  script-src 'self' https://checkout.razorpay.com https://challenges.cloudflare.com 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.r2.dev https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com"} https://lh3.googleusercontent.com https://cdn.jsdelivr.net;
  font-src 'self' data:;
  connect-src 'self' https://challenges.cloudflare.com;
  frame-src https://*.razorpay.com https://challenges.cloudflare.com https://www.youtube.com https://www.google.com https://*.google.com;
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: CACHE,
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-50951b7722e041bebc7b86688a160a35.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-fd92fbed57584d69b870af038bded473.r2.dev",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jewellerywalla.com",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            // geolocation is intentionally NOT restricted — the checkout page
            // uses the browser Geolocation API to auto-fill shipping addresses.
            value: "camera=(), microphone=()",
          },
        ],
      },
      {
        source: "/category/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/product-details/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/(contact-us|faq|our-policy|order-track)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=900, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/(cart|checkout|order-success|profile)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Allow the admin panel (cross-origin) to call the revalidation endpoint.
      // The endpoint is already protected by Bearer token auth, so we can be
      // permissive with the allowed origin.
      {
        source: "/api/revalidate",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/"
        }api/:path*`,
      },
    ];
  },
};

export default nextConfig;
