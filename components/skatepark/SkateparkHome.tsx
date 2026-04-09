"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  getCameraBlendSpeed,
  getCameraTargetsForMode,
  getFovForMode,
  type CameraMode,
} from "@/lib/skatepark/camera-modes";
import { CAMERA_MODES_CFG, CAMERA_POV, INTRO, MAP_NAV, SKATE_TUNING } from "@/lib/skatepark/constants";
import { ENV_PALETTE } from "@/lib/skatepark/environment-palette";
import MapNavigator from "@/components/skatepark/MapNavigator";
import { INTERACTION_OBJECTS } from "@/lib/skatepark/interaction-objects";
import { updateInteractionHighlights } from "@/lib/skatepark/interactions";
import { createSkateboardMesh } from "@/lib/skatepark/create-skateboard-mesh";
import { buildSkatePark } from "@/lib/skatepark/map-build";
import {
  createInitialSkater,
  resolvePlayerAgainstColliders,
  stepSkater,
  type SkaterInput,
} from "@/lib/skatepark/physics";
import type { InteractionRuntime, SkaterState } from "@/lib/skatepark/types";

const T = SKATE_TUNING;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function addOutline(mesh: THREE.Mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  mesh.add(
    new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: ENV_PALETTE.edgeLine,
        transparent: true,
        opacity: 0.22,
      }),
    ),
  );
}

function buildInteractionMarkers(): InteractionRuntime[] {
  const out: InteractionRuntime[] = [];
  for (const cfg of INTERACTION_OBJECTS) {
    const g = new THREE.Group();
    const [x, y, z] = cfg.position;
    g.position.set(x, y, z);

    const [hw, hd] = cfg.halfSize;
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(hw * 1.6, 0.08, hd * 1.6),
      new THREE.MeshLambertMaterial({
        color: ENV_PALETTE.concrete,
        emissive: 0x000000,
      }),
    );
    post.position.y = 0.05;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.1, 0.2),
      new THREE.MeshLambertMaterial({
        color: ENV_PALETTE.woodSign,
        emissive: 0x000000,
      }),
    );
    pillar.position.y = 0.65;
    addOutline(pillar as THREE.Mesh);
    g.add(post, pillar);

    const postMat = post.material as THREE.MeshLambertMaterial;
    const pillarMat = pillar.material as THREE.MeshLambertMaterial;
    const baseEmissive = postMat.emissive.clone();
    g.userData.mats = [postMat, pillarMat];

    out.push({ config: cfg, mesh: g, baseEmissive });
  }
  return out;
}

export default function SkateparkHome() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [zoomStep, setZoomStep] = useState(0);
  /** True = map / bird’s-eye mode (see `CameraMode` in `camera-modes.ts`). */
  const [mapOverview, setMapOverview] = useState(false);
  /** Playable views when not in map mode: chase vs low skater POV (V key toggles until Phase 3 UI). */
  const [playMode, setPlayMode] = useState<"follow" | "skater">("follow");
  const [mapNavReady, setMapNavReady] = useState(false);

  const cameraPrefsRef = useRef({
    zoomStep: 0,
    mapOverview: false,
    playMode: "follow" as "follow" | "skater",
  });

  useLayoutEffect(() => {
    cameraPrefsRef.current = { zoomStep, mapOverview, playMode };
  }, [zoomStep, mapOverview, playMode]);

  /** Lets the key handler know the scene is live (`useEffect` [] would otherwise see a stale `mapNavReady`). */
  const mapNavReadyRef = useRef(false);
  useLayoutEffect(() => {
    mapNavReadyRef.current = mapNavReady;
  }, [mapNavReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.focus();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(ENV_PALETTE.sky);

    const camera = new THREE.PerspectiveCamera(CAMERA_POV.fov, 1, 0.1, 500);
    camera.position.set(0, INTRO.startHeight, 0.02);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    // Outdoor fill: sky tint from above, grass bounce from below — reads “sunny park” without shaders.
    const hemi = new THREE.HemisphereLight(0xbfe8ff, ENV_PALETTE.grass, 0.48);
    const ambient = new THREE.AmbientLight(0xffffff, 0.42);
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.05);
    sun.position.set(38, 52, 24);
    scene.add(hemi, ambient, sun);

    const world = new THREE.Group();
    scene.add(world);
    const colliders = buildSkatePark(world);

    const skater = createSkateboardMesh();
    scene.add(skater);

    const interactions = buildInteractionMarkers();
    for (const it of interactions) scene.add(it.mesh);

    const state: SkaterState = createInitialSkater();
    let introTime = 0;
    let introDone = false;

    const keys = { up: false, down: false, left: false, right: false };
    let jumpPulse = false;
    let kickflipPulse = false;

    const onDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") {
        keys.up = true;
        e.preventDefault();
      }
      if (e.code === "ArrowDown") {
        keys.down = true;
        e.preventDefault();
      }
      if (e.code === "ArrowLeft") {
        keys.left = true;
        e.preventDefault();
      }
      if (e.code === "ArrowRight") {
        keys.right = true;
        e.preventDefault();
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (e.shiftKey) kickflipPulse = true;
        else jumpPulse = true;
        // Nollie: future chord (e.g. alt+space) can enqueue another trick slot here.
      }
      // Same as the skater/follow buttons: swap POV and leave map overview if it’s on.
      if (e.code === "KeyV" && mapNavReadyRef.current) {
        e.preventDefault();
        setMapOverview(false);
        setPlayMode((m) => (m === "follow" ? "skater" : "follow"));
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") keys.up = false;
      if (e.code === "ArrowDown") keys.down = false;
      if (e.code === "ArrowLeft") keys.left = false;
      if (e.code === "ArrowRight") keys.right = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const clock = new THREE.Clock();
    let raf = 0;

    const resize = () => {
      const w = Math.max(1, host.clientWidth || window.innerWidth);
      const h = Math.max(1, host.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // `true` updates canvas CSS — `false` leaves ~300×150px default (tiny corner “postage stamp”).
      renderer.setSize(w, h, true);
    };
    resize();
    window.addEventListener("resize", resize);
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(host);

    const lookScratch = new THREE.Vector3();
    const vCamTarget = new THREE.Vector3();
    const vLookTarget = new THREE.Vector3();
    const smoothedLook = new THREE.Vector3();
    const birdCamVec = new THREE.Vector3(0, INTRO.startHeight, 0.02);
    const birdLookVec = new THREE.Vector3(0, 0, 0);
    let lookSmoothedReady = false;

    let prevCameraMode: CameraMode | null = null;
    let modeTransitionRemaining = 0;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      introTime += dt;
      const introP = smoothstep(introTime / INTRO.totalDuration);

      if (!introDone && introTime >= INTRO.totalDuration) {
        introDone = true;
        state.grounded = true;
        state.y = 0;
        state.vy = 0;
        setMapNavReady(true);
        mapNavReadyRef.current = true;
        // Snap POV once so the first gameplay frame isn’t lerping from a mismatched intro pose.
        const prefs0 = cameraPrefsRef.current;
        const mode0: CameraMode = prefs0.mapOverview ? "map" : prefs0.playMode;
        getCameraTargetsForMode(mode0, state, prefs0.zoomStep, vCamTarget, vLookTarget);
        camera.position.copy(vCamTarget);
        smoothedLook.copy(vLookTarget);
        lookSmoothedReady = true;
        camera.fov = getFovForMode(mode0);
        camera.updateProjectionMatrix();
        prevCameraMode = mode0;
        modeTransitionRemaining = 0;
      }

      if (!introDone) {
        state.x = 0;
        state.z = 4;
        state.vx = 0;
        state.vz = 0;
        state.yaw = 0;
        state.y = INTRO.dropStartY * (1 - introP);
        const landed = resolvePlayerAgainstColliders(state.x, state.z, T.playerRadius, colliders);
        state.x = landed.x;
        state.z = landed.z;
      } else {
        const forward = (keys.up ? 1 : 0) + (keys.down ? -1 : 0);
        const turn = (keys.left ? 1 : 0) + (keys.right ? -1 : 0);
        const input: SkaterInput = {
          forward,
          turn,
          wantsJump: jumpPulse,
          wantsKickflip: kickflipPulse,
        };
        jumpPulse = false;
        kickflipPulse = false;
        stepSkater(state, input, dt, colliders);
      }

      const speed = Math.hypot(state.vx, state.vz);
      const speedFactor = Math.min(speed / T.maxSpeed, 1);

      skater.position.set(state.x, state.y, state.z);
      skater.rotation.y = state.yaw;
      const lean = skater.userData.lean as THREE.Group;
      const board = skater.userData.board as THREE.Group;
      const turnInput = (keys.left ? 1 : 0) + (keys.right ? -1 : 0);
      lean.rotation.z = -turnInput * T.leanMax * (0.25 + 0.75 * speedFactor);

      if (state.trick === "kickflip" && state.trickTime > 0) {
        const p = 1 - state.trickTime / T.kickflipDuration;
        board.rotation.x = p * Math.PI * 2;
      } else {
        board.rotation.x = THREE.MathUtils.lerp(board.rotation.x, 0, Math.min(1, dt * 12));
      }

      updateInteractionHighlights(state.x, state.z, interactions);

      const prefs = cameraPrefsRef.current;
      const effectiveMode: CameraMode = prefs.mapOverview ? "map" : prefs.playMode;
      const camMode: CameraMode = introDone ? effectiveMode : "follow";

      getCameraTargetsForMode(camMode, state, prefs.zoomStep, vCamTarget, vLookTarget);

      if (introDone) {
        if (prevCameraMode !== camMode) {
          if (prevCameraMode !== null) {
            modeTransitionRemaining = CAMERA_MODES_CFG.modeTransitionDuration;
          }
          prevCameraMode = camMode;
        }

        const blendSpeed = getCameraBlendSpeed(
          modeTransitionRemaining,
          MAP_NAV.blendSpeed,
        );
        modeTransitionRemaining = Math.max(0, modeTransitionRemaining - dt);

        const ck = Math.min(1, blendSpeed * dt);
        camera.position.lerp(vCamTarget, ck);
        if (!lookSmoothedReady) {
          smoothedLook.copy(vLookTarget);
          lookSmoothedReady = true;
        }
        smoothedLook.lerp(vLookTarget, ck);
        camera.lookAt(smoothedLook);

        camera.fov = THREE.MathUtils.lerp(
          camera.fov,
          getFovForMode(camMode),
          Math.min(1, dt * CAMERA_MODES_CFG.fovBlendSpeed),
        );
        camera.updateProjectionMatrix();
      } else {
        camera.position.copy(birdCamVec).lerp(vCamTarget, introP);
        lookScratch.copy(birdLookVec).lerp(vLookTarget, introP);
        camera.lookAt(lookScratch);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose();
        }
        if (obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else (m as THREE.Material | undefined)?.dispose?.();
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#8fd4f0]"
      role="application"
      aria-label="Interactive skate park map"
    >
      <div
        ref={hostRef}
        className="absolute inset-0 h-full w-full min-h-0 min-w-0 outline-none"
        tabIndex={0}
      />
      <MapNavigator
        gameContainerRef={hostRef}
        zoomStep={zoomStep}
        onZoomIn={() =>
          setZoomStep((s) => Math.min(MAP_NAV.zoomStepMax, s + 1))
        }
        onZoomOut={() =>
          setZoomStep((s) => Math.max(MAP_NAV.zoomStepMin, s - 1))
        }
        mapOverview={mapOverview}
        onToggleMapOverview={() => setMapOverview((v) => !v)}
        playMode={playMode}
        onPlayModeChange={(mode) => {
          setPlayMode(mode);
          setMapOverview(false);
        }}
        disabled={!mapNavReady}
      />
    </div>
  );
}
