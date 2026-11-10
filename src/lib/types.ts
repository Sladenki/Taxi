import type { LineString } from "geojson";

/** MapLibre and GeoJSON axis order: longitude, then latitude. */
export type LngLat = [number, number];

export type PickTarget = "a" | "b";

export type PlaybackState = "idle" | "moving" | "paused" | "done";

export interface DrivingRoute {
  geometry: LineString;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteErrorBody {
  error: string;
  code: string;
}
