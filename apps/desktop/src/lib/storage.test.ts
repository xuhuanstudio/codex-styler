import { beforeEach, describe, expect, it } from "vitest";
import { loadSettings } from "./storage";

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
});
