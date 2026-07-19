import { describe, expect, it } from "vitest";
import { builtinThemes, type ThemeAppearance } from "@codex-styler/theme-core";
import { contrastRatio } from "./contrast";
import {
  resolveThemeContrast,
  type ThemeContrastSystem,
} from "./theme-contrast";
import {
  resolveThemePreviewPalette,
  themeFeedbackBackgrounds,
} from "./theme-preview-palette";

const contrastSystem: ThemeContrastSystem = {
  hasImageBackdrop: false,
  quietSurfaceOpacity: 0.8,
  strongSurfaceOpacity: 0.92,
  quietBackgrounds: ["#1b1d22"],
  strongBackgrounds: ["#1b1d22"],
  textPrimary: "#f2f4f8",
  textSecondary: "#c2c6ce",
  textTertiary: "#9da2ad",
  tone: "light",
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

  it("preserves boundary hierarchy without allowing borders to disappear", () => {
    const unsafe = appearance("subtle");
    unsafe.border = unsafe.surface;
    unsafe.palette = {
      borderSubtle: unsafe.surface,
      borderStrong: unsafe.surface,
    };
    const palette = resolveThemePreviewPalette(
      unsafe,
      "#101217",
      contrastSystem,
    );
    const surfaces = [
      palette.surface,
      palette.surfaceRaised,
      palette.surfaceOverlay,
      palette.surfaceSunken,
      palette.control,
      palette.controlHover,
      palette.controlActive,
    ];

    expect(
      Math.min(...surfaces.map((item) => contrastRatio(palette.border, item))),
    ).toBeGreaterThanOrEqual(1.49);
    expect(
      Math.min(
        ...surfaces.map((item) => contrastRatio(palette.borderStrong, item)),
      ),
    ).toBeGreaterThanOrEqual(2.99);
  });

  it("keeps themed icons legible without snapping every icon to plain text", () => {
    const themed = appearance("expressive");
    themed.iconStyle = "themed";
    themed.accent = "#36506F";
    const palette = resolveThemePreviewPalette(
      themed,
      "#101217",
      contrastSystem,
    );
    const surfaces = [
      palette.surface,
      palette.surfaceRaised,
      palette.surfaceOverlay,
      palette.control,
      palette.controlHover,
      palette.controlActive,
    ];

    expect(palette.icon).not.toBe(contrastSystem.textSecondary);
    expect(palette.iconEmphasis).not.toBe(contrastSystem.textPrimary);
    expect(
      Math.min(...surfaces.map((item) => contrastRatio(palette.icon, item))),
    ).toBeGreaterThanOrEqual(2.99);
    expect(
      Math.min(
        ...surfaces.map((item) => contrastRatio(palette.iconEmphasis, item)),
      ),
    ).toBeGreaterThanOrEqual(2.99);
  });

  it("keeps functional and diff colors readable on focused surfaces", () => {
    const palette = resolveThemePreviewPalette(
      appearance("expressive"),
      "#101217",
      contrastSystem,
    );

    const surfaces = [
      palette.surface,
      palette.surfaceRaised,
      palette.surfaceOverlay,
      palette.surfaceSunken,
      palette.control,
      palette.controlHover,
      palette.controlActive,
    ];
    [
      palette.success,
      palette.warning,
      palette.danger,
      palette.info,
      palette.added,
      palette.modified,
      palette.deleted,
    ].forEach((color) => {
      expect(
        Math.min(
          ...[...surfaces, ...themeFeedbackBackgrounds(color, surfaces)].map(
            (background) => contrastRatio(color, background),
          ),
        ),
      ).toBeGreaterThanOrEqual(4.49);
    });
  });

  it("keeps every authored built-in component palette readable and intact", () => {
    for (const theme of builtinThemes) {
      for (const variant of ["light", "dark"] as const) {
        const appearance = theme.variants[variant].appearance;
        const authored = appearance.palette!;
        const contrast = resolveThemeContrast(theme, variant);
        const palette = resolveThemePreviewPalette(
          appearance,
          theme.variants[variant].background.color,
          contrast,
        );

        const authoredSurfaces = [
          ["canvas", palette.canvas, authored.canvas],
          ["raised", palette.surfaceRaised, authored.surfaceRaised],
          ["overlay", palette.surfaceOverlay, authored.surfaceOverlay],
          ["sunken", palette.surfaceSunken, authored.surfaceSunken],
          ["control", palette.control, authored.control],
          ["control hover", palette.controlHover, authored.controlHover],
          ["control active", palette.controlActive, authored.controlActive],
        ] as const;
        authoredSurfaces.forEach(([label, resolved, expected]) => {
          expect(resolved, `${theme.id} ${variant} ${label}`).toBe(expected);
        });
        [palette.icon, palette.iconEmphasis].forEach((color) => {
          expect(
            Math.min(
              ...[
                palette.surface,
                palette.surfaceRaised,
                palette.surfaceOverlay,
                palette.surfaceSunken,
                palette.control,
                palette.controlHover,
                palette.controlActive,
              ].map((background) => contrastRatio(color, background)),
            ),
            `${theme.id} ${variant} icon color`,
          ).toBeGreaterThanOrEqual(2.99);
        });
        [
          palette.success,
          palette.warning,
          palette.danger,
          palette.info,
          palette.added,
          palette.modified,
          palette.deleted,
        ].forEach((color) => {
          const functionalSurfaces = [
            palette.surface,
            palette.surfaceRaised,
            palette.surfaceOverlay,
            palette.surfaceSunken,
            palette.control,
            palette.controlHover,
            palette.controlActive,
          ];
          expect(
            Math.min(
              ...[
                ...functionalSurfaces,
                ...themeFeedbackBackgrounds(color, functionalSurfaces),
              ].map((background) => contrastRatio(color, background)),
            ),
            `${theme.id} ${variant} functional color`,
          ).toBeGreaterThanOrEqual(4.49);
        });
      }
    }
  });
});
