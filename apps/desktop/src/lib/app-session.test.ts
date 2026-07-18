import { builtinCompanions, builtinThemes } from "@codex-styler/theme-core";
import { describe, expect, it } from "vitest";
import { appSessionReducer, createInitialAppSession } from "./app-session";
import type { RuntimeStatus } from "./runtime";

const runtime: RuntimeStatus = {
  state: "disconnected",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
  revision: 0,
};

describe("appSessionReducer", () => {
  it("keeps theme and variant selection together", () => {
    const initial = createInitialAppSession(
      builtinThemes[0],
      runtime,
      builtinCompanions[0],
    );
    const themed = appSessionReducer(initial, {
      type: "selection/theme",
      theme: builtinThemes[1],
    });
    const light = appSessionReducer(themed, {
      type: "selection/variant",
      variant: "light",
    });

    expect(light.selection.theme.id).toBe(builtinThemes[1].id);
    expect(light.selection.variant).toBe("light");
    expect(light.selection.companion?.id).toBe(builtinCompanions[0].id);
  });

  it("restores a persisted Codex variant into the initial selection", () => {
    const initial = createInitialAppSession(
      builtinThemes[0],
      runtime,
      null,
      undefined,
      "light",
    );

    expect(initial.selection.variant).toBe("light");
  });

  it("keeps the independent companion and its placement in the selection", () => {
    const initial = createInitialAppSession(builtinThemes[0], runtime);
    const companion = appSessionReducer(initial, {
      type: "selection/companion",
      companion: builtinCompanions[1],
      companionOverrides: {
        anchor: { x: 74, y: 68 },
        size: 148,
      },
    });
    const positioned = appSessionReducer(companion, {
      type: "selection/companion-overrides",
      companionOverrides: {
        ...companion.selection.companionOverrides,
        size: 164,
      },
    });

    expect(positioned.selection.companion?.id).toBe(builtinCompanions[1].id);
    expect(positioned.selection.companionOverrides).toEqual({
      anchor: { x: 74, y: 68 },
      size: 164,
    });
  });

  it("rejects stale runtime and operation responses", () => {
    const initial = createInitialAppSession(builtinThemes[0], {
      ...runtime,
      revision: 4,
    });
    const applying = appSessionReducer(initial, {
      type: "operation/start",
      revision: 5,
      phase: "applying",
    });
    const staleRuntime = appSessionReducer(applying, {
      type: "runtime/replace",
      runtime: { ...runtime, revision: 3, state: "error" },
    });
    const staleCompletion = appSessionReducer(staleRuntime, {
      type: "operation/complete",
      revision: 4,
    });

    expect(staleCompletion.runtime.revision).toBe(4);
    expect(staleCompletion.operation.phase).toBe("applying");
  });

  it("allows an explicit official restore to reset the runtime revision", () => {
    const applied = createInitialAppSession(builtinThemes[0], {
      ...runtime,
      state: "applied",
      connected: true,
      revision: 8,
    });
    const restored = appSessionReducer(applied, {
      type: "runtime/reset",
      runtime,
    });

    expect(restored.runtime.state).toBe("disconnected");
    expect(restored.runtime.revision).toBe(0);
  });
});
