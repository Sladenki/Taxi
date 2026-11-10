import type { LngLat } from "@/lib/types";

const distanceFormat = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${distanceFormat.format(meters / 1000)} км`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "меньше минуты";
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}

/** Human-readable latitude first. Stored coordinates stay [longitude, latitude]. */
export function formatPoint(point: LngLat | null): string {
  if (!point) return "";
  const [lon, lat] = point;
  const latitude = `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? "с.ш." : "ю.ш."}`;
  const longitude = `${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? "в.д." : "з.д."}`;
  return `${latitude}, ${longitude}`;
}
