import { clientEnv } from "@/lib/env";

export const MAPBOX_DEFAULT_CENTER: [number, number] = [0, 20];
export const MAPBOX_DEFAULT_ZOOM = 1.5;
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
/** Photorealistic Earth for the globe discovery view. */
export const MAPBOX_SATELLITE = "mapbox://styles/mapbox/standard-satellite";

export function getMapboxToken(): string {
  return clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;
}

export function isMapboxConfigured(): boolean {
  return getMapboxToken().length > 0;
}
