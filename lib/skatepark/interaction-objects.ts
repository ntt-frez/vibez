import type { InteractionObjectConfig } from "./types";

/**
 * Placeholder map points — add rows here when new “spots” ship.
 * `placeholderMeta` is ready for future project slugs and CMS wiring.
 */
export const INTERACTION_OBJECTS: InteractionObjectConfig[] = [
  {
    id: "spot-bowl",
    label: "Empty pool",
    position: [18, 0.02, -12],
    halfSize: [2.2, 2.2],
    type: "landmark",
    placeholderMeta: { slug: "bowl", tags: ["spot"] },
  },
  {
    id: "spot-hub",
    label: "Hub plaza",
    position: [-8, 0.02, 6],
    halfSize: [1.8, 1.8],
    type: "project",
    placeholderMeta: { slug: "hub", tags: ["wip"] },
  },
  {
    id: "spot-rail-line",
    label: "Rail line",
    position: [-22, 0.02, -18],
    halfSize: [1.4, 3.5],
    type: "project",
    placeholderMeta: { slug: "rails", tags: ["line"] },
  },
  {
    id: "spot-funbox",
    label: "Funbox line",
    position: [12, 0.02, 20],
    halfSize: [2, 1.6],
    type: "landmark",
    placeholderMeta: { slug: "funbox", tags: ["line"] },
  },
  {
    id: "spot-quarter",
    label: "Quarter session",
    position: [-28, 0.02, 14],
    halfSize: [1.6, 1.6],
    type: "project",
    placeholderMeta: { slug: "quarter", tags: ["transition"] },
  },
];
