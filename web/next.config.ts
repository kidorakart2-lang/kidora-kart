import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  script-src 'self' https://checkout.razorpay.com 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.r2.dev https://lh3.googleusercontent.com;
  font-src 'self' data:;
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"};
  frame-src https://*.razorpay.com;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    ];
  },
};

export default nextConfig;
