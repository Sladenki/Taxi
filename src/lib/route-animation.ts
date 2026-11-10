import type { LngLat } from "./types";

const EARTH_RADIUS_METERS = 6_371_000;

export const MIN_ROUTE_METERS = 20;

export interface RoutePath {
  coordinates: LngLat[];
  cumulative: number[];
  total: number;
}

export function haversine(from: LngLat, to: LngLat): number {
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const dLat = ((to[1] - from[1]) * Math.PI) / 180;
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Clockwise degrees from true north. Matches MapLibre marker rotation. */
export function geographicBearing(from: LngLat, to: LngLat): number {
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function pointsAreTooClose(from: LngLat, to: LngLat): boolean {
  return haversine(from, to) < MIN_ROUTE_METERS;
}

export function buildRoutePath(coordinates: ReadonlyArray<readonly number[]>): RoutePath {
  const cleaned: LngLat[] = [];

  for (const position of coordinates) {
    const lon = position[0];
    const lat = position[1];
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const next: LngLat = [lon, lat];
    const previous = cleaned[cleaned.length - 1];
    if (previous && haversine(previous, next) < 0.05) continue;
    cleaned.push(next);
  }

  const cumulative = [0];
  for (let index = 1; index < cleaned.length; index += 1) {
    cumulative.push(cumulative[index - 1] + haversine(cleaned[index - 1], cleaned[index]));
  }

  return {
    coordinates: cleaned,
    cumulative,
    total: cumulative[cumulative.length - 1] ?? 0,
  };
}

function pointAt(path: RoutePath, distance: number): LngLat {
  const { coordinates, cumulative, total } = path;
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1 || total === 0) return coordinates[0];

  const target = Math.min(Math.max(distance, 0), total);
  let index = 1;
  while (index < cumulative.length - 1 && cumulative[index] < target) index += 1;

  const start = cumulative[index - 1];
  const end = cumulative[index];
  const span = end - start;
  const ratio = span === 0 ? 0 : (target - start) / span;
  const from = coordinates[index - 1];
  const to = coordinates[index];
  return [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
}

export function positionAt(
  path: RoutePath,
  distance: number,
): { position: LngLat; bearing: number } {
  const position = pointAt(path, distance);
  if (path.coordinates.length < 2 || path.total === 0) {
    return { position, bearing: 0 };
  }

  const ahead = Math.min(path.total, Math.max(distance, 0) + 12);
  const behind = Math.max(0, ahead - 12);
  const from = pointAt(path, behind);
  const to = pointAt(path, ahead);
  if (haversine(from, to) < 0.2) {
    return { position, bearing: 0 };
  }
  return { position, bearing: geographicBearing(from, to) };
}
