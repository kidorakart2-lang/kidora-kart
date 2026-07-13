import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
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
        hostname: process.env.NEXT_PUBLIC_CDN_HOST || "cdn.kidorakart.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co"
      }
    ],
    deviceSizes: [360, 640, 750, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "sonner",
      "cmdk",
    ],
  },
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/";
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    return [
      // Route /api/revalidate to the web frontend (for cache invalidation)
      // so it doesn't get proxied to the backend API server.
      {
        source: "/api/revalidate",
        destination: `${frontendUrl}/api/revalidate`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}api/:path*`,
      },
    ];
  },
};

export default nextConfig;
