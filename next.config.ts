import type { NextConfig } from "next";
import os from "node:os";

// Automatically discover host machine LAN IP addresses (e.g. 192.168.x.x)
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && !i.internal && i.family === "IPv4")
  .map((i) => i?.address)
  .filter(Boolean) as string[];

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  // Allow LAN development access and HMR WebSocket connections from phones on the local network
  allowedDevOrigins: [
    ...localIps,
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "*.local",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
