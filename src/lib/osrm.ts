import type { LineString } from "geojson";

import { isLngLat } from "@/lib/coordinates";
import type { DrivingRoute, LngLat, RouteErrorBody } from "@/lib/types";

export class RouteRequestError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "RouteRequestError";
    this.code = code;
  }
}

function isRouteError(value: unknown): value is RouteErrorBody {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.error === "string" && typeof record.code === "string";
}

function isDrivingRoute(value: unknown): value is DrivingRoute {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const geometry = record.geometry;
  if (!geometry || typeof geometry !== "object") return false;
  const line = geometry as LineString;
  if (line.type !== "LineString" || !Array.isArray(line.coordinates) || line.coordinates.length < 2) {
    return false;
  }
  if (!line.coordinates.every((position) => isLngLat(position))) return false;
  return typeof record.distanceMeters === "number" && typeof record.durationSeconds === "number";
}

export async function fetchDrivingRoute(
  from: LngLat,
  to: LngLat,
  signal: AbortSignal,
): Promise<DrivingRoute> {
  let response: Response;
  try {
    response = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new RouteRequestError(
      "Не удалось связаться с сервером маршрутов. Повторите запрос.",
      "NETWORK",
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (isRouteError(payload)) throw new RouteRequestError(payload.error, payload.code);
    throw new RouteRequestError("Не удалось построить маршрут. Повторите запрос.", "ROUTE_ERROR");
  }

  if (!isDrivingRoute(payload)) {
    throw new RouteRequestError("Сервер вернул некорректный маршрут.", "ROUTE_ERROR");
  }

  return {
    geometry: {
      type: "LineString",
      coordinates: payload.geometry.coordinates.map((position) => [position[0], position[1]]),
    },
    distanceMeters: payload.distanceMeters,
    durationSeconds: payload.durationSeconds,
  };
}
