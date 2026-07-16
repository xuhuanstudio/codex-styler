import type { ThemeDefinition, ThemeVariant } from "./types";
import { THEME_FORMAT } from "./types";

function variant(
  background: string,
  surface: string,
  text: string,
  mutedText: string,
  border: string,
  accent: string,
  overlay: string,
  overlayOpacity: number,
  surfaceOpacity: number,
): ThemeVariant {
  return {
    background: {
      color: background,
      position: { x: 50, y: 50 },
      brightness: 1,
      blur: 0,
      overlay,
      overlayOpacity,
    },
    appearance: {
      accent,
      surface,
      surfaceOpacity,
      text,
      mutedText,
      border,
      radius: 14,
      focusOpacity: 0.84,
      focusBlur: 12,
    },
    motion: {
      intensity: 0.5,
      parallax: 8,
      targetFps: 30,
    },
  };
}

export const nativeRefined: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.native-refined",
  version: "1.0.0",
  metadata: {
    name: "Native Refined",
    description: "A quieter, more deliberate interpretation of the native workspace.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["minimal", "native", "light", "dark"],
    preview: "previews/native-refined.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: { mode: "safe", testedVersions: [] },
  },
  variants: {
    light: variant(
      "#e9e7e1",
      "#f7f5ef",
      "#20201e",
      "#6e6c66",
      "#c9c5ba",
      "#446f63",
      "#e9e7e1",
      0.06,
      0.88,
    ),
    dark: variant(
      "#151716",
      "#202321",
      "#f1eee6",
      "#a7aaa5",
      "#3a3e3b",
      "#8dc9b3",
      "#0c0e0d",
      0.18,
      0.9,
    ),
  },
  scene: {
    layers: [
      {
        id: "soft-vignette",
        type: "vignette",
        opacity: 0.24,
        blendMode: "multiply",
        parallax: 0,
      },
    ],
    entities: [],
  },
  assets: [
    {
      id: "native-preview",
      path: "previews/native-refined.webp",
      type: "preview",
      license: "CC-BY-4.0",
    },
  ],
  locales: {
    en: {
      name: "Native Refined",
      description: "The native workspace, with calmer contrast and cleaner rhythm.",
    },
    "zh-CN": {
      name: "原生精修",
      description: "保留原生秩序，降低干扰并重新校准明暗节奏。",
    },
  },
};

export const nocturneStudio: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.nocturne-studio",
  version: "1.0.0",
  metadata: {
    name: "Nocturne Studio",
    description: "A cinematic midnight workspace shaped by ink, glass, and amber light.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["cinematic", "dark", "image", "studio"],
    preview: "previews/nocturne-studio.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: { mode: "semantic", testedVersions: [] },
  },
  variants: {
    light: variant(
      "#d6d3cc",
      "#f0ede6",
      "#24231f",
      "#67645c",
      "#b8b3a8",
      "#a35d37",
      "#ddd6ca",
      0.16,
      0.82,
    ),
    dark: {
      ...variant(
        "#090b0d",
        "#14181a",
        "#f5efe6",
        "#a9a49b",
        "#34383a",
        "#e9a066",
        "#071014",
        0.42,
        0.72,
      ),
      background: {
        color: "#090b0d",
        image: "assets/nocturne-studio.webp",
        position: { x: 58, y: 46 },
        brightness: 0.78,
        blur: 0,
        overlay: "#071014",
        overlayOpacity: 0.42,
      },
    },
  },
  scene: {
    layers: [
      {
        id: "studio-background",
        type: "image",
        asset: "assets/nocturne-studio.webp",
        opacity: 1,
        blendMode: "normal",
        parallax: 5,
      },
      {
        id: "studio-vignette",
        type: "vignette",
        opacity: 0.55,
        blendMode: "multiply",
        parallax: 0,
      },
    ],
    entities: [],
  },
  assets: [
    {
      id: "nocturne-background",
      path: "assets/nocturne-studio.webp",
      type: "background",
      license: "CC-BY-4.0",
    },
    {
      id: "nocturne-preview",
      path: "previews/nocturne-studio.webp",
      type: "preview",
      license: "CC-BY-4.0",
    },
  ],
  locales: {
    en: {
      name: "Nocturne Studio",
      description: "Ink-dark surfaces, quiet glass, and a controlled amber horizon.",
    },
    "zh-CN": {
      name: "夜曲工作室",
      description: "墨色表面、克制玻璃与一线温暖的琥珀光。",
    },
  },
};

export const quietGarden: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.quiet-garden",
  version: "1.0.0",
  metadata: {
    name: "Quiet Garden Companion",
    description: "A living garden workspace with an original pointer-aware companion.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["nature", "interactive", "companion", "image"],
    preview: "previews/quiet-garden.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: { mode: "safe", testedVersions: [] },
  },
  variants: {
    light: {
      ...variant(
        "#d9dfd2",
        "#f2f1e8",
        "#263128",
        "#687269",
        "#b9c2b5",
        "#56745b",
        "#dbe3d6",
        0.18,
        0.76,
      ),
      background: {
        color: "#d9dfd2",
        image: "assets/quiet-garden.webp",
        position: { x: 52, y: 50 },
        brightness: 1,
        blur: 0,
        overlay: "#dce5d9",
        overlayOpacity: 0.14,
      },
    },
    dark: {
      ...variant(
        "#101612",
        "#18211b",
        "#edf2e8",
        "#a5afa5",
        "#364339",
        "#9fc29a",
        "#0d1510",
        0.34,
        0.68,
      ),
      background: {
        color: "#101612",
        image: "assets/quiet-garden.webp",
        position: { x: 52, y: 50 },
        brightness: 0.64,
        blur: 0,
        overlay: "#07110b",
        overlayOpacity: 0.38,
      },
    },
  },
  scene: {
    layers: [
      {
        id: "garden-background",
        type: "image",
        asset: "assets/quiet-garden.webp",
        opacity: 1,
        blendMode: "normal",
        parallax: 8,
      },
      {
        id: "garden-vignette",
        type: "vignette",
        opacity: 0.34,
        blendMode: "multiply",
        parallax: 0,
      },
    ],
    entities: [
      {
        id: "moss-gecko",
        name: "Moss",
        renderer: {
          type: "sprite-atlas",
          asset: "assets/moss-gecko-atlas.webp",
          columns: 8,
          rows: 2,
          frameWidth: 221,
          frameHeight: 443,
          directions: 16,
        },
        behaviors: ["idle", "look-at-pointer", "reduce-motion-fallback"],
        anchor: { x: 84, y: 66 },
        size: 112,
        opacity: 0.96,
      },
    ],
  },
  assets: [
    {
      id: "garden-background",
      path: "assets/quiet-garden.webp",
      type: "background",
      license: "CC-BY-4.0",
    },
    {
      id: "moss-gecko-atlas",
      path: "assets/moss-gecko-atlas.webp",
      type: "sprite-atlas",
      license: "CC-BY-4.0",
    },
    {
      id: "garden-preview",
      path: "previews/quiet-garden.webp",
      type: "preview",
      license: "CC-BY-4.0",
    },
  ],
  locales: {
    en: {
      name: "Quiet Garden Companion",
      description: "A calm green workspace watched over by Moss, a tiny attentive gecko.",
    },
    "zh-CN": {
      name: "静谧花园伙伴",
      description: "安静的绿色工作空间，以及会留意光标方向的小壁虎 Moss。",
    },
  },
};

export const builtinThemes = [nativeRefined, nocturneStudio, quietGarden];
