import * as THREE from "three";
import { SKATE_VISUAL } from "./constants";

// High-contrast “taxi yellow” so the rider reads on a dark park.
const YELLOW = 0xffe600;
const YELLOW_DEEP = 0xe6c400;
const YELLOW_SOFT = 0xfff59a;

function yellowMat(deep = false) {
  return new THREE.MeshLambertMaterial({
    color: deep ? YELLOW_DEEP : YELLOW,
    emissive: deep ? 0x665500 : 0x886600,
    emissiveIntensity: 0.55,
  });
}

/**
 * Low-poly skateboard silhouette (deck, grip stripe, trucks, wheels, feet).
 * Inspired by typical street-deck layout; keeps the scene lightweight vs importing GLB.
 */
export function createSkateboardMesh(): THREE.Group {
  const root = new THREE.Group();
  const lean = new THREE.Group();
  const board = new THREE.Group();

  const deckLen = 1.38;
  const deckW = 0.52;
  const deckThick = 0.09;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, deckThick, deckLen), yellowMat(false));
  deck.position.y = deckThick / 2;
  addSkateOutline(deck, 0.95);

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(deckW * 0.72, 0.02, deckLen * 0.82),
    yellowMat(true),
  );
  grip.position.y = deckThick + 0.012;
  addSkateOutline(grip, 0.85);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.022, deckLen * 0.55),
    new THREE.MeshLambertMaterial({
      color: 0x1a1a1a,
      emissive: 0x111111,
      emissiveIntensity: 0.2,
    }),
  );
  stripe.position.y = deckThick + 0.014;
  addSkateOutline(stripe, 0.9);

  const truckMat = yellowMat(true);
  const hangar = new THREE.BoxGeometry(0.38, 0.07, 0.16);
  const frontTruck = new THREE.Mesh(hangar, truckMat);
  frontTruck.position.set(0, deckThick * 0.35, deckLen * 0.32);
  addSkateOutline(frontTruck, 0.85);
  const backTruck = frontTruck.clone();
  backTruck.position.z = -deckLen * 0.32;

  const wheelMat = new THREE.MeshLambertMaterial({
    color: YELLOW_SOFT,
    emissive: 0xaa8800,
    emissiveIntensity: 0.45,
  });
  const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.07, 14);
  const zFront = deckLen * 0.36;
  const zBack = -deckLen * 0.36;
  const xOff = deckW * 0.42;

  const wheels: THREE.Mesh[] = [];
  for (const z of [zFront, zBack]) {
    for (const x of [-xOff, xOff]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.06, z);
      addSkateOutline(w, 0.9);
      wheels.push(w);
    }
  }

  const shoeMat = yellowMat(false);
  const shoe = new THREE.BoxGeometry(0.16, 0.08, 0.28);
  const leftFoot = new THREE.Mesh(shoe, shoeMat);
  leftFoot.position.set(-0.1, deckThick + 0.06, 0.08);
  addSkateOutline(leftFoot, 0.85);
  const rightFoot = leftFoot.clone();
  rightFoot.position.set(0.1, deckThick + 0.06, -0.12);

  board.add(deck, grip, stripe, frontTruck, backTruck, ...wheels, leftFoot, rightFoot);
  board.position.y = 0.06;
  lean.add(board);
  root.add(lean);

  root.scale.setScalar(SKATE_VISUAL.meshScale);

  root.userData.lean = lean;
  root.userData.board = board;
  return root;
}

function addSkateOutline(mesh: THREE.Mesh, opacity: number) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  mesh.add(
    new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity,
      }),
    ),
  );
}
