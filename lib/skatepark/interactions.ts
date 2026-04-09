import * as THREE from "three";
import { INTERACTION } from "./constants";
import type { InteractionRuntime } from "./types";

const _emissiveHot = new THREE.Color(0x9a9a9a);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Proximity / overlap drives emissive so spots read clearly in grayscale. */
export function updateInteractionHighlights(
  px: number,
  pz: number,
  runtimes: InteractionRuntime[],
): void {
  for (const r of runtimes) {
    const [cx, , cz] = r.config.position;
    const [hw, hd] = r.config.halfSize;
    const qx = clamp(px, cx - hw, cx + hw);
    const qz = clamp(pz, cz - hd, cz + hd);
    const d = Math.hypot(px - qx, pz - qz);
    const inside = d < 1e-4;
    let strength = inside ? INTERACTION.contactBoost : Math.max(0, 1 - d / INTERACTION.highlightRadius);
    strength = clamp(strength, 0, 1.5);
    const mats = r.mesh.userData.mats as THREE.MeshLambertMaterial[] | undefined;
    if (!mats) continue;
    for (const mat of mats) {
      mat.emissive.copy(r.baseEmissive).lerp(_emissiveHot, strength);
    }
  }
}
