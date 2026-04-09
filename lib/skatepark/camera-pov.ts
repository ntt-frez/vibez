import * as THREE from "three";
import { CAMERA_POV, MAP_NAV } from "./constants";
import type { SkaterState } from "./types";

/**
 * Close behind-the-rider camera aimed down at the deck so the board sits in the lower-center
 * of the frame (skate POV, not true eye height).
 */
export function setPovCameraTargets(
  s: SkaterState,
  zoomStep: number,
  outCam: THREE.Vector3,
  outLook: THREE.Vector3,
): void {
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const mul = Math.pow(MAP_NAV.heightPerStep, zoomStep);
  const back = THREE.MathUtils.clamp(
    CAMERA_POV.backDistance * mul,
    CAMERA_POV.backMin,
    CAMERA_POV.backMax,
  );
  const eyeH = THREE.MathUtils.clamp(
    CAMERA_POV.eyeHeight * mul,
    CAMERA_POV.eyeMin,
    CAMERA_POV.eyeMax,
  );

  // Rider right (XZ), perpendicular to forward — used to slide the camera and re-center the deck.
  const rx = fz;
  const rz = -fx;
  const side = CAMERA_POV.sideOffset;

  outCam.set(
    s.x - fx * back + rx * side,
    s.y + eyeH,
    s.z - fz * back + rz * side,
  );
  outLook.set(
    s.x + fx * CAMERA_POV.lookForward,
    s.y + CAMERA_POV.deckFocusY,
    s.z + fz * CAMERA_POV.lookForward,
  );
}
