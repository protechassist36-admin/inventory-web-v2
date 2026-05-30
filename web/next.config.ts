import type { NextConfig } from "next";
import withPWA from "next-pwa";

const config: NextConfig = {
  turbopack: {},
};

const nextConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Reverted to disable in dev
  register: true,
  skipWaiting: true,
})(config);

export default nextConfig;
