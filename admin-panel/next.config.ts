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
        hostname: "cdn.jewellerywalla.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    deviceSizes: [360, 640, 750, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}api/:path*`,
      },
    ];
  },
};

export default nextConfig;
