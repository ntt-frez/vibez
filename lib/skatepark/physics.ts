import { INTRO, SKATE_TUNING } from "./constants";
import type { ColliderBox, SkaterState } from "./types";

const T = SKATE_TUNING;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Circle vs axis-aligned box push-out (XZ). */
export function resolvePlayerAgainstColliders(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[],
): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const b of colliders) {
    const cx = clamp(px, b.minX, b.maxX);
    const cz = clamp(pz, b.minZ, b.maxZ);
    const dx = px - cx;
    const dz = pz - cz;
    const dist = Math.hypot(dx, dz);
    if (dist >= radius) continue;
    if (dist > 1e-5) {
      const s = radius / dist;
      px = cx + dx * s;
      pz = cz + dz * s;
    } else {
      const ex = Math.min(px - b.minX, b.maxX - px);
      const ez = Math.min(pz - b.minZ, b.maxZ - pz);
      if (ex < ez) {
        px = px < (b.minX + b.maxX) * 0.5 ? b.minX - radius : b.maxX + radius;
      } else {
        pz = pz < (b.minZ + b.maxZ) * 0.5 ? b.minZ - radius : b.maxZ + radius;
      }
    }
  }
  return { x: px, z: pz };
}

export type SkaterInput = {
  forward: number;
  turn: number;
  wantsJump: boolean;
  wantsKickflip: boolean;
};

export function createInitialSkater(): SkaterState {
  return {
    x: 0,
    z: 4,
    y: INTRO.dropStartY,
    vx: 0,
    vz: 0,
    vy: 0,
    yaw: 0,
    grounded: false,
    trick: "none",
    trickTime: 0,
  };
}

/**
 * Single simulation step. Keeps logic explicit for iteration (not a full physics engine).
 */
export function stepSkater(
  s: SkaterState,
  input: SkaterInput,
  dt: number,
  colliders: ColliderBox[],
): void {
  // Kickflip window
  if (s.trickTime > 0) {
    s.trickTime = Math.max(0, s.trickTime - dt);
    if (s.trickTime <= 0) s.trick = "none";
  }

  const speed = Math.hypot(s.vx, s.vz);
  const speedFactor = Math.min(speed / T.maxSpeed, 1);
  const turnScale = T.turnSpeedSlow + (T.turnSpeed - T.turnSpeedSlow) * speedFactor;
  const control = s.grounded ? 1 : T.airControl;

  s.yaw += input.turn * turnScale * dt * (0.35 + 0.65 * control);

  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const forwardSpeed = s.vx * fx + s.vz * fz;

  if (input.forward > 0) {
    s.vx += fx * T.accel * input.forward * control * dt;
    s.vz += fz * T.accel * input.forward * control * dt;
  } else if (input.forward < 0) {
    if (forwardSpeed > 0.4) {
      s.vx -= fx * T.brake * -input.forward * dt;
      s.vz -= fz * T.brake * -input.forward * dt;
    } else {
      s.vx -= fx * T.reverseAccel * -input.forward * control * dt;
      s.vz -= fz * T.reverseAccel * -input.forward * control * dt;
    }
  }

  const fr = Math.exp(-T.friction * dt);
  s.vx *= fr;
  s.vz *= fr;

  const mag = Math.hypot(s.vx, s.vz);
  if (mag > T.maxSpeed) {
    const scl = T.maxSpeed / mag;
    s.vx *= scl;
    s.vz *= scl;
  }

  // Jump / tricks (Shift+Space = kickflip; Space alone = ollie)
  // Nollie: add a third branch later (e.g. alt+space) with its own pop height / flip axis.
  if (s.grounded && s.trickTime <= 0) {
    if (input.wantsKickflip) {
      s.trick = "kickflip";
      s.trickTime = T.kickflipDuration;
      s.vy = T.kickflipPop;
      s.grounded = false;
    } else if (input.wantsJump) {
      s.vy = T.jumpVelocity;
      s.grounded = false;
    }
  }

  s.x += s.vx * dt;
  s.z += s.vz * dt;

  const ground = resolvePlayerAgainstColliders(s.x, s.z, T.playerRadius, colliders);
  s.x = ground.x;
  s.z = ground.z;

  if (!s.grounded) {
    s.vy -= T.gravity * dt;
    s.y += s.vy * dt;
    if (s.y <= 0) {
      s.y = 0;
      s.vy = 0;
      s.grounded = true;
    }
  } else {
    s.y = 0;
  }
}

