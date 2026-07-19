import { describe, expect, it } from "vitest";
import {
  gildedGrandeur,
  merryBigTop,
  nativeRefined,
} from "@codex-styler/theme-core";
import {
  resolveThemeEffectCoverage,
  resolveThemeVisualPersonality,
} from "./theme-effects";

describe("resolveThemeEffectCoverage", () => {
  it("reports the semantic systems a theme can actually style", () => {
    const coverage = resolveThemeEffectCoverage(nativeRefined, "dark");

    expect(coverage.find((effect) => effect.id === "background")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "surfaces")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "readability")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "typography")?.active).toBe(
      true,
    );
  });

  it("does not promise semantic component styling for safe themes", () => {
    const theme = structuredClone(nativeRefined);
    theme.compatibility.codex.mode = "safe";

    const coverage = resolveThemeEffectCoverage(theme, "dark");

    expect(coverage.find((effect) => effect.id === "background")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "surfaces")?.active).toBe(
      false,
    );
    expect(coverage.find((effect) => effect.id === "controls")?.active).toBe(
      false,
    );
    expect(coverage.find((effect) => effect.id === "typography")?.active).toBe(
      false,
    );
  });
});

describe("resolveThemeVisualPersonality", () => {
  it("derives architectural and soft treatments from portable controls", () => {
    expect(resolveThemeVisualPersonality(gildedGrandeur, "dark")).toEqual({
      layout: "editorial",
      geometry: "precise",
      iconStyle: "themed",
      decorations: "expressive",
      typography: "editorial",
      motion: "fluid",
    });
    expect(resolveThemeVisualPersonality(merryBigTop, "dark")).toEqual({
      layout: "immersive",
      geometry: "soft",
      iconStyle: "themed",
      decorations: "expressive",
      typography: "cinematic",
      motion: "expressive",
    });
  });

  it("keeps low-motion native themes restrained", () => {
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.motion.intensity = 0;

    expect(resolveThemeVisualPersonality(theme, "dark")).toMatchObject({
      layout: "native",
      geometry: "balanced",
      typography: "balanced",
      motion: "still",
    });
  });
});
