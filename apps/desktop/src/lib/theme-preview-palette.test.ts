import { describe, expect, it } from "vitest";
import type { ThemeAppearance } from "@codex-styler/theme-core";
import { contrastRatio } from "./contrast";
import type { ThemeContrastSystem } from "./theme-contrast";
import { resolveThemePreviewPalette } from "./theme-preview-palette";

const contrastSystem: ThemeContrastSystem = {
  hasImageBackdrop: false,
  quietSurfaceOpacity: 0.8,
  strongSurfaceOpacity: 0.92,
  quietBackgrounds: ["#1b1d22"],
  strongBackgrounds: ["#1b1d22"],
  textPrimary: "#f2f4f8",
  textSecondary: "#c2c6ce",
  textTertiary: "#9da2ad",
  tone: "dark",
};

function appearance(
  decorations: ThemeAppearance["decorations"],
): ThemeAppearance {
  return {
    accent: "#78a6ff",
    surface: "#1b1d22",
    surfaceOpacity: 0.88,
    text: "#f2f4f8",
    mutedText: "#c2c6ce",
    border: "#3a3f49",
    radius: 14,
    focusOpacity: 0.94,
    focusBlur: 12,
    decorations,
  };
}

describe("theme preview semantic palette", () => {
  it("increases accent depth for expressive component treatments", () => {
    const subtle = resolveThemePreviewPalette(
      appearance("subtle"),
      "#101217",
      contrastSystem,
    );
    const expressive = resolveThemePreviewPalette(
      appearance("expressive"),
      "#101217",
      contrastSystem,
    );

    expect(expressive.controlActive).not.toBe(subtle.controlActive);
    expect(expressive.surfaceOverlay).not.toBe(subtle.surfaceOverlay);
  });

  it("preserves a readable authored surface and repairs unsafe ones", () => {
    const authored = appearance("subtle");
    authored.palette = {
      surfaceRaised: "#252a34",
      surfaceOverlay: "#ffffff",
    };
    const palette = resolveThemePreviewPalette(
      authored,
      "#101217",
      contrastSystem,
    );

    expect(palette.surfaceRaised).toBe("#252a34");
    expect(palette.surfaceOverlay).not.toBe("#ffffff");
  });

  it("always supplies readable text for accent controls", () => {
    const palette = resolveThemePreviewPalette(
      appearance("expressive"),
      "#101217",
      contrastSystem,
    );

    expect(contrastRatio(palette.onAccent, "#78a6ff")).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("keeps functional and diff colors readable on focused surfaces", () => {
    const palette = resolveThemePreviewPalette(
      appearance("expressive"),
      "#101217",
      contrastSystem,
    );

    [
      palette.success,
      palette.warning,
      palette.danger,
      palette.info,
      palette.added,
      palette.modified,
      palette.deleted,
    ].forEach((color) => {
      expect(contrastRatio(color, "#1b1d22")).toBeGreaterThanOrEqual(4.5);
    });
  });
});
