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
  icon: string;
  iconEmphasis: string;
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

export function preferredThemeIconColor(
  appearance: ThemeAppearance,
  contrastSystem: ThemeContrastSystem,
  emphasis = false,
): string {
  const style = appearance.iconStyle ?? "native";
  const base = emphasis
    ? contrastSystem.textPrimary
    : contrastSystem.textSecondary;
  if (style === "native") return base;

  const accentAmount =
    style === "themed" ? (emphasis ? 0.72 : 0.58) : emphasis ? 0.5 : 0.36;
  return mixColors(base, appearance.accent, accentAmount);
}

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

  const canvas = safeSurface(custom.canvas, backgroundColor);
  const surfaceRaised = safeSurface(
    custom.surfaceRaised,
    tint(strength.raised),
  );
  const surfaceOverlay = safeSurface(
    custom.surfaceOverlay,
    tint(strength.overlay),
  );
  const surfaceSunken = safeSurface(
    custom.surfaceSunken,
    mixColors(appearance.surface, backgroundColor, 0.12),
  );
  const control = safeSurface(custom.control, tint(strength.control));
  const controlHover = safeSurface(
    custom.controlHover,
    tint(strength.controlHover),
  );
  const controlActive = safeSurface(
    custom.controlActive,
    tint(strength.controlActive),
  );
  const boundaryBackgrounds = [
    appearance.surface,
    surfaceRaised,
    surfaceOverlay,
    surfaceSunken,
    control,
    controlHover,
    controlActive,
  ];
  // Keep low-emphasis separators quiet while guaranteeing that regular and
  // strong component boundaries remain visible on every derived surface.
  const border = adaptiveReadableColor(
    appearance.border,
    boundaryBackgrounds,
    1.5,
  );
  const borderSubtle = adaptiveReadableColor(
    custom.borderSubtle ?? mixColors(appearance.surface, border, 0.72),
    boundaryBackgrounds,
    1.25,
  );
  const borderStrong = adaptiveReadableColor(
    custom.borderStrong ?? mixColors(border, contrastSystem.textPrimary, 0.3),
    boundaryBackgrounds,
    custom.borderStrong ? 3 : 2.5,
  );
  const icon = adaptiveReadableColor(
    preferredThemeIconColor(appearance, contrastSystem),
    boundaryBackgrounds,
    3,
  );
  const iconEmphasis = adaptiveReadableColor(
    preferredThemeIconColor(appearance, contrastSystem, true),
    boundaryBackgrounds,
    3,
  );

  return {
    canvas,
    surface: appearance.surface,
    surfaceRaised,
    surfaceOverlay,
    surfaceSunken,
    control,
    controlHover,
    controlActive,
    textPrimary: contrastSystem.textPrimary,
    textSecondary: contrastSystem.textSecondary,
    textTertiary: contrastSystem.textTertiary,
    icon,
    iconEmphasis,
    accent: appearance.accent,
    onAccent: adaptiveReadableColor(
      custom.onAccent ?? appearance.surface,
      appearance.accent,
      4.5,
    ),
    border,
    borderSubtle,
    borderStrong,
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
