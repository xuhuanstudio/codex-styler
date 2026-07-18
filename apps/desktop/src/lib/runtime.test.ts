import {
  builtinCompanions,
  builtinThemes,
  composeThemeWithCompanion,
} from "@codex-styler/theme-core";
import { describe, expect, it } from "vitest";
import { prepareMotionPreference } from "./runtime";

describe("prepareMotionPreference", () => {
  it("compiles reduced motion into the theme sent to Codex", () => {
    const theme = composeThemeWithCompanion(
      builtinThemes[2],
      builtinCompanions[0],
    );
    const entity = theme.scene.entities[0];
    expect(entity?.renderer.type).toBe("sprite-atlas");
    if (!entity || entity.renderer.type !== "sprite-atlas") return;
    entity.behaviors = [
      "idle",
      "parallax",
      "look-at-pointer",
      "reduce-motion-fallback",
    ];
    entity.renderer.neutralFrame = 3;
    entity.renderer.reducedMotionFrame = 7;
    entity.renderer.idleClips = [
      {
        id: "blink",
        poseIds: [entity.renderer.poses?.[0]?.id ?? "pose-0"],
        frames: [{ frame: 4, durationMs: 100 }],
        minimumDelayMs: 1000,
        maximumDelayMs: 2000,
      },
    ];

    const reduced = prepareMotionPreference(theme, true);
    const reducedEntity = reduced.scene.entities[0];
    expect(reduced.variants.dark.motion).toMatchObject({
      intensity: 0,
      parallax: 0,
    });
    expect(reducedEntity?.behaviors).toEqual(["reduce-motion-fallback"]);
    if (reducedEntity?.renderer.type !== "sprite-atlas") return;
    expect(reducedEntity.renderer.neutralFrame).toBe(7);
    expect(reducedEntity.renderer.idleClips).toBeUndefined();
    expect(entity.renderer.neutralFrame).toBe(3);
  });

  it("does not clone or alter a theme when reduced motion is disabled", () => {
    const theme = structuredClone(builtinThemes[0]);
    expect(prepareMotionPreference(theme, false)).toBe(theme);
  });
});
