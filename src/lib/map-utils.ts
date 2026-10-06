import type { Competitor } from "@/types/scan";

// Fits the 3D globe within the viewport regardless of window aspect ratio.
export function getOptimalGlobeZoom(
  width: number,
  height: number,
  targetRatio = 0.7,
): number {
  if (!width || !height) return 1.35;
  const minDim = Math.min(width, height);
  const targetDiameter = minDim * targetRatio;
  const fovRad = (36.86989764584402 * Math.PI) / 180;
  const focalLength = height / 2 / Math.tan(fovRad / 2);
  const targetRadius = targetDiameter / 2;
  const t = targetRadius / focalLength;
  const s = t / Math.sqrt(1 + t * t);
  const globeRadius = (s / (1 - s)) * focalLength;
  const zoom = Math.log2((2 * Math.PI * globeRadius) / 512);
  return Math.max(0.4, Math.min(2.5, Number(zoom.toFixed(2))));
}

export function pinColor(rating: number | undefined): string {
  if (rating == null) return "#71717a";
  if (rating >= 4.3) return "#16a34a";
  if (rating >= 3.7) return "#d97706";
  return "#dc2626";
}

export function competitorKey(c: Competitor): string {
  return `${c.title}-${c.lat}-${c.lng}`;
}
