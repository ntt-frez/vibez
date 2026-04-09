/** Axis-aligned obstacle footprint on the XZ plane (Y is up). */
export type ColliderBox = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type SkaterTrick = "none" | "kickflip";

export type SkaterState = {
  x: number;
  z: number;
  /** Vertical offset for ollie / air. */
  y: number;
  vx: number;
  vz: number;
  vy: number;
  yaw: number;
  grounded: boolean;
  trick: SkaterTrick;
  trickTime: number;
};

export type InteractionType = "project" | "landmark";

/** Serializable config for future portfolio hooks (extend metadata as needed). */
export type InteractionObjectConfig = {
  id: string;
  label: string;
  position: [number, number, number];
  halfSize: [number, number];
  type: InteractionType;
  placeholderMeta: {
    slug: string;
    tags: string[];
  };
};

export type InteractionRuntime = {
  config: InteractionObjectConfig;
  mesh: import("three").Group;
  baseEmissive: import("three").Color;
};
