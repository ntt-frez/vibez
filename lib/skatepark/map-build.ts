import * as THREE from "three";
import type { ColliderBox } from "./types";
import { ENV_PALETTE as P } from "./environment-palette";

function boxMesh(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

function pushCollider(
  colliders: ColliderBox[],
  cx: number,
  cz: number,
  hw: number,
  hd: number,
) {
  colliders.push({
    minX: cx - hw,
    maxX: cx + hw,
    minZ: cz - hd,
    maxZ: cz + hd,
  });
}

/** Soft rolling hills — decoration only; placed outside wall colliders. */
function addGrassHills(root: THREE.Group) {
  const hillMat = new THREE.MeshLambertMaterial({ color: P.grassDeep });
  const positions: [number, number, number, number][] = [
    [-62, 8, -58, 22],
    [58, 6, -62, 18],
    [-54, 7, 52, 20],
    [64, 9, 48, 24],
    [-68, 5, 8, 16],
    [70, 6, -12, 19],
  ];
  for (const [x, y, z, scale] of positions) {
    const geo = new THREE.SphereGeometry(scale, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const m = new THREE.Mesh(geo, hillMat);
    m.position.set(x, y * 0.15 - scale * 0.35, z);
    m.scale.set(1, 0.45, 1);
    m.castShadow = false;
    m.receiveShadow = false;
    root.add(m);
  }
}

/** Tan winding paths on the grass (flat strips, no collision). */
function addPaths(root: THREE.Group) {
  const mat = new THREE.MeshLambertMaterial({ color: P.pathDirt });
  const strips: [number, number, number, number, number][] = [
    [3.2, 38, -52, 0, -0.2],
    [3.2, 42, 48, 0, 0.15],
    [2.8, 55, 0, Math.PI / 2, 0],
    [2.6, 48, 22, 0.22, 0.08],
    [2.4, -50, -18, -0.12, 0],
    [2.2, 30, 58, Math.PI / 3, 0.05],
  ];
  for (const [w, len, z0, ry, xOff] of strips) {
    const g = new THREE.PlaneGeometry(w, len);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = ry;
    m.position.set(xOff, 0.025, z0);
    m.receiveShadow = false;
    root.add(m);
  }
}

function addSimpleTree(root: THREE.Group, x: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 2.2, 6),
    new THREE.MeshLambertMaterial({ color: P.trunk }),
  );
  trunk.position.y = 1.1;
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 3.2, 7),
    new THREE.MeshLambertMaterial({ color: P.foliage }),
  );
  top.position.y = 3.1;
  g.add(trunk, top);
  root.add(g);
}

function addPalm(root: THREE.Group, x: number, z: number, rotY: number, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 5.5, 6),
    new THREE.MeshLambertMaterial({ color: P.trunk }),
  );
  trunk.position.y = 2.75;
  const frondGeo = new THREE.ConeGeometry(0.35, 4.2, 4);
  const frondMat = new THREE.MeshLambertMaterial({ color: P.palmFrond });
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(frondGeo, frondMat);
    f.position.y = 5.2;
    f.rotation.y = (i / 6) * Math.PI * 2;
    f.rotation.x = 0.85;
    g.add(f);
  }
  g.add(trunk);
  root.add(g);
}

function addLightPole(root: THREE.Group, x: number, z: number) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 9, 6),
    new THREE.MeshLambertMaterial({ color: P.pole }),
  );
  pole.position.set(x, 4.5, z);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.2, 0.35),
    new THREE.MeshLambertMaterial({ color: P.lampHead }),
  );
  head.position.set(x, 9.1, z);
  root.add(pole, head);
}

function addParkSign(root: THREE.Group, x: number, z: number, rotY: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const postL = boxMesh(0.22, 2.8, 0.22, P.woodSign, -0.55, 1.4, 0);
  const postR = boxMesh(0.22, 2.8, 0.22, P.woodSign, 0.55, 1.4, 0);
  const board = boxMesh(3.2, 1.4, 0.12, P.woodSignFace, 0, 2.9, 0);
  g.add(postL, postR, board);
  root.add(g);
}

/** Visual “taco” arch — no collider so skating stays frictionless. */
function addArchLandmark(root: THREE.Group) {
  const legW = 1.2;
  const legD = 1.4;
  const legH = 4.2;
  const cx = 0;
  const cz = -22;
  const left = boxMesh(legW, legH, legD, P.concreteDark, cx - 3.8, legH / 2, cz);
  const right = boxMesh(legW, legH, legD, P.concreteDark, cx + 3.8, legH / 2, cz);
  const top = boxMesh(9.2, 1.1, legD, P.concrete, cx, legH + 0.55, cz);
  root.add(left, right, top);
}

/** Decorative stair + rail (visual only). */
function addStairVisual(root: THREE.Group) {
  const sx = -36;
  const sz = 34;
  const g = new THREE.Group();
  g.position.set(sx, 0, sz);
  for (let i = 0; i < 5; i++) {
    const step = boxMesh(3.2, 0.22, 0.85, P.concrete, 0, 0.11 + i * 0.22, -i * 0.85);
    g.add(step);
  }
  const rail = boxMesh(0.14, 0.5, 5.2, P.railMetal, 1.65, 1.15, -2);
  g.add(rail);
  root.add(g);
}

function addPerimeterDecor(root: THREE.Group) {
  addGrassHills(root);
  addPaths(root);
  addArchLandmark(root);
  addStairVisual(root);

  // Trees & palms — kept outside the ~48-unit skate slab so they never snag colliders.
  addSimpleTree(root, -56, -44, 1.1);
  addSimpleTree(root, 52, -50, 0.95);
  addSimpleTree(root, -50, 48, 1);
  addSimpleTree(root, 58, 42, 1.05);
  addPalm(root, -60, 12, 0.4, 1);
  addPalm(root, 62, -8, -0.8, 0.9);
  addPalm(root, -58, -20, 1.2, 1);
  addPalm(root, 54, 28, 2.1, 0.85);

  addLightPole(root, -46, -46);
  addLightPole(root, 46, -46);
  addLightPole(root, -46, 46);
  addLightPole(root, 46, 46);

  addParkSign(root, -42, 38, 0.35);
  addParkSign(root, 40, -40, -0.5);
}

/**
 * Builds stylized low-poly park meshes + matching XZ colliders (same layout as the prototype).
 * Beginner note: collider boxes are invisible bumpers — only the numbers in `pushCollider` affect skating.
 */
export function buildSkatePark(root: THREE.Group): ColliderBox[] {
  const colliders: ColliderBox[] = [];

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshLambertMaterial({ color: P.grass }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0;
  grass.receiveShadow = false;
  root.add(grass);

  addPerimeterDecor(root);

  const wallT = 0.6;
  const wallH = 1.1;
  const extent = 48;
  const walls: [number, number, number, number, number][] = [
    [extent * 2 + wallT, wallH, wallT, 0, -extent],
    [extent * 2 + wallT, wallH, wallT, 0, extent],
    [wallT, wallH, extent * 2 + wallT, -extent, 0],
    [wallT, wallH, extent * 2 + wallT, extent, 0],
  ];
  for (const [w, h, d, x, z] of walls) {
    root.add(boxMesh(w, h, d, P.concreteDark, x, wallH / 2, z));
    pushCollider(colliders, x, z, w / 2 + 0.2, d / 2 + 0.2);
  }

  for (let i = 0; i < 3; i++) {
    const x = -32 + i * 10;
    const z = -36;
    root.add(boxMesh(7, 2.2, 5, P.concrete, x, 1.1, z, -0.45, 0, 0));
    pushCollider(colliders, x, z, 3.8, 3.2);
    root.add(boxMesh(0.35, 0.35, 7, P.coping, x, 2.25, z - 2.4));
  }

  const poolCx = 18;
  const poolCz = -12;
  const poolW = 16;
  const poolD = 12;
  const poolFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW - 1.2, poolD - 1.2),
    new THREE.MeshLambertMaterial({ color: P.bowlInner }),
  );
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(poolCx, -0.35, poolCz);
  root.add(poolFloor);
  const copingT = 0.45;
  root.add(boxMesh(poolW + copingT, 0.5, copingT, P.coping, poolCx, 0.25, poolCz - poolD / 2));
  root.add(boxMesh(poolW + copingT, 0.5, copingT, P.coping, poolCx, 0.25, poolCz + poolD / 2));
  root.add(boxMesh(copingT, 0.5, poolD + copingT, P.coping, poolCx - poolW / 2, 0.25, poolCz));
  root.add(boxMesh(copingT, 0.5, poolD + copingT, P.coping, poolCx + poolW / 2, 0.25, poolCz));
  const inner = 0.35;
  root.add(boxMesh(poolW, 1.4, inner, P.concreteDark, poolCx, -0.4, poolCz - poolD / 2 + inner / 2));
  root.add(boxMesh(poolW, 1.4, inner, P.concreteDark, poolCx, -0.4, poolCz + poolD / 2 - inner / 2));
  root.add(boxMesh(inner, 1.4, poolD, P.concreteDark, poolCx - poolW / 2 + inner / 2, -0.4, poolCz));
  root.add(boxMesh(inner, 1.4, poolD, P.concreteDark, poolCx + poolW / 2 - inner / 2, -0.4, poolCz));
  const rimHalf = 0.55;
  pushCollider(colliders, poolCx, poolCz - poolD / 2, poolW / 2 + 0.3, rimHalf);
  pushCollider(colliders, poolCx, poolCz + poolD / 2, poolW / 2 + 0.3, rimHalf);
  pushCollider(colliders, poolCx - poolW / 2, poolCz, rimHalf, poolD / 2 + 0.3);
  pushCollider(colliders, poolCx + poolW / 2, poolCz, rimHalf, poolD / 2 + 0.3);

  const fbX = 12;
  const fbZ = 20;
  root.add(boxMesh(10, 0.9, 6, P.concrete, fbX, 0.45, fbZ));
  root.add(boxMesh(6, 0.9, 4, P.concrete, fbX, 1.35, fbZ));
  root.add(boxMesh(3.5, 0.7, 2.2, P.concrete, fbX, 2.15, fbZ));
  pushCollider(colliders, fbX, fbZ, 5.2, 3.2);

  const railLen = 14;
  const railH = 0.55;
  const railY = railH / 2;
  root.add(boxMesh(0.22, railH, railLen, P.railMetal, -22, railY, -18));
  pushCollider(colliders, -22, -18, 0.5, railLen / 2 + 0.2);
  root.add(boxMesh(railLen, railH, 0.22, P.railMetal, 2, railY, -24, 0, Math.PI / 2));
  pushCollider(colliders, 2, -24, railLen / 2, 0.5);

  root.add(boxMesh(5, 1.4, 7, P.concrete, -10, 0.7, -26, -0.38, 0, 0));
  pushCollider(colliders, -10, -26, 3, 4);
  root.add(boxMesh(6, 1.2, 5, P.concrete, 28, 0.6, 8, 0, 0, 0.32));
  pushCollider(colliders, 28, 8, 3.2, 2.8);

  root.add(boxMesh(9, 0.55, 1.6, P.concrete, -6, 0.28, 18));
  pushCollider(colliders, -6, 18, 4.6, 1);
  root.add(boxMesh(2.2, 1.2, 2.2, P.concrete, 24, 0.6, -10));
  pushCollider(colliders, 24, -10, 1.2, 1.2);
  root.add(boxMesh(3.5, 0.75, 3.5, P.concrete, -28, 0.38, 22));
  pushCollider(colliders, -28, 22, 1.9, 1.9);

  root.add(boxMesh(7, 0.4, 7, P.concrete, -8, 0.2, 6));
  pushCollider(colliders, -8, 6, 3.6, 3.6);

  return colliders;
}
