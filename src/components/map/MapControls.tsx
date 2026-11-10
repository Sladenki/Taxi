"use client";

import styles from "@/components/map/MapControls.module.css";
import { formatDistance, formatDuration } from "@/lib/format";
import type { DrivingRoute, PickTarget, PlaybackState } from "@/lib/types";

const PLAYBACK_LABEL: Record<PlaybackState, string> = {
  idle: "Ожидание",
  moving: "Движение",
  paused: "Пауза",
  done: "Завершено",
};

interface MapControlsProps {
  theme: "light" | "dark";
  pointA: string;
  pointB: string;
  pickTarget: PickTarget | null;
  canBuild: boolean;
  loading: boolean;
  error: string | null;
  warning: string | null;
  route: DrivingRoute | null;
  playback: PlaybackState;
  progress: number;
  speedKmh: number;
  onToggleTheme: () => void;
  onPick: (target: PickTarget) => void;
  onBuild: () => void;
  onReset: () => void;
  onRetry: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSpeed: (speedKmh: number) => void;
}

export function MapControls({
  theme,
  pointA,
  pointB,
  pickTarget,
  canBuild,
  loading,
  error,
  warning,
  route,
  playback,
  progress,
  speedKmh,
  onToggleTheme,
  onPick,
  onBuild,
  onReset,
  onRetry,
  onStart,
  onPause,
  onResume,
  onRestart,
  onSpeed,
}: MapControlsProps) {
  return (
    <aside className={`${styles.panel} ${theme === "dark" ? styles.panelDark : ""}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>Народное такси</p>
          <h1>Калининград</h1>
        </div>
        <button type="button" className={styles.theme} onClick={onToggleTheme}>
          {theme === "light" ? "Тёмная карта" : "Светлая карта"}
        </button>
      </header>

      <label className={styles.field}>
        <span>Откуда</span>
        <input readOnly value={pointA} placeholder="Выберите точку на карте" />
        <small>широта, долгота</small>
      </label>
      <label className={styles.field}>
        <span>Куда</span>
        <input readOnly value={pointB} placeholder="Выберите точку на карте" />
        <small>широта, долгота</small>
      </label>

      <div className={styles.picks}>
        <button
          type="button"
          className={`${styles.pickA} ${pickTarget === "a" ? styles.pickOn : ""}`}
          aria-pressed={pickTarget === "a"}
          onClick={() => onPick("a")}
        >
          Выбрать точку А
        </button>
        <button
          type="button"
          className={`${styles.pickB} ${pickTarget === "b" ? styles.pickOn : ""}`}
          aria-pressed={pickTarget === "b"}
          onClick={() => onPick("b")}
        >
          Выбрать точку Б
        </button>
      </div>
      {pickTarget ? (
        <p className={styles.hint}>
          Кликните по карте, чтобы указать точку {pickTarget === "a" ? "А" : "Б"}.
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={!canBuild} onClick={onBuild}>
          {loading ? "Строим маршрут…" : "Построить маршрут"}
        </button>
        <button type="button" className={styles.ghost} onClick={onReset}>
          Сбросить
        </button>
      </div>

      {warning ? <p className={styles.warning}>{warning}</p> : null}
      {error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Повторить
          </button>
        </div>
      ) : null}

      {route ? (
        <section className={styles.route} aria-live="polite">
          <p className={styles.kicker}>Оптимальный автомобильный маршрут</p>
          <p className={styles.stats}>
            <strong>{formatDistance(route.distanceMeters)}</strong>
            <span>{formatDuration(route.durationSeconds)}</span>
          </p>
          <p className={styles.note}>
            Самый быстрый маршрут по профилю driving. Это не гарантия минимального расстояния.
          </p>
          <dl>
            <div>
              <dt>Отправление</dt>
              <dd>{pointA}</dd>
            </div>
            <div>
              <dt>Назначение</dt>
              <dd>{pointB}</dd>
            </div>
          </dl>

          <div className={styles.playback}>
            <div className={styles.playbackButtons}>
              <button type="button" onClick={onStart} disabled={playback === "moving" || playback === "paused"}>
                Начать поездку
              </button>
              <button type="button" onClick={onPause} disabled={playback !== "moving"}>
                Пауза
              </button>
              <button type="button" onClick={onResume} disabled={playback !== "paused"}>
                Продолжить
              </button>
              <button type="button" onClick={onRestart} disabled={playback === "idle"}>
                Начать заново
              </button>
            </div>
            <label className={styles.speed}>
              <span>Скорость демонстрации · {speedKmh} км/ч</span>
              <input
                type="range"
                min={60}
                max={1200}
                step={20}
                value={speedKmh}
                onChange={(event) => onSpeed(Number(event.target.value))}
              />
            </label>
            <div className={styles.progress} aria-hidden="true">
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className={styles.status} data-playback={playback}>
              Состояние: {PLAYBACK_LABEL[playback]}
            </p>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
