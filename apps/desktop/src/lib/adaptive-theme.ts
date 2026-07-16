import {
  THEME_FORMAT,
  type ThemeDefinition,
  type ThemeVariant,
} from "@codex-styler/theme-core";

type Rgb = [number, number, number];

export type AdaptiveSchemeId = "balanced" | "cinematic" | "soft" | "vivid";

export interface AdaptiveImageProfile {
  dominant: string;
  accent: string;
  average: string;
  luminance: number;
  saturation: number;
}

export interface AdaptiveScheme {
  id: AdaptiveSchemeId;
  variants: ThemeDefinition["variants"];
  swatches: [string, string, string];
}

export interface AdaptiveThemeResult {
  theme: ThemeDefinition;
  files: Map<string, Uint8Array>;
  schemes: AdaptiveScheme[];
  selectedSchemeId: AdaptiveSchemeId;
}

const clamp = (value: number, minimum = 0, maximum = 255) =>
  Math.min(maximum, Math.max(minimum, value));

function rgbToHex(rgb: Rgb): string {
  return (
    "#" +
    rgb
      .map((channel) =>
        Math.round(clamp(channel)).toString(16).padStart(2, "0"),
      )
      .join("")
  );
}

function hexToRgb(hex: string): Rgb {
  return [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  ) as Rgb;
}

function mix(first: string, second: string, amount: number): string {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return rgbToHex(
    a.map(
      (channel, index) => channel * (1 - amount) + b[index] * amount,
    ) as Rgb,
  );
}

function relativeLuminance(rgb: Rgb): number {
  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function saturation(rgb: Rgb): number {
  const maximum = Math.max(...rgb) / 255;
  const minimum = Math.min(...rgb) / 255;
  if (maximum === minimum) return 0;
  const lightness = (maximum + minimum) / 2;
  return (maximum - minimum) / (1 - Math.abs(2 * lightness - 1));
}

function distance(first: Rgb, second: Rgb): number {
  return Math.sqrt(
    first.reduce(
      (sum, channel, index) => sum + (channel - second[index]) ** 2,
      0,
    ),
  );
}

export function analyzeImageSamples(samples: Rgb[]): AdaptiveImageProfile {
  if (samples.length === 0) {
    return {
      dominant: "#5e677a",
      accent: "#7894d8",
      average: "#5e677a",
      luminance: 0.14,
      saturation: 0.13,
    };
  }
  const averageRgb = samples
    .reduce<Rgb>(
      (sum, value) => [sum[0] + value[0], sum[1] + value[1], sum[2] + value[2]],
      [0, 0, 0],
    )
    .map((value) => value / samples.length) as Rgb;
  const buckets = new Map<string, { rgb: Rgb; count: number }>();
  for (const sample of samples) {
    const quantized = sample.map(
      (channel) => Math.round(channel / 24) * 24,
    ) as Rgb;
    const key = quantized.join(":");
    const current = buckets.get(key);
    if (current) current.count += 1;
    else buckets.set(key, { rgb: quantized, count: 1 });
  }
  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);
  const dominantRgb = ranked[0]?.rgb ?? averageRgb;
  const accentRgb =
    ranked
      .slice(0, 28)
      .sort(
        (a, b) =>
          saturation(b.rgb) * (0.5 + distance(b.rgb, dominantRgb) / 220) -
          saturation(a.rgb) * (0.5 + distance(a.rgb, dominantRgb) / 220),
      )[0]?.rgb ?? averageRgb;
  return {
    dominant: rgbToHex(dominantRgb),
    accent: rgbToHex(accentRgb),
    average: rgbToHex(averageRgb),
    luminance: relativeLuminance(averageRgb),
    saturation: saturation(averageRgb),
  };
}

function themeVariant(
  profile: AdaptiveImageProfile,
  imagePath: string,
  mode: "light" | "dark",
  scheme: AdaptiveSchemeId,
): ThemeVariant {
  const dark = mode === "dark";
  const controls = {
    balanced: {
      layout: "native" as const,
      iconStyle: "contained" as const,
      decorations: "subtle" as const,
      radius: 14,
      overlayOpacity: dark ? 0.42 : 0.5,
      surfaceOpacity: dark ? 0.82 : 0.88,
      brightness: dark ? 0.72 : 1.02,
    },
    cinematic: {
      layout: "editorial" as const,
      iconStyle: "themed" as const,
      decorations: "expressive" as const,
      radius: 18,
      overlayOpacity: dark ? 0.54 : 0.58,
      surfaceOpacity: dark ? 0.78 : 0.86,
      brightness: dark ? 0.62 : 0.96,
    },
    soft: {
      layout: "native" as const,
      iconStyle: "contained" as const,
      decorations: "subtle" as const,
      radius: 20,
      overlayOpacity: dark ? 0.48 : 0.62,
      surfaceOpacity: dark ? 0.88 : 0.92,
      brightness: dark ? 0.76 : 1.06,
    },
    vivid: {
      layout: "immersive" as const,
      iconStyle: "themed" as const,
      decorations: "expressive" as const,
      radius: 12,
      overlayOpacity: dark ? 0.34 : 0.44,
      surfaceOpacity: dark ? 0.76 : 0.84,
      brightness: dark ? 0.78 : 1.04,
    },
  }[scheme];
  const surface = dark
    ? mix(profile.dominant, "#0b0d12", scheme === "vivid" ? 0.7 : 0.82)
    : mix(profile.dominant, "#f8f8f6", scheme === "vivid" ? 0.8 : 0.9);
  const accent = dark
    ? mix(profile.accent, "#ffffff", profile.luminance < 0.08 ? 0.36 : 0.22)
    : mix(profile.accent, "#111318", profile.luminance > 0.55 ? 0.3 : 0.16);
  const text = dark ? "#f5f5f2" : "#17181b";
  const mutedText = dark ? "#b7bac2" : "#5d616a";
  return {
    background: {
      color: dark ? mix(profile.average, "#08090d", 0.78) : "#ececea",
      image: imagePath,
      position: { x: 50, y: 50 },
      brightness: controls.brightness,
      blur: 0,
      overlay: dark
        ? mix(profile.dominant, "#07090d", 0.84)
        : mix(profile.dominant, "#f7f7f4", 0.88),
      overlayOpacity: controls.overlayOpacity,
    },
    appearance: {
      accent,
      surface,
      surfaceOpacity: controls.surfaceOpacity,
      text,
      mutedText,
      border: dark ? mix(profile.dominant, "#777b86", 0.52) : "#c5c7c8",
      radius: controls.radius,
      focusOpacity: 0.88,
      focusBlur: scheme === "cinematic" ? 18 : 12,
      layout: controls.layout,
      iconStyle: controls.iconStyle,
      decorations: controls.decorations,
    },
    motion: {
      intensity: scheme === "soft" ? 0.3 : 0.5,
      parallax: scheme === "cinematic" || scheme === "vivid" ? 10 : 6,
      targetFps: 30,
    },
  };
}

export function createAdaptiveSchemes(
  profile: AdaptiveImageProfile,
  imagePath: string,
): AdaptiveScheme[] {
  return (["balanced", "cinematic", "soft", "vivid"] as const).map((id) => {
    const light = themeVariant(profile, imagePath, "light", id);
    const dark = themeVariant(profile, imagePath, "dark", id);
    return {
      id,
      variants: { light, dark },
      swatches: [
        dark.appearance.surface,
        dark.appearance.accent,
        light.appearance.surface,
      ],
    };
  });
}

async function sampleImage(file: File): Promise<AdaptiveImageProfile> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Unsupported image type");
  }
  if (file.size > 20 * 1024 * 1024) throw new Error("Image exceeds 20 MiB");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 8192 || bitmap.height > 8192) {
      throw new Error("Image dimensions exceed 8192 pixels");
    }
    const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image analysis is unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const samples: Rgb[] = [];
    for (let index = 0; index < pixels.length; index += 16) {
      if (pixels[index + 3] < 128) continue;
      samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
    }
    return analyzeImageSamples(samples);
  } finally {
    bitmap.close();
  }
}

function selectedScheme(profile: AdaptiveImageProfile): AdaptiveSchemeId {
  if (profile.luminance < 0.12) return "cinematic";
  if (profile.saturation < 0.13) return "soft";
  if (profile.saturation > 0.48) return "vivid";
  return "balanced";
}

export async function createAdaptiveTheme(
  file: File,
): Promise<AdaptiveThemeResult> {
  const profile = await sampleImage(file);
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const imagePath = `assets/background.${extension}`;
  const schemes = createAdaptiveSchemes(profile, imagePath);
  const selectedSchemeId = selectedScheme(profile);
  const scheme =
    schemes.find((item) => item.id === selectedSchemeId) ?? schemes[0];
  const suffix = Math.random().toString(36).slice(2, 8);
  const theme: ThemeDefinition = {
    format: THEME_FORMAT,
    id: `local.image-adaptive-${suffix}`,
    version: "0.1.0",
    metadata: {
      name: "Image Adaptive",
      description:
        "A locally generated visual system derived from an imported image.",
      author: "Local user",
      license: "User-provided",
      tags: ["image", "adaptive", selectedSchemeId],
    },
    compatibility: {
      styler: { minimumVersion: "0.1.0" },
      codex: { mode: "semantic", testedVersions: [] },
    },
    variants: structuredClone(scheme.variants),
    scene: {
      layers: [
        {
          id: "adaptive-background",
          type: "image",
          asset: imagePath,
          opacity: 1,
          blendMode: "normal",
          parallax: 8,
        },
        {
          id: "adaptive-vignette",
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
        id: "adaptive-background",
        path: imagePath,
        type: "background",
        license: "User-provided",
      },
    ],
    locales: {
      en: {
        name: "Image Adaptive",
        description: "A complete visual direction generated from your image.",
      },
      "zh-CN": {
        name: "图片自适应",
        description: "根据你的图片生成完整视觉方向。",
      },
    },
  };
  return {
    theme,
    files: new Map([[imagePath, new Uint8Array(await file.arrayBuffer())]]),
    schemes,
    selectedSchemeId,
  };
}
