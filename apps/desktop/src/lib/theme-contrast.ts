import type {
  ThemeDefinition,
  ThemeVariantName,
} from "@codex-styler/theme-core";
import {
  adaptiveReadableColor,
  adjustBrightness,
  compositeColor,
  minimumContrast,
} from "./contrast";

export interface ThemeContrastSystem {
  hasImageBackdrop: boolean;
  quietSurfaceOpacity: number;
  strongSurfaceOpacity: number;
  quietBackgrounds: string[];
  strongBackgrounds: string[];
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Foreground tone selected for the composite UI surfaces. */
  tone: "light" | "dark";
}

export function hasImageBackdrop(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): boolean {
  return Boolean(
    theme.variants[variant].background.image ||
    theme.scene.layers.some(
      (layer) =>
        layer.type === "image" && Boolean(layer.asset) && layer.opacity > 0,
    ),
  );
}

function backdropSamples(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): string[] {
  const background = theme.variants[variant].background;
  const samples = hasImageBackdrop(theme, variant)
    ? ["#000000", "#ffffff"]
    : [adjustBrightness(background.color, background.brightness)];
  return samples.map((sample) =>
    compositeColor(background.overlay, sample, background.overlayOpacity),
  );
}

function surfaceSamples(
  surface: string,
  backdrops: string[],
  opacity: number,
): string[] {
  return backdrops.map((backdrop) =>
    compositeColor(surface, backdrop, opacity),
  );
}

export function resolveThemeContrast(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
): ThemeContrastSystem {
  const visual = theme.variants[variant];
  const { appearance } = visual;
  const imageBacked = hasImageBackdrop(theme, variant);
  const backdrops = backdropSamples(theme, variant);
  const authoredSurfaceOpacity = imageBacked
    ? Math.max(0.72, appearance.surfaceOpacity)
    : appearance.surfaceOpacity;
  const initialQuietOpacity = imageBacked
    ? Math.max(0.64, authoredSurfaceOpacity * 0.78)
    : Math.max(0.38, authoredSurfaceOpacity * 0.62);

  let quietSurfaceOpacity = initialQuietOpacity;
  let quietBackgrounds = surfaceSamples(
    appearance.surface,
    backdrops,
    quietSurfaceOpacity,
  );
  let textPrimary = adaptiveReadableColor(
    appearance.text,
    quietBackgrounds,
    4.5,
  );
  let textSecondary = adaptiveReadableColor(
    appearance.mutedText,
    quietBackgrounds,
    4.5,
  );

  // Increase the glass guard only when the foreground cannot safely cover the
  // complete backdrop range. The authored opacity remains untouched in data.
  while (
    quietSurfaceOpacity < 0.96 &&
    (minimumContrast(textPrimary, quietBackgrounds) < 4.5 ||
      minimumContrast(textSecondary, quietBackgrounds) < 4.5)
  ) {
    quietSurfaceOpacity = Math.min(0.96, quietSurfaceOpacity + 0.02);
    quietBackgrounds = surfaceSamples(
      appearance.surface,
      backdrops,
      quietSurfaceOpacity,
    );
    textPrimary = adaptiveReadableColor(appearance.text, quietBackgrounds, 4.5);
    textSecondary = adaptiveReadableColor(
      appearance.mutedText,
      quietBackgrounds,
      4.5,
    );
  }

  const strongSurfaceOpacity = Math.min(
    0.98,
    Math.max(
      authoredSurfaceOpacity,
      appearance.focusOpacity,
      quietSurfaceOpacity + (imageBacked ? 0.12 : 0.08),
    ),
  );
  const strongBackgrounds = surfaceSamples(
    appearance.surface,
    backdrops,
    strongSurfaceOpacity,
  );
  const semanticBackgrounds = [
    ...quietBackgrounds,
    ...strongBackgrounds,
    appearance.surface,
  ];
  textPrimary = adaptiveReadableColor(
    appearance.text,
    semanticBackgrounds,
    4.5,
  );
  textSecondary = adaptiveReadableColor(
    appearance.mutedText,
    semanticBackgrounds,
    4.5,
  );
  const textTertiary = adaptiveReadableColor(
    appearance.palette?.textTertiary ?? appearance.mutedText,
    semanticBackgrounds,
    3,
  );

  return {
    hasImageBackdrop: imageBacked,
    quietSurfaceOpacity,
    strongSurfaceOpacity,
    quietBackgrounds,
    strongBackgrounds,
    textPrimary,
    textSecondary,
    textTertiary,
    tone:
      minimumContrast("#ffffff", quietBackgrounds) >=
      minimumContrast("#000000", quietBackgrounds)
        ? "light"
        : "dark",
  };
}
