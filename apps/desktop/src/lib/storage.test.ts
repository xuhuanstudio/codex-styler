import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSettings,
  loadWorkspaceUiPreferences,
  saveWorkspaceUiPreferences,
} from "./storage";

describe("v0.1 settings migration", () => {
  beforeEach(() => localStorage.clear());

  it("maps old compatibility labels and explicit companion choices", () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        runtimeStrategy: "compatibility",
        companionId: "moss-gecko",
        manualUpdateChecks: true,
      }),
    );
    expect(loadSettings()).toMatchObject({
      runtimeStrategy: "conservative",
      companionMode: "custom",
      companionId: "moss-gecko",
      automaticUpdateChecks: false,
    });
  });

  it("maps auto and developer compatibility labels to Enhanced", () => {
    for (const runtimeStrategy of ["auto", "developer"]) {
      localStorage.setItem(
        "codex-styler.settings.v1",
        JSON.stringify({ runtimeStrategy }),
      );
      expect(loadSettings().runtimeStrategy).toBe("enhanced");
    }
  });

  it("persists the current conservative strategy and Codex variant", () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        runtimeStrategy: "conservative",
        themeVariant: "light",
      }),
    );

    expect(loadSettings()).toMatchObject({
      runtimeStrategy: "conservative",
      themeVariant: "light",
    });
  });
});

describe("workspace UI preferences", () => {
  beforeEach(() => localStorage.clear());

  it("loads stable professional-workspace defaults", () => {
    expect(loadWorkspaceUiPreferences()).toMatchObject({
      focusMode: true,
      themeEditorLayersWidth: 220,
      themeEditorInspectorWidth: 300,
      themeEditorPreviewScenario: "home",
    });
  });

  it("persists preferences and clamps unsafe panel widths", () => {
    saveWorkspaceUiPreferences({
      focusMode: false,
      themeEditorLayersWidth: 900,
      themeEditorInspectorWidth: 20,
      themeEditorPreviewScenario: "settings",
    });

    expect(loadWorkspaceUiPreferences()).toMatchObject({
      focusMode: false,
      themeEditorLayersWidth: 320,
      themeEditorInspectorWidth: 264,
      themeEditorPreviewScenario: "settings",
    });
  });

  it("falls back from corrupt non-finite widths and unknown scenarios", () => {
    localStorage.setItem(
      "codex-styler.ui.v1",
      JSON.stringify({
        focusMode: "yes",
        themeEditorLayersWidth: null,
        themeEditorInspectorWidth: "wide",
        themeEditorPreviewScenario: "unknown",
      }),
    );

    expect(loadWorkspaceUiPreferences()).toMatchObject({
      focusMode: true,
      themeEditorLayersWidth: 220,
      themeEditorInspectorWidth: 300,
      themeEditorPreviewScenario: "home",
    });
  });
});
