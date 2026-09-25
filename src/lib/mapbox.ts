import { clientEnv } from "@/lib/env";

export const MAPBOX_DEFAULT_CENTER: [number, number] = [0, 20];
export const MAPBOX_DEFAULT_ZOOM = 1.5;
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

export function getMapboxToken(): string {
  return clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;
}

export function isMapboxConfigured(): boolean {
  return getMapboxToken().length > 0;
}
