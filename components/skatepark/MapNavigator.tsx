"use client";

import type { RefObject } from "react";
import { MAP_NAV } from "@/lib/skatepark/constants";

export type PlayCameraMode = "follow" | "skater";

type MapNavigatorProps = {
  zoomStep: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** True while the bird’s-eye / map overview camera is active. */
  mapOverview: boolean;
  onToggleMapOverview: () => void;
  /** Chase vs low POV — used when map overview is off. */
  playMode: PlayCameraMode;
  onPlayModeChange: (mode: PlayCameraMode) => void;
  disabled?: boolean;
  gameContainerRef?: RefObject<HTMLElement | null>;
};

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5c-4 0-7.5 3-9 7 1.5 4 5 7 9 7s7.5-3 9-7c-1.5-4-5-7-9-7Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Chase cam: subject + trailing lens. */
function IconFollow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="10" r="2.25" fill="currentColor" opacity="0.9" />
      <path
        d="M14.5 7.5 19 5.5v6l-4.5-2v-2Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M6.5 14c1.2-1.5 2.8-2.4 4.5-2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Low POV: horizon line + eye height cue. */
function IconSkater() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12.5h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="12" cy="9" r="2" fill="currentColor" />
      <path
        d="M8 16.5c1.6-2.2 4.4-2.2 8 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

const bar =
  "pointer-events-auto absolute bottom-4 left-4 z-10 flex flex-col gap-2 rounded-xl border border-white/25 bg-slate-900/78 p-2 shadow-lg backdrop-blur-md sm:flex-row sm:items-center";

const btnBase =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-35";

const btnNeutral =
  `${btnBase} border-white/15 bg-white/5 text-white hover:bg-white/12 hover:border-white/25`;

const btnActive =
  `${btnBase} border-sky-400/55 bg-sky-500/25 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.2)]`;

const divider = "hidden h-7 w-px shrink-0 bg-white/15 sm:block";

export default function MapNavigator({
  zoomStep,
  onZoomIn,
  onZoomOut,
  mapOverview,
  onToggleMapOverview,
  playMode,
  onPlayModeChange,
  disabled = false,
  gameContainerRef,
}: MapNavigatorProps) {
  const atZoomIn = zoomStep >= MAP_NAV.zoomStepMax;
  const atZoomOut = zoomStep <= MAP_NAV.zoomStepMin;
  const zoomLocked = mapOverview;

  const refocusGame = () => {
    gameContainerRef?.current?.focus();
  };

  return (
    <div
      className={`${bar} ${disabled ? "pointer-events-none opacity-40" : ""}`}
      role="toolbar"
      aria-label="Camera and map"
    >
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Zoom (follow view)"
      >
        <button
          type="button"
          className={btnNeutral}
          onClick={() => {
            onZoomOut();
            refocusGame();
          }}
          disabled={disabled || atZoomOut || zoomLocked}
          aria-label="Zoom out"
          title={
            zoomLocked
              ? "Zoom applies to follow view — exit map to adjust"
              : "Zoom out (follow view)"
          }
        >
          −
        </button>
        <button
          type="button"
          className={btnNeutral}
          onClick={() => {
            onZoomIn();
            refocusGame();
          }}
          disabled={disabled || atZoomIn || zoomLocked}
          aria-label="Zoom in"
          title={
            zoomLocked
              ? "Zoom applies to follow view — exit map to adjust"
              : "Zoom in (follow view)"
          }
        >
          +
        </button>
      </div>

      <div className={divider} aria-hidden />

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Play camera"
      >
        <button
          type="button"
          className={playMode === "follow" && !mapOverview ? btnActive : btnNeutral}
          onClick={() => {
            onPlayModeChange("follow");
            refocusGame();
          }}
          disabled={disabled}
          aria-pressed={playMode === "follow" && !mapOverview}
          aria-label="Follow camera"
          title="Chase camera (behind the rider)"
        >
          <IconFollow />
        </button>
        <button
          type="button"
          className={playMode === "skater" && !mapOverview ? btnActive : btnNeutral}
          onClick={() => {
            onPlayModeChange("skater");
            refocusGame();
          }}
          disabled={disabled}
          aria-pressed={playMode === "skater" && !mapOverview}
          aria-label="Skater camera"
          title="Low POV (keyboard: V)"
        >
          <IconSkater />
        </button>
      </div>

      <div className={divider} aria-hidden />

      <div className="flex items-center gap-1" role="group" aria-label="Map">
        <button
          type="button"
          className={mapOverview ? btnActive : btnNeutral}
          onClick={() => {
            onToggleMapOverview();
            refocusGame();
          }}
          disabled={disabled}
          aria-pressed={mapOverview}
          aria-label={mapOverview ? "Exit map view" : "Map view"}
          title={mapOverview ? "Back to play camera" : "Bird’s-eye map"}
        >
          <IconMap />
        </button>
      </div>
    </div>
  );
}
