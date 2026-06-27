/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint errors must fail the build during the migration
  // (previously these were suppressed, hiding type issues).
  // Note: Next 16 no longer supports `eslint.ignoreDuringBuilds` in this config.

  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
