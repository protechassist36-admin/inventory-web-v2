import type { NextConfig } from "next";
import withPWA from "next-pwa";

const config: NextConfig = {
  // Standard Next.js server-side build (not static export)
  turbopack: {},
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: true, // Enabled for debugging production error
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

const nextConfig = withPWA({
  dest: "public",
  disable: true, // Temporarily disabled for testing
  register: true,
  skipWaiting: true,
})(config);

export default nextConfig;
