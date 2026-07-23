import {
  COMPANION_FORMAT,
  type CompanionPackageDefinition,
  type SceneEntity,
  type ThemeAsset,
  type ThemeDefinition,
} from "./types";
import chameleonAtlas from "./moss-chameleon-atlas.json";
import catAtlas from "./mochi-cat-atlas.json";
import parrotAtlas from "./pico-parrot-atlas.json";
import frogAtlas from "./puddle-frog-atlas.json";
import resetGodAtlas from "./reset-god-atlas.json";
import tokenThiefAtlas from "./token-thief-atlas.json";

export interface CompanionDefinition {
  format: typeof COMPANION_FORMAT;
  id: string;
  version: string;
  name: string;
  description: string;
  metadata: CompanionPackageDefinition["metadata"];
  compatibility: CompanionPackageDefinition["compatibility"];
  entity: SceneEntity;
  assets: ThemeAsset[];
  defaultThemeIds: string[];
  locales: Record<string, { name: string; description: string }>;
}

interface CalibratedAtlas {
  renderer: {
    pages: string[];
    columns: number;
    rows: number;
    framesPerPage: number;
    frameWidth: number;
    frameHeight: number;
    directions: number;
    frameAngles: number[];
  };
}

function calibratedCompanion(config: {
  id: string;
  name: string;
  description: string;
  atlas: CalibratedAtlas;
  portrait: string;
  size: number;
  defaultThemeIds?: string[];
  locales: CompanionDefinition["locales"];
}): CompanionDefinition {
  const renderer = config.atlas.renderer;
  return {
    format: COMPANION_FORMAT,
    id: config.id,
    version: "0.2.0",
    name: config.name,
    description: config.description,
    metadata: {
      name: config.name,
      description: config.description,
      author: "Codex Styler contributors",
      license: "CC-BY-4.0",
      tags: ["companion", "pointer-aware"],
      preview: `assets/companions/${config.portrait}`,
    },
    compatibility: {
      styler: {
        minimumVersion: "0.2.0",
      },
    },
    entity: {
      id: config.id,
      name: config.name,
      renderer: {
        type: "sprite-atlas",
        asset: `assets/companions/${renderer.pages[0]}`,
        pages: renderer.pages.map((page) => `assets/companions/${page}`),
        columns: renderer.columns,
        rows: renderer.rows,
        framesPerPage: renderer.framesPerPage,
        frameWidth: renderer.frameWidth,
        frameHeight: renderer.frameHeight,
        directions: renderer.directions,
        frameCount: renderer.directions,
        frameAngles: renderer.frameAngles,
        poses: renderer.frameAngles.flatMap((angle, frame) =>
          angle >= 360
            ? []
            : [
                {
                  id: `pose-${String(frame).padStart(3, "0")}`,
                  angle,
                  frame,
                },
              ],
        ),
        neutralFrame: 0,
        reducedMotionFrame: 0,
        transitionFps: 60,
        normalization: "preserve",
        alphaThreshold: 12,
      },
      behaviors: ["idle", "look-at-pointer", "reduce-motion-fallback"],
      anchor: { x: 84, y: 70 },
      attachment: {
        target: "composer",
        edge: "top",
        align: 0.82,
        offset: { x: 0, y: 3 },
      },
      size: config.size,
      opacity: 0.96,
    },
    assets: [
      ...renderer.pages.map((page, index) => ({
        id: `companion-${config.id}-atlas-${index + 1}`,
        path: `assets/companions/${page}`,
        type: "sprite-atlas" as const,
        license: "CC-BY-4.0",
      })),
      {
        id: `companion-${config.id}-portrait`,
        path: `assets/companions/${config.portrait}`,
        type: "preview" as const,
        license: "CC-BY-4.0",
      },
    ],
    defaultThemeIds: config.defaultThemeIds ?? [],
    locales: config.locales,
  };
}

export function companionFromPackage(
  companion: CompanionPackageDefinition,
): CompanionDefinition {
  return {
    ...structuredClone(companion),
    name: companion.metadata.name,
    description: companion.metadata.description,
    defaultThemeIds: [],
  };
}

export function companionToPackage(
  companion: CompanionDefinition,
): CompanionPackageDefinition {
  const entity = structuredClone(companion.entity);
  if (entity.renderer.type === "sprite-atlas") {
    // frameAngles is the v0.1 compatibility input. Standalone v1 companion
    // packages express direction through explicit poses instead.
    delete entity.renderer.frameAngles;
  }
  return {
    format: COMPANION_FORMAT,
    id: companion.id,
    version: companion.version,
    metadata: structuredClone(companion.metadata),
    compatibility: structuredClone(companion.compatibility),
    entity,
    assets: structuredClone(companion.assets),
    locales: structuredClone(companion.locales),
  };
}

export const mossCompanion = calibratedCompanion({
  id: "moss-gecko",
  name: "Moss",
  description:
    "A calibrated 181-frame chameleon that follows the pointer smoothly and can be dragged.",
  atlas: chameleonAtlas,
  portrait: "moss-chameleon-portrait.webp",
  size: 136,
  defaultThemeIds: [
    "codex-styler.native-refined",
    "codex-styler.caishen-readable",
    "codex-styler.nocturne-studio",
    "codex-styler.quiet-garden",
  ],
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
});

export const picoCompanion = calibratedCompanion({
  id: "pico-parrot",
  name: "Pico",
  description: "A lively scarlet parrot with a naturally expressive gaze.",
  atlas: parrotAtlas,
  portrait: "pico-parrot-portrait.webp",
  size: 94,
  locales: {
    en: {
      name: "Pico",
      description:
        "A lively parrot with natural blinks and pointer-aware poses.",
    },
    "zh-CN": {
      name: "皮可",
      description: "会自然眨眼、随光标转头的灵动鹦鹉。",
    },
  },
});

export const puddleCompanion = calibratedCompanion({
  id: "puddle-frog",
  name: "Puddle",
  description: "A vivid blue frog with a grounded, pointer-aware stance.",
  atlas: frogAtlas,
  portrait: "puddle-frog-portrait.webp",
  size: 142,
  locales: {
    en: {
      name: "Puddle",
      description: "A bright blue frog that tracks the pointer from the frame.",
    },
    "zh-CN": {
      name: "泡泡",
      description: "稳稳站在边框上、会追随光标的蓝色青蛙。",
    },
  },
});

export const mochiCompanion = calibratedCompanion({
  id: "mochi-cat",
  name: "Mochi",
  description: "A warm orange cat with a soft, continuous look-around loop.",
  atlas: catAtlas,
  portrait: "mochi-cat-portrait.webp",
  size: 120,
  locales: {
    en: {
      name: "Mochi",
      description: "A soft orange cat with smooth pointer-aware head movement.",
    },
    "zh-CN": {
      name: "糯米",
      description: "会平滑转头看向光标的温暖橘猫。",
    },
  },
});

export const tokenThiefCompanion = calibratedCompanion({
  id: "token-thief",
  name: "Token Thief",
  description:
    "A theatrical clown with expressive, pointer-aware head movement.",
  atlas: tokenThiefAtlas,
  portrait: "token-thief-portrait.webp",
  size: 124,
  defaultThemeIds: ["codex-styler.merry-big-top"],
  locales: {
    en: {
      name: "Token Thief",
      description:
        "A theatrical clown who follows the pointer with comic suspicion.",
    },
    "zh-CN": {
      name: "Token Thief",
      description: "会带着滑稽又多疑的表情追随光标的小丑。",
    },
  },
});

export const resetGodCompanion = calibratedCompanion({
  id: "reset-god",
  name: "Reset God",
  description:
    "A gilded reset deity with calm, pointer-aware ceremonial poses.",
  atlas: resetGodAtlas,
  portrait: "reset-god-portrait.webp",
  size: 122,
  defaultThemeIds: ["codex-styler.gilded-grandeur"],
  locales: {
    en: {
      name: "Reset God",
      description:
        "A gilded deity who watches the pointer from a ceremonial throne.",
    },
    "zh-CN": {
      name: "Reset God",
      description: "端坐鎏金王座、会平静注视光标方向的重置之神。",
    },
  },
});

export const builtinCompanions = [
  mossCompanion,
  resetGodCompanion,
  tokenThiefCompanion,
  picoCompanion,
  puddleCompanion,
  mochiCompanion,
] as const;

export function defaultCompanionForTheme(
  themeId: string,
): CompanionDefinition | null {
  return (
    builtinCompanions.find((item) => item.defaultThemeIds.includes(themeId)) ??
    null
  );
}

/** Keeps v0.1 themes with one embedded entity functional during migration. */
export function embeddedCompanionForTheme(
  theme: ThemeDefinition,
): CompanionDefinition | null {
  const entity = theme.scene.entities[0];
  if (!entity) return null;
  const rendererPaths = new Set([
    entity.renderer.asset,
    ...(entity.renderer.type === "sprite-atlas"
      ? (entity.renderer.pages ?? [])
      : []),
  ]);
  const assets = theme.assets.filter((asset) => rendererPaths.has(asset.path));
  if (assets.length === 0) return null;
  const name = entity.name || `${theme.metadata.name} companion`;
  const description = `Legacy companion embedded in ${theme.metadata.name}.`;
  return {
    format: COMPANION_FORMAT,
    id: `legacy.${theme.id}.${entity.id}`.slice(0, 96),
    version: theme.version,
    name,
    description,
    metadata: {
      name,
      description,
      author: theme.metadata.author,
      license: theme.metadata.license,
      tags: ["companion", "legacy-embedded"],
    },
    compatibility: {
      styler: { minimumVersion: "0.1.0" },
    },
    entity: structuredClone(entity),
    assets: structuredClone(assets),
    defaultThemeIds: [theme.id],
    locales: Object.fromEntries(
      Object.entries(theme.locales).map(([locale, copy]) => [
        locale,
        { name, description: `${description} ${copy.name}` },
      ]),
    ),
  };
}

export interface CompanionOverrides {
  anchor?: { x: number; y: number };
  attachment?: SceneEntity["attachment"] | null;
  size?: number;
}

export function composeThemeWithCompanion(
  theme: ThemeDefinition,
  companion: CompanionDefinition | null,
  overrides?: CompanionOverrides,
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
  composed.assets.push(...structuredClone(companion.assets));
  return composed;
}
