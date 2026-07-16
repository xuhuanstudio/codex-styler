import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeRefined } from "@codex-styler/theme-core";
import runtimeSource from "../src-tauri/src/runtime.js?raw";

interface InjectedRuntime {
  version: number;
  apply: (
    theme: typeof nativeRefined,
    variant: "light" | "dark",
    mode: "auto" | "compatibility" | "developer",
  ) => Promise<{ resolvedMode: string; reason: string | null }>;
  restore: () => void;
}

function runtime(): InjectedRuntime {
  return (
    window as typeof window & { __CODEX_STYLER_RUNTIME__: InjectedRuntime }
  ).__CODEX_STYLER_RUNTIME__;
}

describe("injected compatibility runtime", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete (window as unknown as Record<string, unknown>)
      .__CODEX_STYLER_RUNTIME__;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(performance.now() + 20);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Function(runtimeSource)();
  });

  afterEach(() => {
    runtime().restore();
    vi.unstubAllGlobals();
  });

  it("falls back automatically when Codex adapter anchors are absent", async () => {
    const outcome = await runtime().apply(nativeRefined, "dark", "auto");
    expect(outcome.resolvedMode).toBe("compatibility");
    expect(outcome.reason).toContain("sidebar anchor");
    expect(document.documentElement.dataset.codexStylerMode).toBe(
      "compatibility",
    );
  });

  it("uses semantic styling when live adapter verification succeeds", async () => {
    document.body.innerHTML = `
      <aside class="app-shell-left-panel"></aside>
      <main class="main-surface">
        <div role="main">
          <div data-testid="home-icon"></div>
          <article></article>
          <div class="composer-surface-chrome"></div>
        </div>
      </main>
    `;
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        backgroundColor: "rgba(20, 24, 28, 0.72)",
        backgroundImage: "none",
      })),
    );
    const outcome = await runtime().apply(nativeRefined, "dark", "auto");
    expect(outcome.resolvedMode).toBe("semantic");
    expect(outcome.reason).toBeNull();
    expect(document.documentElement.dataset.codexStylerMode).toBe("semantic");
    expect(document.documentElement.dataset.codexStylerPage).toBe("home");
    expect(document.documentElement.dataset.codexStylerLayout).toBe("native");
    expect(document.documentElement.dataset.codexStylerIcons).toBe("contained");
    const stylesheet = document.getElementById("codex-styler-runtime-style");
    expect(stylesheet?.textContent).toContain("main.main-surface article");
    expect(stylesheet?.textContent).toContain(
      '[data-pip-obstacle="thread-summary-panel"]',
    );
    expect(stylesheet?.textContent).toContain("pointer-events: auto");
    expect(stylesheet?.textContent).toContain("background-image:");
    expect(stylesheet?.textContent).toContain("group\\/home-suggestions");
    expect(stylesheet?.textContent).toContain('[data-testid="home-icon"]');
  });

  it("allows developer mode to force semantic styling", async () => {
    const outcome = await runtime().apply(nativeRefined, "dark", "developer");
    expect(outcome.resolvedMode).toBe("developer");
    expect(document.documentElement.dataset.codexStylerMode).toBe("semantic");
  });
});
