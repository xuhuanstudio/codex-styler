import type { ThemeAppearance } from "@codex-styler/theme-core";
import { adaptiveReadableColor, minimumContrast, mixColors } from "./contrast";
import type { ThemeContrastSystem } from "./theme-contrast";

export interface ThemePreviewPalette {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  surfaceSunken: string;
  control: string;
  controlHover: string;
  controlActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  onAccent: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  focus: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  added: string;
  modified: string;
  deleted: string;
}

const profileStrength = {
  none: {
    raised: 0.04,
    overlay: 0.07,
    control: 0.05,
    controlHover: 0.08,
    controlActive: 0.12,
  },
  subtle: {
    raised: 0.06,
    overlay: 0.1,
    control: 0.08,
    controlHover: 0.13,
    controlActive: 0.18,
  },
  expressive: {
    raised: 0.1,
    overlay: 0.16,
    control: 0.12,
    controlHover: 0.2,
    controlActive: 0.28,
  },
} as const;

export function resolveThemePreviewPalette(
  appearance: ThemeAppearance,
  backgroundColor: string,
  contrastSystem: ThemeContrastSystem,
): ThemePreviewPalette {
  const custom = appearance.palette ?? {};
  const strength =
    profileStrength[appearance.decorations ?? "none"] ?? profileStrength.none;
  const readableSurface = (candidate: string) =>
    minimumContrast(contrastSystem.textPrimary, [candidate]) >= 4.5 &&
    minimumContrast(contrastSystem.textSecondary, [candidate]) >= 4.5 &&
    minimumContrast(contrastSystem.textTertiary, [candidate]) >= 3;
  const safeSurface = (candidate: string | undefined, fallback: string) => {
    if (candidate && readableSurface(candidate)) return candidate;
    return readableSurface(fallback) ? fallback : appearance.surface;
  };
  const tint = (amount: number) =>
    mixColors(appearance.surface, appearance.accent, amount);
  const statusDefaults =
    contrastSystem.tone === "light"
      ? {
          success: "#4BC47D",
          warning: "#E7A645",
          danger: "#F06A67",
          info: "#83C3FF",
        }
      : {
          success: "#197A43",
          warning: "#9A5B12",
          danger: "#B93232",
          info: "#1F5F99",
        };
  const safeForeground = (candidate: string | undefined, fallback: string) =>
    adaptiveReadableColor(
      candidate ?? fallback,
      contrastSystem.strongBackgrounds,
      4.5,
    );
  const success = safeForeground(custom.success, statusDefaults.success);
  const warning = safeForeground(custom.warning, statusDefaults.warning);
  const danger = safeForeground(custom.danger, statusDefaults.danger);
  const info = safeForeground(
    custom.info ?? appearance.accent,
    statusDefaults.info,
  );

  return {
    canvas: safeSurface(custom.canvas, backgroundColor),
    surface: appearance.surface,
    surfaceRaised: safeSurface(custom.surfaceRaised, tint(strength.raised)),
    surfaceOverlay: safeSurface(custom.surfaceOverlay, tint(strength.overlay)),
    surfaceSunken: safeSurface(
      custom.surfaceSunken,
      mixColors(appearance.surface, backgroundColor, 0.12),
    ),
    control: safeSurface(custom.control, tint(strength.control)),
    controlHover: safeSurface(custom.controlHover, tint(strength.controlHover)),
    controlActive: safeSurface(
      custom.controlActive,
      tint(strength.controlActive),
    ),
    textPrimary: contrastSystem.textPrimary,
    textSecondary: contrastSystem.textSecondary,
    textTertiary: contrastSystem.textTertiary,
    accent: appearance.accent,
    onAccent: adaptiveReadableColor(
      custom.onAccent ?? appearance.surface,
      appearance.accent,
      4.5,
    ),
    border: appearance.border,
    borderSubtle:
      custom.borderSubtle ??
      `color-mix(in srgb, ${appearance.border} 52%, transparent)`,
    borderStrong:
      custom.borderStrong ??
      `color-mix(in srgb, ${appearance.border} 70%, ${appearance.text})`,
    focus: safeForeground(
      custom.focus ?? appearance.accent,
      statusDefaults.info,
    ),
    success,
    warning,
    danger,
    info,
    added: safeForeground(custom.added, success),
    modified: safeForeground(custom.modified, warning),
    deleted: safeForeground(custom.deleted, danger),
  };
}
