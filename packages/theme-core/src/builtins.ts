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
  chrome: Pick<
    ThemeVariant["appearance"],
    "layout" | "iconStyle" | "decorations"
  > = {
    layout: "native",
    iconStyle: "native",
    decorations: "none",
  },
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
      ...chrome,
    },
    motion: {
      intensity: 0.5,
      parallax: 8,
      targetFps: 30,
    },
  };
}

function detailedVariant(
  base: ThemeVariant,
  palette: NonNullable<ThemeVariant["appearance"]["palette"]>,
  motion: Partial<ThemeVariant["motion"]>,
  radius = base.appearance.radius,
): ThemeVariant {
  return {
    ...base,
    appearance: { ...base.appearance, palette, radius },
    motion: { ...base.motion, ...motion },
  };
}

export const nativeRefined: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.native-refined",
  version: "1.0.0",
  metadata: {
    name: "Native Refined",
    description:
      "A quieter, more deliberate interpretation of the native workspace.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["minimal", "native", "light", "dark"],
    preview: "previews/native-refined.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: {
      mode: "semantic",
      testedVersions: ["26.707.72221", "26.707.91948"],
    },
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
      { layout: "native", iconStyle: "contained", decorations: "subtle" },
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
      { layout: "native", iconStyle: "contained", decorations: "subtle" },
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
      description:
        "The native workspace, with calmer contrast and cleaner rhythm.",
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
    description:
      "A cinematic midnight workspace shaped by ink, glass, and amber light.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["cinematic", "dark", "image", "studio"],
    preview: "previews/nocturne-studio.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: {
      mode: "semantic",
      testedVersions: ["26.707.72221", "26.707.91948"],
    },
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
      { layout: "editorial", iconStyle: "themed", decorations: "expressive" },
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
        { layout: "editorial", iconStyle: "themed", decorations: "expressive" },
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
      description:
        "Ink-dark surfaces, quiet glass, and a controlled amber horizon.",
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
    name: "Quiet Garden",
    description:
      "A living garden workspace with calm, legible translucent surfaces.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["nature", "calm", "image", "light", "dark"],
    preview: "previews/quiet-garden.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: {
      mode: "semantic",
      testedVersions: ["26.707.72221", "26.707.91948"],
    },
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
        { layout: "immersive", iconStyle: "themed", decorations: "expressive" },
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
        { layout: "immersive", iconStyle: "themed", decorations: "expressive" },
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
    entities: [],
  },
  assets: [
    {
      id: "garden-background",
      path: "assets/quiet-garden.webp",
      type: "background",
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
      name: "Quiet Garden",
      description:
        "A quiet garden scene with readable, translucent workspace surfaces.",
    },
    "zh-CN": {
      name: "静谧花园",
      description: "安静的花园场景，搭配清晰易读的半透明工作区表面。",
    },
  },
};

export const gildedGrandeur: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.gilded-grandeur",
  version: "1.0.0",
  metadata: {
    name: "Gilded Grandeur",
    description:
      "An obsidian-and-gold workspace with architectural depth and precise luminous accents.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["gold", "luxury", "image", "editorial", "light", "dark"],
    preview: "previews/gilded-grandeur.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: {
      mode: "semantic",
      testedVersions: ["26.707.72221", "26.707.91948"],
    },
  },
  variants: {
    light: {
      ...detailedVariant(
        variant(
          "#d6bd80",
          "#f7edcf",
          "#2d210f",
          "#6e5b3a",
          "#aa8c4e",
          "#87560b",
          "#f1e2bb",
          0.38,
          0.88,
          {
            layout: "editorial",
            iconStyle: "themed",
            decorations: "expressive",
          },
        ),
        {
          canvas: "#dfc98f",
          surfaceRaised: "#fff6dc",
          surfaceOverlay: "#f5e5bc",
          surfaceSunken: "#e8d39e",
          control: "#f0dfb5",
          controlHover: "#e7cf93",
          controlActive: "#dbc17c",
          textTertiary: "#77613d",
          onAccent: "#fff9e8",
          borderSubtle: "#cdb271",
          borderStrong: "#8f6d28",
          focus: "#87560b",
          success: "#236b43",
          warning: "#81500d",
          danger: "#a7352e",
          info: "#245d8a",
          added: "#236b43",
          modified: "#81500d",
          deleted: "#a7352e",
        },
        { intensity: 0.42, parallax: 6, targetFps: 30 },
        10,
      ),
      background: {
        color: "#d6bd80",
        image: "assets/gilded-grandeur.webp",
        position: { x: 54, y: 48 },
        brightness: 1.04,
        blur: 0,
        overlay: "#f0dfb5",
        overlayOpacity: 0.38,
      },
    },
    dark: {
      ...detailedVariant(
        variant(
          "#090704",
          "#18130b",
          "#fff2cd",
          "#c0a875",
          "#5b4721",
          "#e8bd55",
          "#080602",
          0.34,
          0.76,
          {
            layout: "editorial",
            iconStyle: "themed",
            decorations: "expressive",
          },
        ),
        {
          canvas: "#0b0804",
          surfaceRaised: "#21190c",
          surfaceOverlay: "#2a1e0d",
          surfaceSunken: "#100c06",
          control: "#2b210f",
          controlHover: "#3a2b12",
          controlActive: "#4b3714",
          textTertiary: "#a98c59",
          onAccent: "#211400",
          borderSubtle: "#46381f",
          borderStrong: "#80652d",
          focus: "#f2c75b",
          success: "#72b881",
          warning: "#f0bf4a",
          danger: "#e9786e",
          info: "#85b9e6",
          added: "#72b881",
          modified: "#f0bf4a",
          deleted: "#e9786e",
        },
        { intensity: 0.48, parallax: 7, targetFps: 30 },
        10,
      ),
      background: {
        color: "#090704",
        image: "assets/gilded-grandeur.webp",
        position: { x: 54, y: 48 },
        brightness: 0.82,
        blur: 0,
        overlay: "#080602",
        overlayOpacity: 0.34,
      },
    },
  },
  scene: {
    layers: [
      {
        id: "gilded-background",
        type: "image",
        asset: "assets/gilded-grandeur.webp",
        opacity: 1,
        blendMode: "normal",
        parallax: 7,
      },
      {
        id: "gilded-vignette",
        type: "vignette",
        opacity: 0.4,
        blendMode: "multiply",
        parallax: 0,
      },
    ],
    entities: [],
  },
  assets: [
    {
      id: "gilded-background",
      path: "assets/gilded-grandeur.webp",
      type: "background",
      license: "CC-BY-4.0",
    },
    {
      id: "gilded-preview",
      path: "previews/gilded-grandeur.webp",
      type: "preview",
      license: "CC-BY-4.0",
    },
  ],
  locales: {
    en: {
      name: "Gilded Grandeur",
      description:
        "Obsidian architecture, warm gold light, and deeply polished workspace surfaces.",
    },
    "zh-CN": {
      name: "金辉盛境",
      description: "黑曜石建筑、鎏金暖光与层次分明的华丽工作区表面。",
    },
  },
};

export const merryBigTop: ThemeDefinition = {
  format: THEME_FORMAT,
  id: "codex-styler.merry-big-top",
  version: "1.0.0",
  metadata: {
    name: "Merry Big Top",
    description:
      "A playful theatrical workspace with tactile circus color and buoyant motion.",
    author: "Codex Styler contributors",
    license: "CC-BY-4.0",
    tags: ["circus", "playful", "image", "colorful", "light", "dark"],
    preview: "previews/merry-big-top.webp",
  },
  compatibility: {
    styler: { minimumVersion: "0.1.0" },
    codex: {
      mode: "semantic",
      testedVersions: ["26.707.72221", "26.707.91948"],
    },
  },
  variants: {
    light: {
      ...detailedVariant(
        variant(
          "#d99a61",
          "#fff1d9",
          "#2b1b19",
          "#715a54",
          "#c58a70",
          "#b72f2d",
          "#ffe7c2",
          0.28,
          0.88,
          {
            layout: "immersive",
            iconStyle: "themed",
            decorations: "expressive",
          },
        ),
        {
          canvas: "#efbd83",
          surfaceRaised: "#fff8e8",
          surfaceOverlay: "#ffe7c8",
          surfaceSunken: "#f2cba4",
          control: "#f9dcc0",
          controlHover: "#efc7a7",
          controlActive: "#e6b38f",
          textTertiary: "#76574e",
          onAccent: "#fff8e8",
          borderSubtle: "#d7a188",
          borderStrong: "#9f554c",
          focus: "#9f2928",
          success: "#17705d",
          warning: "#85520b",
          danger: "#a72f3b",
          info: "#176785",
          added: "#17705d",
          modified: "#85520b",
          deleted: "#a72f3b",
        },
        { intensity: 0.72, parallax: 11, targetFps: 60 },
        18,
      ),
      background: {
        color: "#d99a61",
        image: "assets/merry-big-top.webp",
        position: { x: 55, y: 48 },
        brightness: 1.04,
        blur: 0,
        overlay: "#ffe3bd",
        overlayOpacity: 0.28,
      },
    },
    dark: {
      ...detailedVariant(
        variant(
          "#100b14",
          "#241923",
          "#fff2dc",
          "#cdb9ac",
          "#5a3d4b",
          "#ff755e",
          "#0b0b13",
          0.34,
          0.74,
          {
            layout: "immersive",
            iconStyle: "themed",
            decorations: "expressive",
          },
        ),
        {
          canvas: "#100b14",
          surfaceRaised: "#30202c",
          surfaceOverlay: "#3a2433",
          surfaceSunken: "#171018",
          control: "#352431",
          controlHover: "#463044",
          controlActive: "#5a354d",
          textTertiary: "#b798a9",
          onAccent: "#2c1010",
          borderSubtle: "#5a3d4b",
          borderStrong: "#9a5a6d",
          focus: "#ff8b73",
          success: "#61c8a3",
          warning: "#f4bd55",
          danger: "#ff7e86",
          info: "#68c7df",
          added: "#61c8a3",
          modified: "#f4bd55",
          deleted: "#ff7e86",
        },
        { intensity: 0.78, parallax: 13, targetFps: 60 },
        18,
      ),
      background: {
        color: "#100b14",
        image: "assets/merry-big-top.webp",
        position: { x: 55, y: 48 },
        brightness: 0.82,
        blur: 0,
        overlay: "#0b0b13",
        overlayOpacity: 0.34,
      },
    },
  },
  scene: {
    layers: [
      {
        id: "big-top-background",
        type: "image",
        asset: "assets/merry-big-top.webp",
        opacity: 1,
        blendMode: "normal",
        parallax: 13,
      },
      {
        id: "big-top-vignette",
        type: "vignette",
        opacity: 0.28,
        blendMode: "multiply",
        parallax: 0,
      },
    ],
    entities: [],
  },
  assets: [
    {
      id: "big-top-background",
      path: "assets/merry-big-top.webp",
      type: "background",
      license: "CC-BY-4.0",
    },
    {
      id: "big-top-preview",
      path: "previews/merry-big-top.webp",
      type: "preview",
      license: "CC-BY-4.0",
    },
  ],
  locales: {
    en: {
      name: "Merry Big Top",
      description:
        "A tactile circus stage with playful color, rounded chrome, and buoyant motion.",
    },
    "zh-CN": {
      name: "滑稽马戏团",
      description: "有趣的马戏舞台、圆润组件、活泼配色与轻快动态。",
    },
  },
};

export const builtinThemes = [
  nativeRefined,
  gildedGrandeur,
  merryBigTop,
  nocturneStudio,
  quietGarden,
];
