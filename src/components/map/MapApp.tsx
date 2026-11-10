"use client";

import { useEffect, useRef, useState } from "react";

import { KaliningradMap } from "@/components/map/KaliningradMap";
import { MapControls } from "@/components/map/MapControls";
import styles from "@/components/map/MapApp.module.css";
import { formatPoint } from "@/lib/format";
import type { MapThemeName } from "@/lib/map-style";
import { fetchDrivingRoute, RouteRequestError } from "@/lib/osrm";
import { pointsAreTooClose } from "@/lib/route-animation";
import type { DrivingRoute, LngLat, PickTarget, PlaybackState } from "@/lib/types";

type MapPhase = "loading" | "ready" | "error";

export default function MapApp() {
  const [theme, setTheme] = useState<MapThemeName>("light");
  const [mapKey, setMapKey] = useState(0);
  const [phase, setPhase] = useState<MapPhase>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pointA, setPointA] = useState<LngLat | null>(null);
  const [pointB, setPointB] = useState<LngLat | null>(null);
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(360);
  const abortRef = useRef<AbortController | null>(null);

  function forgetRoute() {
    abortRef.current?.abort();
    setRoute(null);
    setRouteError(null);
    setRouteLoading(false);
    setPlayback("idle");
    setProgress(0);
  }

  function placePoint(target: PickTarget, point: LngLat) {
    if (target === "a") setPointA(point);
    else setPointB(point);
    setPickTarget(null);
    forgetRoute();
  }

  function reset() {
    abortRef.current?.abort();
    setPointA(null);
    setPointB(null);
    setPickTarget(null);
    setRoute(null);
    setRouteError(null);
    setRouteLoading(false);
    setPlayback("idle");
    setProgress(0);
    setRunId((value) => value + 1);
  }

  async function buildRoute() {
    if (!pointA || !pointB || routeLoading) return;
    if (pointsAreTooClose(pointA, pointB)) {
      setRoute(null);
      setPlayback("idle");
      setRouteError("Точки слишком близко друг к другу.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRouteLoading(true);
    setRouteError(null);
    setRoute(null);
    setPlayback("idle");
    setProgress(0);

    try {
      const nextRoute = await fetchDrivingRoute(pointA, pointB, controller.signal);
      if (controller.signal.aborted) return;
      setRoute(nextRoute);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setRouteError(
        error instanceof RouteRequestError
          ? error.message
          : "Не удалось построить маршрут. Повторите запрос.",
      );
    } finally {
      if (!controller.signal.aborted) setRouteLoading(false);
    }
  }

  function startTrip() {
    setRunId((value) => value + 1);
    setProgress(0);
    setPlayback("moving");
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className={styles.shell}>
      <KaliningradMap
        key={mapKey}
        theme={theme}
        pointA={pointA}
        pointB={pointB}
        pickTarget={pickTarget}
        route={route?.geometry ?? null}
        playback={playback}
        runId={runId}
        speedKmh={speedKmh}
        onPick={placePoint}
        onChangeA={(point) => placePoint("a", point)}
        onChangeB={(point) => placePoint("b", point)}
        onPlaybackChange={setPlayback}
        onProgress={setProgress}
        onReady={() => setPhase("ready")}
        onFatal={(message) => {
          setMapError(message);
          setPhase("error");
        }}
        onWarning={setWarning}
      />
      <MapControls
        theme={theme}
        pointA={formatPoint(pointA)}
        pointB={formatPoint(pointB)}
        pickTarget={pickTarget}
        canBuild={Boolean(pointA && pointB) && !routeLoading}
        loading={routeLoading}
        error={routeError}
        warning={warning}
        route={route}
        playback={playback}
        progress={progress}
        speedKmh={speedKmh}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        onPick={(target) => setPickTarget((current) => (current === target ? null : target))}
        onBuild={() => void buildRoute()}
        onReset={reset}
        onRetry={() => void buildRoute()}
        onStart={startTrip}
        onPause={() => setPlayback("paused")}
        onResume={() => setPlayback("moving")}
        onRestart={startTrip}
        onSpeed={setSpeedKmh}
      />
      {phase === "loading" ? (
        <div className={styles.scrim} role="status">
          Загрузка карты Калининграда…
        </div>
      ) : null}
      {phase === "error" ? (
        <div className={styles.fatal} role="alert">
          <h2>Карта не загрузилась</h2>
          <p>{mapError}</p>
          <button
            type="button"
            onClick={() => {
              setWarning(null);
              setMapError(null);
              setPhase("loading");
              setMapKey((value) => value + 1);
            }}
          >
            Повторить
          </button>
        </div>
      ) : null}
    </main>
  );
}
