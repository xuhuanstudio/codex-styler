import { describe, expect, it } from "vitest";
import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import {
  createThemeDraftHistory,
  themeDraftHistoryReducer,
} from "./use-theme-draft-history";

function changeBrightness(value: number) {
  return (theme: ThemeDefinition) => {
    theme.variants.light.background.brightness = value;
    return theme;
  };
}

describe("theme draft history", () => {
  it("undoes and redoes a theme change without mutating the source", () => {
    const source = structuredClone(builtinThemes[0]);
    const initialBrightness = source.variants.light.background.brightness;
    let state = createThemeDraftHistory(source);

    state = themeDraftHistoryReducer(state, {
      type: "commit",
      update: changeBrightness(0.72),
      group: "light.background.brightness",
      at: 100,
    });
    expect(state.present.variants.light.background.brightness).toBe(0.72);
    expect(source.variants.light.background.brightness).toBe(initialBrightness);

    state = themeDraftHistoryReducer(state, { type: "undo" });
    expect(state.present.variants.light.background.brightness).toBe(
      initialBrightness,
    );

    state = themeDraftHistoryReducer(state, { type: "redo" });
    expect(state.present.variants.light.background.brightness).toBe(0.72);
  });

  it("coalesces rapid changes to one control and clears redo after a new edit", () => {
    const source = structuredClone(builtinThemes[0]);
    const initialBrightness = source.variants.light.background.brightness;
    let state = createThemeDraftHistory(source);

    for (const [index, value] of [0.9, 0.8, 0.7].entries()) {
      state = themeDraftHistoryReducer(state, {
        type: "commit",
        update: changeBrightness(value),
        group: "light.background.brightness",
        at: 100 + index * 100,
      });
    }
    expect(state.past).toHaveLength(1);

    state = themeDraftHistoryReducer(state, { type: "undo" });
    expect(state.present.variants.light.background.brightness).toBe(
      initialBrightness,
    );
    expect(state.future).toHaveLength(1);

    state = themeDraftHistoryReducer(state, {
      type: "commit",
      update: changeBrightness(1.15),
      at: 1000,
    });
    expect(state.future).toHaveLength(0);
  });

  it("keeps a multi-field recipe in one undo step", () => {
    let state = createThemeDraftHistory(structuredClone(builtinThemes[0]));
    const original = structuredClone(state.present.variants.dark.motion);

    for (const [key, value] of [
      ["intensity", 0.8],
      ["parallax", 14],
      ["targetFps", 60],
    ] as const) {
      state = themeDraftHistoryReducer(state, {
        type: "commit",
        update: (theme) => {
          (theme.variants.dark.motion as unknown as Record<string, number>)[
            key
          ] = value;
          return theme;
        },
        group: "dark.motion.recipe",
        at: 100,
      });
    }

    expect(state.past).toHaveLength(1);
    state = themeDraftHistoryReducer(state, { type: "undo" });
    expect(state.present.variants.dark.motion).toEqual(original);
  });
});
