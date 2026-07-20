import { describe, expect, it } from "vitest";
import {
  themeEditorControlMappings,
  themeEditorSectionCoverage,
  type ThemeEditorSectionId,
} from "./control-mapping";

describe("theme editor control mapping registry", () => {
  it("registers every visible control with a runtime signal", () => {
    const mappings = Object.values(themeEditorControlMappings);
    expect(mappings).toHaveLength(28);
    expect(new Set(mappings.map((mapping) => mapping.id)).size).toBe(
      mappings.length,
    );
    mappings.forEach((mapping) => {
      expect(mapping.runtimeSignal.trim()).not.toBe("");
      expect(mapping.id.startsWith(`${mapping.section}.`)).toBe(true);
    });
  });

  it("keeps runtime sections observable and pairing metadata explicit", () => {
    const runtimeSections: ThemeEditorSectionId[] = [
      "background",
      "scene",
      "surfaces",
      "motion",
    ];
    runtimeSections.forEach((section) => {
      const coverage = themeEditorSectionCoverage(section);
      expect(coverage.controlIds.length).toBeGreaterThan(0);
      expect(coverage.scenarios).toEqual([
        "home",
        "task",
        "changes",
        "terminal",
        "settings",
        "components",
        "dialog",
        "right-panel",
      ]);
      expect(coverage.recommendedScenario).not.toBeNull();
    });

    expect(themeEditorSectionCoverage("pairing")).toMatchObject({
      mode: "metadata",
      scenarios: [],
      recommendedScenario: null,
    });
    expect(themeEditorSectionCoverage("motion").mode).toBe("hybrid");
    expect(
      themeEditorControlMappings["motion.intensity"].runtimeSignal,
    ).toContain("data-codex-styler-motion");
  });
});
