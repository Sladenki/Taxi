import type { LngLat } from "@/lib/types";

export function isLngLat(value: unknown): value is LngLat {
  if (!Array.isArray(value) || value.length < 2) return false;
  const lon = value[0];
  const lat = value[1];
  return (
    typeof lon === "number" &&
    typeof lat === "number" &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    lon >= -180 &&
    lon <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export function formatOsrmCoordinate(point: LngLat): string {
  return `${point[0].toFixed(6)},${point[1].toFixed(6)}`;
}
