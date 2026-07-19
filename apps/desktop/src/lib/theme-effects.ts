import type {
  ThemeDefinition,
  ThemeVariantName,
} from "@codex-styler/theme-core";

export type ThemeEffectId =
  | "background"
  | "surfaces"
  | "controls"
  | "icons"
  | "typography"
  | "motion"
  | "readability";

export interface ThemeEffectCoverage {
  id: ThemeEffectId;
  active: boolean;
}

export type ThemeGeometry = "precise" | "balanced" | "soft";
export type ThemeMaterialCharacter = "solid" | "layered" | "frosted";
export type ThemeMotionCharacter = "still" | "calm" | "fluid" | "expressive";
export type ThemeTypographyCharacter = "balanced" | "editorial" | "cinematic";

export interface ThemeVisualPersonality {
  layout: "native" | "editorial" | "immersive";
  geometry: ThemeGeometry;
  material: ThemeMaterialCharacter;
  iconStyle: "native" | "contained" | "themed";
  decorations: "none" | "subtle" | "expressive";
  typography: ThemeTypographyCharacter;
  motion: ThemeMotionCharacter;
}

/**
 * Turns portable theme controls into a stable, user-facing visual character.
 * The same thresholds are mirrored by the injected runtime so custom themes
 * inherit the treatment without theme-id-specific CSS.
 */
export function resolveThemeVisualPersonality(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): ThemeVisualPersonality {
  const visual = theme.variants[variant];
  const radius = visual.appearance.radius;
  const intensity = visual.motion.intensity;
  const materialOpacity = Math.min(
    visual.appearance.surfaceOpacity,
    visual.appearance.focusOpacity,
  );
  const material =
    visual.appearance.focusBlur <= 4 && materialOpacity >= 0.93
      ? "solid"
      : visual.appearance.focusBlur >= 16 || materialOpacity <= 0.82
        ? "frosted"
        : "layered";

  return {
    layout: visual.appearance.layout ?? "native",
    geometry: radius <= 11 ? "precise" : radius >= 17 ? "soft" : "balanced",
    material,
    iconStyle: visual.appearance.iconStyle ?? "native",
    decorations: visual.appearance.decorations ?? "none",
    typography:
      visual.appearance.layout === "editorial"
        ? "editorial"
        : visual.appearance.layout === "immersive"
          ? "cinematic"
          : "balanced",
    motion:
      intensity <= 0.05
        ? "still"
        : intensity < 0.4
          ? "calm"
          : intensity < 0.72
            ? "fluid"
            : "expressive",
  };
}

/**
 * Describes only effects that the runtime can actually deliver. Keeping this
 * derived from the portable theme data prevents the library from advertising
 * editor controls that are not mapped into Codex.
 */
export function resolveThemeEffectCoverage(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): ThemeEffectCoverage[] {
  const visual = theme.variants[variant];
  const semantic = theme.compatibility.codex.mode === "semantic";
  const hasMotion =
    visual.motion.intensity > 0 &&
    ((visual.motion.parallax ?? 0) > 0 ||
      theme.scene.layers.some((layer) => Math.abs(layer.parallax) > 0));

  return [
    { id: "background", active: true },
    { id: "surfaces", active: semantic },
    { id: "controls", active: semantic },
    {
      id: "icons",
      active:
        semantic && (visual.appearance.iconStyle ?? "native") !== "native",
    },
    { id: "typography", active: semantic },
    { id: "motion", active: hasMotion },
    { id: "readability", active: semantic },
  ];
}
