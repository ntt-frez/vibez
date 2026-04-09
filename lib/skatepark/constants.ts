/** Movement, intro timing, and interaction thresholds — tweak feel here. */
export const SKATE_TUNING = {
  accel: 18,
  brake: 22,
  reverseAccel: 10,
  maxSpeed: 26,
  friction: 2.4,
  turnSpeed: 2.8,
  turnSpeedSlow: 1.1,
  airControl: 0.35,
  jumpVelocity: 9.5,
  gravity: 28,
  playerRadius: 0.48,
  leanMax: 0.28,
  kickflipDuration: 0.42,
  kickflipPop: 3.2,
} as const;

/** Render-only scale (physics radius unchanged). */
export const SKATE_VISUAL = {
  meshScale: 2.52,
} as const;

export const INTRO = {
  totalDuration: 2.85,
  /** Camera Y at start (bird's-eye). */
  startHeight: 118,
  /** Board spawns this high and drops during intro. */
  dropStartY: 38,
} as const;

/** Over-the-shoulder POV: deck in lower-center; zoom adjusts distance / height. */
export const CAMERA_POV = {
  /** ~3× prior distances = ~300% zoomed out; board reads smaller, more park visible. */
  backDistance: 8.55,
  eyeHeight: 9.6,
  /** Scaled with camera pull-back so the look target stays coherent. */
  lookForward: 0.36,
  /** World Y offset above ground for look-at (deck centroid with current mesh scale). */
  deckFocusY: 0.38,
  /**
   * Strafe camera along rider “right” (+X when facing +Z). Positive nudges the deck toward
   * screen-left (fixes the board hugging the bottom-right edge).
   */
  sideOffset: 1.26,
  backMin: 4.2,
  backMax: 17,
  eyeMin: 6.5,
  eyeMax: 22,
  /** Wider FOV with pulled-back camera so more of the map is in view. */
  fov: 72,
} as const;

export const INTERACTION = {
  /** Distance at which placeholders begin to glow. */
  highlightRadius: 5.2,
  /** Full highlight when overlapping footprint. */
  contactBoost: 1.35,
} as const;

/** Bottom-left map navigator: zoom steps and bird’s-eye camera. */
export const MAP_NAV = {
  zoomStepMin: -4,
  zoomStepMax: 4,
  /** Positive step = zoom in (tighter POV: shorter back / lower eye). */
  heightPerStep: 0.9,
  birdsEyeHeight: 102,
  birdsEyePosition: { x: 0, y: 102, z: 0.02 },
  birdsEyeLookAt: { x: 0, y: 0, z: 0 },
  /** How fast the camera catches the ideal position each frame (higher = snappier). */
  blendSpeed: 10,
} as const;

/**
 * Phase 2: three camera personalities — map overview, chase, low skater POV.
 * FOV is part of the mode (not the only thing that changes); positions/look-at differ per mode.
 */
export const CAMERA_MODES_CFG = {
  mapFov: 52,
  followFov: CAMERA_POV.fov,
  skaterFov: 76,
  fovBlendSpeed: 7,
  /** After switching modes, position/look lerp slower for a short ease (seconds). */
  modeTransitionDuration: 0.55,
  /** Multiplier on `MAP_NAV.blendSpeed` while the post-switch ease is active (< 1 = gentler). */
  transitionEaseFactor: 0.34,
  /** Low immersive view: close behind the rider, sightline along the board direction. */
  skater: {
    back: 1.2,
    eyeHeight: 1.15,
    lookAhead: 12,
    lookHeight: 0.82,
    sideOffset: 0.36,
  },
} as const;
