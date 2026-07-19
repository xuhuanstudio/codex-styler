import type {
  ThemeDefinition,
  ThemeVariantName,
} from "@codex-styler/theme-core";
import { minimumContrast } from "./contrast";
import { resolveThemeContrast } from "./theme-contrast";
import {
  preferredThemeIconColor,
  resolveThemePreviewPalette,
} from "./theme-preview-palette";

export type ThemeVisualQualityCheckId =
  "primary-text" | "secondary-text" | "icons" | "accent-content" | "boundaries";

export interface ThemeVisualQualityCheck {
  id: ThemeVisualQualityCheckId;
  ratio: number;
  minimum: number;
  protected: boolean;
}

export interface ThemeVisualQualityReport {
  checks: ThemeVisualQualityCheck[];
  protectedCount: number;
  hasImageBackdrop: boolean;
  authoredSurfaceOpacity: number;
  effectiveSurfaceOpacity: number;
}

export function resolveThemeVisualQuality(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): ThemeVisualQualityReport {
  const visual = theme.variants[variant];
  const contrast = resolveThemeContrast(theme, variant);
  const palette = resolveThemePreviewPalette(
    visual.appearance,
    visual.background.color,
    contrast,
  );
  const semanticSurfaces = [
    ...contrast.quietBackgrounds,
    ...contrast.strongBackgrounds,
    palette.canvas,
    palette.surfaceRaised,
    palette.surfaceOverlay,
    palette.surfaceSunken,
    palette.control,
    palette.controlHover,
    palette.controlActive,
  ];
  const boundarySurfaces = [
    visual.appearance.surface,
    palette.surfaceRaised,
    palette.surfaceOverlay,
    palette.surfaceSunken,
    palette.control,
    palette.controlHover,
    palette.controlActive,
  ];
  const authoredBoundaryPalette = visual.appearance.palette;
  const boundariesProtected =
    palette.border !== visual.appearance.border ||
    (Boolean(authoredBoundaryPalette?.borderSubtle) &&
      palette.borderSubtle !== authoredBoundaryPalette?.borderSubtle) ||
    (Boolean(authoredBoundaryPalette?.borderStrong) &&
      palette.borderStrong !== authoredBoundaryPalette?.borderStrong);
  const checks: ThemeVisualQualityCheck[] = [
    {
      id: "primary-text",
      ratio: minimumContrast(palette.textPrimary, semanticSurfaces),
      minimum: 4.5,
      protected: palette.textPrimary !== visual.appearance.text,
    },
    {
      id: "secondary-text",
      ratio: minimumContrast(palette.textSecondary, semanticSurfaces),
      minimum: 4.5,
      protected: palette.textSecondary !== visual.appearance.mutedText,
    },
    {
      id: "icons",
      ratio: Math.min(
        minimumContrast(palette.icon, boundarySurfaces),
        minimumContrast(palette.iconEmphasis, boundarySurfaces),
      ),
      minimum: 3,
      protected:
        palette.icon !== preferredThemeIconColor(visual.appearance, contrast) ||
        palette.iconEmphasis !==
          preferredThemeIconColor(visual.appearance, contrast, true),
    },
    {
      id: "accent-content",
      ratio: minimumContrast(palette.onAccent, [palette.accent]),
      minimum: 4.5,
      protected:
        palette.onAccent !==
        (visual.appearance.palette?.onAccent ?? visual.appearance.surface),
    },
    {
      id: "boundaries",
      ratio: minimumContrast(palette.border, boundarySurfaces),
      minimum: 1.5,
      protected: boundariesProtected,
    },
  ];

  return {
    checks,
    protectedCount:
      checks.filter((check) => check.protected).length +
      (contrast.quietSurfaceOpacity > visual.appearance.surfaceOpacity + 0.005
        ? 1
        : 0),
    hasImageBackdrop: contrast.hasImageBackdrop,
    authoredSurfaceOpacity: visual.appearance.surfaceOpacity,
    effectiveSurfaceOpacity: contrast.quietSurfaceOpacity,
  };
}
