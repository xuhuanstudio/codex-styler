import { describe, expect, it } from "vitest";
import { builtinThemes } from "@codex-styler/theme-core";
import { resolveThemeVisualQuality } from "./theme-visual-quality";

describe("theme visual quality", () => {
  it("verifies the final rendered roles for every built-in variant", () => {
    for (const theme of builtinThemes) {
      for (const variant of ["light", "dark"] as const) {
        const report = resolveThemeVisualQuality(theme, variant);

        report.checks.forEach((check) => {
          expect(
            check.ratio,
            `${theme.id} ${variant} ${check.id}`,
          ).toBeGreaterThanOrEqual(check.minimum - 0.01);
        });
      }
    }
  });

  it("reports render-time repairs without mutating authored theme colors", () => {
    const theme = structuredClone(builtinThemes[0]);
    const appearance = theme.variants.dark.appearance;
    const authored = {
      text: appearance.text,
      mutedText: appearance.mutedText,
      border: appearance.border,
    };
    appearance.text = appearance.surface;
    appearance.mutedText = appearance.surface;
    appearance.border = appearance.surface;

    const report = resolveThemeVisualQuality(theme, "dark");

    expect(report.protectedCount).toBeGreaterThanOrEqual(3);
    expect(appearance.text).toBe(appearance.surface);
    expect(appearance.mutedText).toBe(appearance.surface);
    expect(appearance.border).toBe(appearance.surface);
    expect(authored.text).not.toBe(appearance.text);
    expect(authored.mutedText).not.toBe(appearance.mutedText);
    expect(authored.border).not.toBe(appearance.border);
  });

  it("exposes the effective image surface guard", () => {
    const theme = structuredClone(
      builtinThemes.find((item) => item.id.includes("nocturne"))!,
    );
    theme.variants.dark.appearance.surfaceOpacity = 0.4;

    const report = resolveThemeVisualQuality(theme, "dark");

    expect(report.hasImageBackdrop).toBe(true);
    expect(report.effectiveSurfaceOpacity).toBeGreaterThan(
      report.authoredSurfaceOpacity,
    );
  });
});
