import type { SceneEntity, ThemeAsset, ThemeDefinition } from "./types";

export interface CompanionDefinition {
  id: string;
  name: string;
  description: string;
  entity: SceneEntity;
  asset: ThemeAsset;
  defaultThemeIds: string[];
  locales: Record<string, { name: string; description: string }>;
}

export const mossCompanion: CompanionDefinition = {
  id: "moss-gecko",
  name: "Moss",
  description:
    "An original eight-direction gecko that watches the pointer and can be dragged.",
  entity: {
    id: "moss-gecko",
    name: "Moss",
    renderer: {
      type: "sprite-atlas",
      asset: "assets/companions/moss-gecko-atlas-v2.png",
      columns: 4,
      rows: 2,
      frameWidth: 443,
      frameHeight: 443,
      directions: 8,
      normalization: "grounded",
      alphaThreshold: 24,
    },
    behaviors: ["idle", "look-at-pointer", "reduce-motion-fallback"],
    anchor: { x: 84, y: 70 },
    attachment: {
      target: "composer",
      edge: "top",
      align: 0.82,
      offset: { x: 0, y: 3 },
    },
    size: 136,
    opacity: 0.96,
  },
  asset: {
    id: "companion-moss-atlas",
    path: "assets/companions/moss-gecko-atlas-v2.png",
    type: "sprite-atlas",
    license: "CC-BY-4.0",
  },
  defaultThemeIds: ["codex-styler.quiet-garden"],
  locales: {
    en: {
      name: "Moss",
      description: "Pointer-aware, draggable, and independent from your theme.",
    },
    "zh-CN": {
      name: "苔苔",
      description: "会看向光标、可以拖拽，并且独立于主题搭配。",
    },
  },
};

export const builtinCompanions = [mossCompanion] as const;

export function defaultCompanionForTheme(
  themeId: string,
): CompanionDefinition | null {
  return (
    builtinCompanions.find((item) => item.defaultThemeIds.includes(themeId)) ??
    null
  );
}

export function composeThemeWithCompanion(
  theme: ThemeDefinition,
  companion: CompanionDefinition | null,
  overrides?: {
    anchor?: { x: number; y: number };
    attachment?: SceneEntity["attachment"] | null;
    size?: number;
  },
): ThemeDefinition {
  const composed = structuredClone(theme);
  composed.scene.entities = [];
  composed.assets = composed.assets.filter(
    (asset) => !asset.path.startsWith("assets/companions/"),
  );
  if (!companion) return composed;

  const entity = structuredClone(companion.entity);
  if (overrides?.anchor) entity.anchor = { ...overrides.anchor };
  if (overrides && "attachment" in overrides) {
    if (overrides.attachment) {
      entity.attachment = structuredClone(overrides.attachment);
    } else {
      delete entity.attachment;
    }
  }
  if (overrides?.size) entity.size = overrides.size;
  composed.scene.entities = [entity];
  composed.assets.push(structuredClone(companion.asset));
  return composed;
}
