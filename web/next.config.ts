import type { NextConfig } from "next";
import withPWA from "next-pwa";

const config: NextConfig = {
  // Removed output: 'export' to support dynamic Server Actions, Auth, and API routes
  // Required for /login, /register, and /setup-organization to function correctly
  
  turbopack: {},
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const nextConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(config);

export default nextConfig;
