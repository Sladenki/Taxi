import type { LngLat } from "@/lib/types";

export const PMTILES_PATH = "/maps/kaliningrad.pmtiles";

/**
 * Bounds read from the archive header.
 * The stored center (20°E, 54°N) falls outside these bounds, so the camera
 * uses the bounds themselves instead of that center.
 */
export const ARCHIVE_BOUNDS = {
  minLon: 20.2719999,
  minLat: 54.63,
  maxLon: 20.691,
  maxLat: 54.783,
} as const;

export const FALLBACK_CENTER: LngLat = [
  (ARCHIVE_BOUNDS.minLon + ARCHIVE_BOUNDS.maxLon) / 2,
  (ARCHIVE_BOUNDS.minLat + ARCHIVE_BOUNDS.maxLat) / 2,
];

export const MAP_MIN_ZOOM = 10;
export const MAP_MAX_ZOOM = 17;

export function pmtilesHttpUrl(origin: string): string {
  return `${origin}${PMTILES_PATH}`;
}

export function pmtilesProtocolUrl(origin: string): string {
  return `pmtiles://${pmtilesHttpUrl(origin)}`;
}

export class MapLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapLoadError";
  }
}

export async function probePmtiles(url: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Range: "bytes=0-127" },
      cache: "no-store",
    });
  } catch {
    throw new MapLoadError(
      "Не удалось запросить файл карты. Проверьте, что приложение запущено, и откройте его ещё раз.",
    );
  }

  if (response.status === 404) {
    throw new MapLoadError("Файл карты не найден: /maps/kaliningrad.pmtiles.");
  }

  if (response.status !== 206) {
    throw new MapLoadError(
      "Сервер не отдаёт kaliningrad.pmtiles диапазонами байтов. Без ответа HTTP 206 архив PMTiles прочитать нельзя.",
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const magic = new TextDecoder().decode(bytes.subarray(0, 7));
  if (magic !== "PMTiles") {
    throw new MapLoadError("По пути карты лежит не архив PMTiles.");
  }
}
