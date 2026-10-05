import { clientEnv } from "@/lib/env";

export const MAPBOX_DEFAULT_CENTER: [number, number] = [0, 20];
export const MAPBOX_DEFAULT_ZOOM = 1.5;
export const MAPBOX_STYLE = "mapbox://styles/mapbox/outdoors-v12";
export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/outdoors-v12";
/** Natural terrain and vibrant waterways for discovery view. */
export const MAPBOX_SATELLITE = "mapbox://styles/mapbox/outdoors-v12";

export function getMapboxToken(): string {
  return clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;
}

export function isMapboxConfigured(): boolean {
  return getMapboxToken().length > 0;
}
