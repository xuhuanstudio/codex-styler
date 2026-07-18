import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { analyzeImageSamples, createAdaptiveSchemes } from "./adaptive-theme";

describe("adaptive image themes", () => {
  it("selects a chromatic accent without turning every surface into that color", () => {
    const profile = analyzeImageSamples([
      ...Array.from(
        { length: 10 },
        () => [38, 44, 54] as [number, number, number],
      ),
      ...Array.from(
        { length: 4 },
        () => [201, 106, 45] as [number, number, number],
      ),
    ]);
    const schemes = createAdaptiveSchemes(profile, "assets/background.png");

    expect(schemes.map((scheme) => scheme.id)).toEqual([
      "balanced",
      "cinematic",
      "soft",
      "vivid",
    ]);
    expect(schemes[0].variants.dark.appearance.surface).not.toBe(
      profile.accent,
    );
    expect(schemes[1].variants.dark.appearance.layout).toBe("editorial");
    expect(schemes[3].variants.dark.appearance.iconStyle).toBe("themed");
    expect(schemes[0].variants.dark.appearance.text).not.toBe("#f5f5f2");
    expect(schemes[0].variants.light.appearance.mutedText).not.toBe("#5d616a");
    for (const scheme of schemes) {
      for (const variant of Object.values(scheme.variants)) {
        expect(
          contrastRatio(variant.appearance.text, variant.appearance.surface),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
