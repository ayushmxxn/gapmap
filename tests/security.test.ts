import { describe, expect, it } from "vitest";
import { extractClientIp, isValidIp } from "@/lib/rate-limit";
import { getScanCacheKey } from "@/lib/scan-cache";
import { POST } from "@/app/api/scan/route";

describe("Security Hardening: IP Extraction & Validation", () => {
  it("validates legitimate IPv4 and IPv6 addresses", () => {
    expect(isValidIp("127.0.0.1")).toBe(true);
    expect(isValidIp("192.168.1.100")).toBe(true);
    expect(isValidIp("10.0.0.1:8080")).toBe(true);
    expect(isValidIp("::1")).toBe(true);
    expect(isValidIp("2001:db8::1")).toBe(true);

    expect(isValidIp("")).toBe(false);
    expect(isValidIp("malicious-host")).toBe(false);
    expect(isValidIp("1.2.3.4.5")).toBe(false);
    expect(isValidIp("<script>")).toBe(false);
  });

  it("prioritizes cf-connecting-ip on Cloudflare Workers", () => {
    const req = new Request("https://gapmap.app/api/scan", {
      headers: {
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 10.0.0.1",
        "x-real-ip": "198.51.100.2",
      },
    });
    expect(extractClientIp(req)).toBe("203.0.113.195");
  });

  it("prioritizes x-vercel-forwarded-for on Vercel edge", () => {
    const req = new Request("https://gapmap.app/api/scan", {
      headers: {
        "x-vercel-forwarded-for": "198.51.100.50",
        "x-forwarded-for": "spoofed-client-ip, 198.51.100.1",
        "x-real-ip": "198.51.100.2",
      },
    });
    expect(extractClientIp(req)).toBe("198.51.100.50");
  });

  it("selects rightmost valid IP from x-forwarded-for to defeat client-spoofed leftmost IPs", () => {
    const req = new Request("https://gapmap.app/api/scan", {
      headers: {
        // Attacker injected 1.1.1.1, proxy appended 198.51.100.25
        "x-forwarded-for": "1.1.1.1, 198.51.100.25",
      },
    });
    expect(extractClientIp(req)).toBe("198.51.100.25");
  });

  it("falls back to 127.0.0.1 when all proxy headers are missing or malformed", () => {
    const req = new Request("https://gapmap.app/api/scan", {
      headers: {
        "x-forwarded-for": "malicious-header-injection",
      },
    });
    expect(extractClientIp(req)).toBe("127.0.0.1");
  });
});

describe("Security Hardening: City-Wide Cache Key Quantization", () => {
  it("reuses the cache key for identical city scans regardless of micro-coordinate variance", () => {
    const key1 = getScanCacheKey({
      lat: 28.6139,
      lng: 77.209,
      categoryId: "cafe",
      scope: "city",
      cityName: "Delhi",
    });

    const key2 = getScanCacheKey({
      lat: 28.7041,
      lng: 77.1025,
      categoryId: "Cafe",
      scope: "city",
      cityName: "delhi",
    });

    expect(key1).toBe("city:cafe:delhi");
    expect(key1).toBe(key2);
  });

  it("preserves distinct coordinate resolution for neighborhood-scoped scans", () => {
    const key1 = getScanCacheKey({
      lat: 28.6139,
      lng: 77.209,
      categoryId: "cafe",
      scope: "neighborhood",
      cityName: "Delhi",
    });

    const key2 = getScanCacheKey({
      lat: 28.7041,
      lng: 77.1025,
      categoryId: "cafe",
      scope: "neighborhood",
      cityName: "Delhi",
    });

    expect(key1).not.toBe(key2);
    expect(key1).toBe("neighborhood:cafe:28.6139:77.2090");
  });
});

describe("Security Hardening: POST /api/scan Cross-Origin Protections", () => {
  it("rejects non-JSON Content-Type with 415 Unsupported Media Type", async () => {
    const req = new Request("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
      },
      body: JSON.stringify({
        lat: 28.6139,
        lng: 77.209,
        categoryId: "cafe",
        areaLabel: "Delhi",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(415);
    const data = await res.json();
    expect(data.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects explicit cross-site browser requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
        origin: "https://evil-attacker.com",
      },
      body: JSON.stringify({
        lat: 28.6139,
        lng: 77.209,
        categoryId: "cafe",
        areaLabel: "Delhi",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe("FORBIDDEN");
  });

  it("rejects mismatched origin headers with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://evil-attacker.com",
      },
      body: JSON.stringify({
        lat: 28.6139,
        lng: 77.209,
        categoryId: "cafe",
        areaLabel: "Delhi",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe("FORBIDDEN");
  });

  it("allows valid same-origin JSON requests", async () => {
    const req = new Request("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        lat: 28.6139,
        lng: 77.209,
        categoryId: "cafe",
        areaLabel: "Delhi",
      }),
    });

    const res = await POST(req);
    // In mock mode (default), returns 200 with mock scan result
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.category.id).toBe("cafe");
  });
});
