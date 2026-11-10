"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  addProtocol,
  removeProtocol,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import type { LineString } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

import { AnimatedCar } from "@/components/map/AnimatedCar";
import { RouteMarkers } from "@/components/map/RouteMarkers";
import {
  ARCHIVE_BOUNDS,
  FALLBACK_CENTER,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MapLoadError,
  pmtilesHttpUrl,
  probePmtiles,
} from "@/lib/map-config";
import { createBasemapStyle, FIRST_LABEL_LAYER_ID, type MapThemeName } from "@/lib/map-style";
import type { LngLat, PickTarget, PlaybackState } from "@/lib/types";

const ROUTE_SOURCE = "route";
const ROUTE_CASING = "route-casing";
const ROUTE_LINE = "route-line";

interface KaliningradMapProps {
  theme: MapThemeName;
  pointA: LngLat | null;
  pointB: LngLat | null;
  pickTarget: PickTarget | null;
  route: LineString | null;
  playback: PlaybackState;
  runId: number;
  speedKmh: number;
  onPick: (target: PickTarget, point: LngLat) => void;
  onChangeA: (point: LngLat) => void;
  onChangeB: (point: LngLat) => void;
  onPlaybackChange: (state: PlaybackState) => void;
  onProgress: (ratio: number) => void;
  onReady: () => void;
  onFatal: (message: string) => void;
  onWarning: (message: string | null) => void;
}

export function KaliningradMap({
  theme,
  pointA,
  pointB,
  pickTarget,
  route,
  playback,
  runId,
  speedKmh,
  onPick,
  onChangeA,
  onChangeB,
  onPlaybackChange,
  onProgress,
  onReady,
  onFatal,
  onWarning,
}: KaliningradMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const themeRef = useRef(theme);
  const pickRef = useRef(pickTarget);
  const onPickRef = useRef(onPick);
  const onReadyRef = useRef(onReady);
  const onFatalRef = useRef(onFatal);
  const onWarningRef = useRef(onWarning);
  const fittedRoute = useRef<LineString | null>(null);

  useLayoutEffect(() => {
    pickRef.current = pickTarget;
    onPickRef.current = onPick;
    onReadyRef.current = onReady;
    onFatalRef.current = onFatal;
    onWarningRef.current = onWarning;
  }, [pickTarget, onPick, onReady, onFatal, onWarning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mapInstance: MapLibreMap | null = null;
    let cancelled = false;
    const signal = { cancelled: false };

    void (async () => {
      try {
        const origin = window.location.origin;
        await probePmtiles(pmtilesHttpUrl(origin));
        if (cancelled) return;

        const { Protocol } = await import("pmtiles");
        if (cancelled) return;

        try {
          removeProtocol("pmtiles");
        } catch {
          // The protocol is not registered yet.
        }

        try {
          const protocol = new Protocol();
          addProtocol("pmtiles", protocol.tile as Parameters<typeof addProtocol>[1]);
        } catch {
          onFatalRef.current("Не удалось зарегистрировать протокол PMTiles.");
          return;
        }

        setWorkerUrl("/workers/maplibre-gl-worker.js");

        const created = new MapLibreMap({
          container,
          style: createBasemapStyle(themeRef.current, origin),
          center: FALLBACK_CENTER,
          zoom: 11,
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
          maxBounds: [
            [ARCHIVE_BOUNDS.minLon - 0.08, ARCHIVE_BOUNDS.minLat - 0.06],
            [ARCHIVE_BOUNDS.maxLon + 0.08, ARCHIVE_BOUNDS.maxLat + 0.06],
          ],
          attributionControl: {
            compact: false,
            customAttribution:
              '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>',
          },
          maplibreLogo: false,
          locale: {
            "NavigationControl.ZoomIn": "Приблизить",
            "NavigationControl.ZoomOut": "Отдалить",
            "NavigationControl.ResetBearing": "Сбросить поворот",
            "AttributionControl.ToggleAttribution": "Атрибуция",
            "ScaleControl.Meters": "м",
            "ScaleControl.Kilometers": "км",
          },
          fadeDuration: 0,
        });
        mapInstance = created;

        created.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
        created.addControl(new ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

        let warned = false;
        created.on("error", (event) => {
          const message = event.error instanceof Error ? event.error.message : "";
          if (/glyph|font|sprite/i.test(message)) {
            if (!warned) {
              warned = true;
              onWarningRef.current("Подписи карты загрузились не полностью.");
            }
            return;
          }
          if (!warned && message) {
            warned = true;
            onWarningRef.current("Не удалось загрузить часть векторных тайлов. Повторите открытие карты.");
          }
        });

        created.once("load", () => {
          if (cancelled) return;
          setMap(created);
          onReadyRef.current();
          void fitArchive(created, origin, signal);
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof MapLoadError ? error.message : "Не удалось открыть карту Калининграда.";
        onFatalRef.current(message);
      }
    })();

    return () => {
      cancelled = true;
      signal.cancelled = true;
      mapInstance?.remove();
      setMap(null);
      try {
        removeProtocol("pmtiles");
      } catch {
        // Already removed.
      }
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    if (themeRef.current === theme) return;
    themeRef.current = theme;
    map.setStyle(createBasemapStyle(theme, window.location.origin));
  }, [map, theme]);

  useEffect(() => {
    if (!map) return;
    const onClick = (event: { lngLat: { lng: number; lat: number } }) => {
      const target = pickRef.current;
      if (!target) return;
      onPickRef.current(target, [event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", onClick);
    map.getCanvas().style.cursor = pickTarget ? "crosshair" : "";
    return () => {
      map.off("click", onClick);
    };
  }, [map, pickTarget]);

  useEffect(() => {
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      syncRoute(map, route, themeRef.current);
      if (route && fittedRoute.current !== route) {
        fittedRoute.current = route;
        fitRoute(map, route);
      }
      if (!route) fittedRoute.current = null;
    };

    map.on("style.load", apply);
    apply();
    return () => {
      map.off("style.load", apply);
    };
  }, [map, route]);

  return (
    <>
      <div className="map-canvas" ref={containerRef} aria-label="Карта Калининграда" />
      <RouteMarkers map={map} pointA={pointA} pointB={pointB} onChangeA={onChangeA} onChangeB={onChangeB} />
      <AnimatedCar
        map={map}
        coordinates={route?.coordinates ?? null}
        playback={playback}
        runId={runId}
        speedKmh={speedKmh}
        onPlaybackChange={onPlaybackChange}
        onProgress={onProgress}
      />
    </>
  );
}

async function fitArchive(map: MapLibreMap, origin: string, signal: { cancelled: boolean }) {
  try {
    const { PMTiles } = await import("pmtiles");
    const header = await new PMTiles(pmtilesHttpUrl(origin)).getHeader();
    if (signal.cancelled) return;
    const plausible =
      header.maxLon > header.minLon &&
      header.maxLat > header.minLat &&
      header.maxLon - header.minLon < 5 &&
      header.maxLat - header.minLat < 5;
    if (!plausible) throw new Error("implausible bounds");
    map.fitBounds(
      [
        [header.minLon, header.minLat],
        [header.maxLon, header.maxLat],
      ],
      { padding: 36, duration: 0, maxZoom: 12.6 },
    );
  } catch {
    if (signal.cancelled) return;
    map.fitBounds(
      [
        [ARCHIVE_BOUNDS.minLon, ARCHIVE_BOUNDS.minLat],
        [ARCHIVE_BOUNDS.maxLon, ARCHIVE_BOUNDS.maxLat],
      ],
      { padding: 36, duration: 0, maxZoom: 12.6 },
    );
  }
}

function fitRoute(map: MapLibreMap, route: LineString) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const position of route.coordinates) {
    minLon = Math.min(minLon, position[0]);
    minLat = Math.min(minLat, position[1]);
    maxLon = Math.max(maxLon, position[0]);
    maxLat = Math.max(maxLat, position[1]);
  }

  const narrow = window.innerWidth < 760;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  map.fitBounds(
    [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
    {
      padding: narrow
        ? { top: 28, right: 24, bottom: Math.min(340, window.innerHeight * 0.46), left: 24 }
        : { top: 56, right: 56, bottom: 56, left: Math.min(420, window.innerWidth * 0.4) },
      duration: reduceMotion ? 0 : 850,
      maxZoom: 16,
    },
  );
}

function syncRoute(map: MapLibreMap, route: LineString | null, theme: MapThemeName) {
  const colors =
    theme === "dark"
      ? { casing: "#071019", line: "#9ec0ff" }
      : { casing: "#fffaf3", line: "#1a4f8b" };
  const data = route
    ? { type: "Feature" as const, properties: {}, geometry: route }
    : { type: "FeatureCollection" as const, features: [] };

  if (!map.getSource(ROUTE_SOURCE)) {
    if (!route) return;
    map.addSource(ROUTE_SOURCE, { type: "geojson", data });
    const before = map.getLayer(FIRST_LABEL_LAYER_ID) ? FIRST_LABEL_LAYER_ID : undefined;
    map.addLayer(
      {
        id: ROUTE_CASING,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colors.casing, "line-width": 8, "line-opacity": 0.95 },
      },
      before,
    );
    map.addLayer(
      {
        id: ROUTE_LINE,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colors.line, "line-width": 4.5 },
      },
      before,
    );
    return;
  }

  (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(data);
  if (map.getLayer(ROUTE_CASING)) map.setPaintProperty(ROUTE_CASING, "line-color", colors.casing);
  if (map.getLayer(ROUTE_LINE)) map.setPaintProperty(ROUTE_LINE, "line-color", colors.line);
}
