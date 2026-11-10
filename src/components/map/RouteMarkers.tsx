"use client";

import { useEffect, useRef } from "react";
import { Marker, type Map as MapLibreMap } from "maplibre-gl";

import type { LngLat } from "@/lib/types";

interface RouteMarkersProps {
  map: MapLibreMap | null;
  pointA: LngLat | null;
  pointB: LngLat | null;
  onChangeA: (point: LngLat) => void;
  onChangeB: (point: LngLat) => void;
}

export function RouteMarkers({ map, pointA, pointB, onChangeA, onChangeB }: RouteMarkersProps) {
  usePointMarker(map, pointA, "A", "Точка А, начало маршрута", onChangeA);
  usePointMarker(map, pointB, "B", "Точка Б, конец маршрута", onChangeB);
  return null;
}

function usePointMarker(
  map: MapLibreMap | null,
  point: LngLat | null,
  label: "A" | "B",
  accessibleName: string,
  onChange: (point: LngLat) => void,
) {
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!map) return;

    const element = document.createElement("div");
    element.className = `point-marker point-marker-${label.toLowerCase()}`;
    element.innerHTML = `<span>${label}</span>`;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", accessibleName);
    element.addEventListener("click", (event) => event.stopPropagation());

    const marker = new Marker({ element, anchor: "center", draggable: true });
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChangeRef.current([lngLat.lng, lngLat.lat]);
    });
    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, label, accessibleName]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !map) return;
    if (!point) {
      marker.remove();
      return;
    }
    marker.setLngLat(point);
    if (!marker.getElement().isConnected) marker.addTo(map);
  }, [map, point]);
}
