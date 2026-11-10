import { NextResponse } from "next/server";

import { formatOsrmCoordinate, isLngLat } from "@/lib/coordinates";
import { pointsAreTooClose } from "@/lib/route-animation";
import type { LngLat } from "@/lib/types";

interface OsrmResponse {
  code?: string;
  message?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      type?: string;
      coordinates?: number[][];
    };
  }>;
}

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function osrmBaseUrl(): string {
  const raw = process.env.OSRM_URL?.trim() || "https://router.project-osrm.org";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("OSRM_URL is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OSRM_URL must use http or https");
  }
  const path = url.pathname.replace(/\/$/, "");
  return `${url.origin}${path}`;
}

function osrmFailureMessage(code: string | undefined): { status: number; errorCode: string; error: string } {
  if (code === "NoRoute" || code === "NoSegment") {
    return {
      status: 404,
      errorCode: "NO_ROUTE",
      error:
        code === "NoSegment"
          ? "Не удалось привязать точку к дороге. Сместите маркер ближе к проезжей части."
          : "Между точками нет автомобильного маршрута.",
    };
  }
  return {
    status: 502,
    errorCode: "OSRM_ERROR",
    error: "Сервер маршрутов не смог построить маршрут. Повторите запрос.",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Тело запроса должно быть JSON.");
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (!isLngLat(record.from) || !isLngLat(record.to)) {
    return jsonError(
      400,
      "INVALID_COORDINATES",
      "Нужны координаты точек A и B в порядке [долгота, широта].",
    );
  }

  const from: LngLat = [record.from[0], record.from[1]];
  const to: LngLat = [record.to[0], record.to[1]];
  if (pointsAreTooClose(from, to)) {
    return jsonError(400, "POINTS_TOO_CLOSE", "Точки слишком близко друг к другу.");
  }

  let base: string;
  try {
    base = osrmBaseUrl();
  } catch {
    return jsonError(500, "OSRM_CONFIG", "Адрес сервера маршрутов задан некорректно.");
  }

  // OSRM expects longitude,latitude. The driving profile returns the fastest route, not the shortest.
  const path = `${base}/route/v1/driving/${formatOsrmCoordinate(from)};${formatOsrmCoordinate(to)}`;
  const url = `${path}?overview=full&geometries=geojson&steps=true`;

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: "application/json",
        "User-Agent": "narodnoe-taxi/0.1",
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return jsonError(
      502,
      "OSRM_UNAVAILABLE",
      timedOut
        ? "Сервер маршрутов не ответил вовремя. Повторите запрос."
        : "Сервер маршрутов недоступен. Повторите запрос.",
    );
  }

  if (!response.ok) {
    return jsonError(502, "OSRM_UNAVAILABLE", "Сервер маршрутов недоступен. Повторите запрос.");
  }

  let payload: OsrmResponse;
  try {
    payload = (await response.json()) as OsrmResponse;
  } catch {
    return jsonError(502, "OSRM_ERROR", "Сервер маршрутов вернул некорректный ответ. Повторите запрос.");
  }

  if (payload.code !== "Ok") {
    const failure = osrmFailureMessage(payload.code);
    return jsonError(failure.status, failure.errorCode, failure.error);
  }

  const route = payload.routes?.[0];
  const geometry = route?.geometry;
  const coordinates = geometry?.coordinates;
  if (
    geometry?.type !== "LineString" ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    typeof route?.distance !== "number" ||
    typeof route?.duration !== "number" ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration)
  ) {
    return jsonError(502, "OSRM_ERROR", "Сервер маршрутов не вернул геометрию маршрута.");
  }

  const line = coordinates.map((position) => {
    if (!Array.isArray(position) || position.length < 2) return null;
    const lon = Number(position[0]);
    const lat = Number(position[1]);
    if (!isLngLat([lon, lat])) return null;
    return [lon, lat] as LngLat;
  });

  if (line.some((position) => position === null)) {
    return jsonError(502, "OSRM_ERROR", "Геометрия маршрута содержит некорректные координаты.");
  }

  return NextResponse.json({
    geometry: { type: "LineString", coordinates: line },
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  });
}
