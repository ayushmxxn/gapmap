import type { Competitor } from "@/types/scan";

/**
 * Calculates the exact Mapbox globe camera zoom level required to fit the entire Earth
 * sphere within the container with comfortable breathing room on all sides.
 */
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

/**
 * Returns a consistent semantic color hex code corresponding to competitor review ratings.
 */
export function pinColor(rating: number | undefined): string {
  if (rating == null) return "#71717a";
  if (rating >= 4.3) return "#16a34a";
  if (rating >= 3.7) return "#d97706";
  return "#dc2626";
}

/**
 * Deterministic unique identifier for a competitor map pin.
 */
export function competitorKey(c: Competitor): string {
  return `${c.title}-${c.lat}-${c.lng}`;
}
