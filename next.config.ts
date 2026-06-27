import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "greenroute.hoangtu.dev",
    "*.trycloudflare.com",
    "*.pinggy.link",
    "*.localtunnel.me"
  ]
};

export default nextConfig;
