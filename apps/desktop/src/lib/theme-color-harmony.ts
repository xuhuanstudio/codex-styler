import type {
  ThemeDefinition,
  ThemeSemanticPalette,
  ThemeVariant,
  ThemeVariantName,
} from "@codex-styler/theme-core";
import { adaptiveReadableColor, mixColors } from "./contrast";

export type ThemeColorHarmonyId = "automatic" | "tonal" | "contrast";
export type ThemeColorHarmonyMode = ThemeColorHarmonyId | "authored";

const recipeStrength = {
  tonal: {
    canvas: 0.28,
    raised: 0.055,
    overlay: 0.09,
    sunken: 0.16,
    control: 0.075,
    hover: 0.12,
    active: 0.18,
    borderSubtle: 0.62,
    borderStrong: 0.18,
  },
  contrast: {
    canvas: 0.16,
    raised: 0.1,
    overlay: 0.16,
    sunken: 0.24,
    control: 0.12,
    hover: 0.2,
    active: 0.28,
    borderSubtle: 0.78,
    borderStrong: 0.36,
  },
} as const;

function samePalette(
  left: ThemeSemanticPalette | undefined,
  right: ThemeSemanticPalette | undefined,
): boolean {
  if (!left || !right) return left === right;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every(
    (key) =>
      left[key as keyof ThemeSemanticPalette] ===
      right[key as keyof ThemeSemanticPalette],
  );
}

export function createThemeColorHarmonyPalette(
  variant: ThemeVariant,
  recipe: Exclude<ThemeColorHarmonyId, "automatic">,
): ThemeSemanticPalette {
  const { appearance, background } = variant;
  const strength = recipeStrength[recipe];
  const surface = appearance.surface;
  const accent = appearance.accent;

  return {
    canvas: mixColors(background.color, surface, strength.canvas),
    surfaceRaised: mixColors(surface, accent, strength.raised),
    surfaceOverlay: mixColors(surface, accent, strength.overlay),
    surfaceSunken: mixColors(surface, background.color, strength.sunken),
    control: mixColors(surface, accent, strength.control),
    controlHover: mixColors(surface, accent, strength.hover),
    controlActive: mixColors(surface, accent, strength.active),
    textTertiary: adaptiveReadableColor(
      appearance.mutedText,
      [surface, mixColors(surface, accent, strength.active)],
      3,
    ),
    onAccent: adaptiveReadableColor(surface, accent, 4.5),
    borderSubtle: mixColors(surface, appearance.border, strength.borderSubtle),
    borderStrong: mixColors(
      appearance.border,
      appearance.text,
      strength.borderStrong,
    ),
    focus: accent,
  };
}

export function resolveThemeColorHarmonyMode(
  variant: ThemeVariant,
): ThemeColorHarmonyMode {
  if (!variant.appearance.palette) return "automatic";
  if (
    samePalette(
      variant.appearance.palette,
      createThemeColorHarmonyPalette(variant, "tonal"),
    )
  ) {
    return "tonal";
  }
  if (
    samePalette(
      variant.appearance.palette,
      createThemeColorHarmonyPalette(variant, "contrast"),
    )
  ) {
    return "contrast";
  }
  return "authored";
}

export function assignThemeColorHarmony(
  theme: ThemeDefinition,
  variantName: ThemeVariantName,
  recipe: ThemeColorHarmonyId,
) {
  const variant = theme.variants[variantName];
  variant.appearance.palette =
    recipe === "automatic"
      ? undefined
      : createThemeColorHarmonyPalette(variant, recipe);
}

export function themeColorHarmonySwatches(
  variant: ThemeVariant,
  recipe: ThemeColorHarmonyMode,
): [string, string, string] {
  if (recipe === "authored") {
    const palette = variant.appearance.palette ?? {};
    return [
      palette.surfaceRaised ?? variant.appearance.surface,
      palette.controlActive ?? variant.appearance.accent,
      variant.appearance.accent,
    ];
  }
  if (recipe === "automatic") {
    const strength =
      variant.appearance.decorations === "expressive"
        ? 0.28
        : variant.appearance.decorations === "subtle"
          ? 0.18
          : 0.12;
    return [
      variant.appearance.surface,
      mixColors(
        variant.appearance.surface,
        variant.appearance.accent,
        strength,
      ),
      variant.appearance.accent,
    ];
  }
  const palette = createThemeColorHarmonyPalette(variant, recipe);
  return [
    palette.surfaceRaised ?? variant.appearance.surface,
    palette.controlActive ?? variant.appearance.accent,
    variant.appearance.accent,
  ];
}
