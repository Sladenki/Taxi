"use client";

import { useEffect, useRef } from "react";
import { Marker, type Map as MapLibreMap } from "maplibre-gl";

import { buildRoutePath, positionAt, type RoutePath } from "@/lib/route-animation";
import type { PlaybackState } from "@/lib/types";

const CAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42" aria-hidden="true">
  <ellipse cx="21" cy="35.5" rx="8" ry="2" fill="rgba(20,16,10,0.28)"/>
  <rect x="13.2" y="8" width="15.6" height="25.2" rx="5" fill="#f5c518" stroke="#1c1917" stroke-width="1.6"/>
  <rect x="16" y="13.2" width="10" height="7.4" rx="1.8" fill="#1c1917"/>
  <rect x="16.2" y="22.6" width="9.6" height="5.2" rx="1.1" fill="#fff4c2"/>
  <rect x="17.4" y="5.1" width="7.2" height="3.3" rx="0.8" fill="#1c1917"/>
  <rect x="18.4" y="5.8" width="5.2" height="1.6" rx="0.4" fill="#f5c518"/>
  <circle cx="15.3" cy="11.2" r="1.15" fill="#fff7d6"/>
  <circle cx="26.7" cy="11.2" r="1.15" fill="#fff7d6"/>
</svg>`;

interface AnimatedCarProps {
  map: MapLibreMap | null;
  coordinates: ReadonlyArray<readonly number[]> | null;
  playback: PlaybackState;
  runId: number;
  speedKmh: number;
  onPlaybackChange: (state: PlaybackState) => void;
  onProgress: (ratio: number) => void;
}

export function AnimatedCar({
  map,
  coordinates,
  playback,
  runId,
  speedKmh,
  onPlaybackChange,
  onProgress,
}: AnimatedCarProps) {
  const markerRef = useRef<Marker | null>(null);
  const pathRef = useRef<RoutePath | null>(null);
  const distanceRef = useRef(0);
  const speedRef = useRef(speedKmh);
  const onPlaybackRef = useRef(onPlaybackChange);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    speedRef.current = speedKmh;
    onPlaybackRef.current = onPlaybackChange;
    onProgressRef.current = onProgress;
  }, [speedKmh, onPlaybackChange, onProgress]);

  useEffect(() => {
    distanceRef.current = 0;
  }, [coordinates, runId]);

  useEffect(() => {
    if (!map || !coordinates || coordinates.length < 2) {
      markerRef.current?.remove();
      markerRef.current = null;
      pathRef.current = null;
      return;
    }

    const path = buildRoutePath(coordinates);
    pathRef.current = path;
    if (path.coordinates.length < 2) return;

    const start = positionAt(path, 0);
    const element = document.createElement("div");
    element.className = "car-marker";
    element.innerHTML = CAR_SVG;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", "Автомобиль на маршруте");

    const marker = new Marker({
      element,
      anchor: "center",
      rotationAlignment: "map",
      pitchAlignment: "viewport",
    })
      .setLngLat(start.position)
      .setRotation(start.bearing)
      .addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
      if (markerRef.current === marker) markerRef.current = null;
    };
  }, [map, coordinates]);

  useEffect(() => {
    const path = pathRef.current;
    const marker = markerRef.current;
    if (!path || !marker || path.total <= 0) return;

    const place = (distance: number) => {
      const sample = positionAt(path, distance);
      marker.setLngLat(sample.position);
      marker.setRotation(sample.bearing);
    };

    if (playback === "idle") {
      distanceRef.current = 0;
      place(0);
      onProgressRef.current(0);
      return;
    }

    if (playback === "done") {
      distanceRef.current = path.total;
      place(path.total);
      onProgressRef.current(1);
      return;
    }

    if (playback === "paused") {
      place(distanceRef.current);
      return;
    }

    let frameId = 0;
    let last = performance.now();
    let lastReport = 0;

    const frame = (now: number) => {
      const currentPath = pathRef.current;
      const currentMarker = markerRef.current;
      if (!currentPath || !currentMarker || currentPath.total <= 0) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = Math.min(currentPath.total, distanceRef.current + (speedRef.current / 3.6) * dt);
      distanceRef.current = next;
      const sample = positionAt(currentPath, next);
      currentMarker.setLngLat(sample.position);
      currentMarker.setRotation(sample.bearing);

      if (now - lastReport > 160) {
        lastReport = now;
        onProgressRef.current(next / currentPath.total);
      }

      if (next >= currentPath.total) {
        onProgressRef.current(1);
        onPlaybackRef.current("done");
        return;
      }

      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [playback, runId, map, coordinates]);

  return null;
}
