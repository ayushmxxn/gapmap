import type { NextConfig } from "next";
import os from "node:os";

// Automatically discover host machine LAN IP addresses (e.g. 192.168.x.x)
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && !i.internal && i.family === "IPv4")
  .map((i) => i?.address)
  .filter(Boolean) as string[];

const nextConfig: NextConfig = {
  // Allow LAN development access and HMR WebSocket connections from phones on the local network
  allowedDevOrigins: [
    ...localIps,
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "*.local",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        ...localIps,
        "192.168.*.*",
        "10.*.*.*",
        "172.16.*.*",
        "*.local",
      ],
    },
  },
};

export default nextConfig;
