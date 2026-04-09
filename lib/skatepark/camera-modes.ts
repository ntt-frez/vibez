import * as THREE from "three";
import { CAMERA_MODES_CFG, MAP_NAV } from "./constants";
import { setPovCameraTargets } from "./camera-pov";
import type { SkaterState } from "./types";

/** Which camera rig is driving the frame — map UI will cycle these in Phase 3. */
export type CameraMode = "map" | "follow" | "skater";

/**
 * Writes ideal camera position + look-at for the active mode.
 * Beginner note: “follow” reuses the existing chase camera; only map/skater add new rigs here.
 */
export function getCameraTargetsForMode(
  mode: CameraMode,
  state: SkaterState,
  zoomStep: number,
  outCam: THREE.Vector3,
  outLook: THREE.Vector3,
): void {
  if (mode === "map") {
    outCam.set(
      MAP_NAV.birdsEyePosition.x,
      MAP_NAV.birdsEyePosition.y,
      MAP_NAV.birdsEyePosition.z,
    );
    outLook.set(
      MAP_NAV.birdsEyeLookAt.x,
      MAP_NAV.birdsEyeLookAt.y,
      MAP_NAV.birdsEyeLookAt.z,
    );
    return;
  }

  if (mode === "follow") {
    setPovCameraTargets(state, zoomStep, outCam, outLook);
    return;
  }

  const S = CAMERA_MODES_CFG.skater;
  const fx = Math.sin(state.yaw);
  const fz = Math.cos(state.yaw);
  const rx = fz;
  const rz = -fx;

  outCam.set(
    state.x - fx * S.back + rx * S.sideOffset,
    state.y + S.eyeHeight,
    state.z - fz * S.back + rz * S.sideOffset,
  );
  outLook.set(
    state.x + fx * S.lookAhead,
    state.y + S.lookHeight,
    state.z + fz * S.lookAhead,
  );
}

export function getFovForMode(mode: CameraMode): number {
  const fovByMode: Record<CameraMode, number> = {
    map: CAMERA_MODES_CFG.mapFov,
    follow: CAMERA_MODES_CFG.followFov,
    skater: CAMERA_MODES_CFG.skaterFov,
  };
  return fovByMode[mode];
}

/**
 * Blend multiplier for camera position/look while easing out of a mode switch.
 */
export function getCameraBlendSpeed(
  modeTransitionRemaining: number,
  baseBlend: number,
): number {
  if (modeTransitionRemaining <= 0) return baseBlend;
  return baseBlend * CAMERA_MODES_CFG.transitionEaseFactor;
}
