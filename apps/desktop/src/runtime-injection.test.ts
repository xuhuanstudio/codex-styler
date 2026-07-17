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
    expect(outcome.reason).toContain("application root");
    expect(document.documentElement.dataset.codexStylerMode).toBe(
      "compatibility",
    );
  });

  it("restores and replaces an older injected runtime", () => {
    runtime().restore();
    const restore = vi.fn();
    (
      window as typeof window & {
        __CODEX_STYLER_RUNTIME__: { version: number; restore: () => void };
      }
    ).__CODEX_STYLER_RUNTIME__ = { version: 8, restore };

    Function(runtimeSource)();

    expect(restore).toHaveBeenCalledOnce();
    expect(runtime().version).toBe(12);
  });

  it("uses semantic styling when live adapter verification succeeds", async () => {
    document.body.innerHTML = `
      <div id="codex-app-root">
        <aside class="app-shell-left-panel"></aside>
        <main class="main-surface">
          <div role="main">
            <div data-testid="home-icon"></div>
            <article></article>
            <div class="composer-surface-chrome"></div>
          </div>
        </main>
      </div>
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
      "--color-background-button-primary: var(--codex-styler-accent)",
    );
    expect(stylesheet?.textContent).toContain("--color-token-menu-background:");
    expect(stylesheet?.textContent).toContain(
      "--color-token-diff-editor-inserted-line-background:",
    );
    expect(stylesheet?.textContent).toContain(
      "--color-token-terminal-background:",
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-mode="semantic"] body > [data-codex-styler-app-root]',
    );
    expect(stylesheet?.textContent).toContain(
      '[data-pip-obstacle="thread-summary-panel"]',
    );
    expect(stylesheet?.textContent).toContain("pointer-events: auto");
    expect(stylesheet?.textContent).toContain("background-image:");
    expect(stylesheet?.textContent).toContain("group\\/home-suggestions");
    expect(stylesheet?.textContent).toContain(
      "padding: clamp(26px, 4cqh, 32px) 10px 27px",
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-density="compact"',
    );
    expect(stylesheet?.textContent).toContain(
      "data-codex-styler-collision-guard",
    );
    expect(stylesheet?.textContent).not.toContain("padding: 32px 10px 10px");
    expect(stylesheet?.textContent).toContain('[data-testid="home-icon"]');
    expect(stylesheet?.textContent).not.toContain(
      "aside.app-shell-left-panel button svg",
    );
    expect(stylesheet?.textContent).not.toContain("main.main-surface::after");
    expect(stylesheet?.textContent).not.toContain("width: 27px !important");
    expect(stylesheet?.textContent).not.toContain('thread-summary-panel"] svg');
    expect(stylesheet?.textContent).toContain(
      "main.main-surface > header:not(.app-header-tint)",
    );
    const appHeaderRule = stylesheet?.textContent
      ?.split("header.app-header-tint {")[1]
      ?.split("}")[0];
    expect(appHeaderRule).toContain("background: transparent !important");
    expect(appHeaderRule).toContain("backdrop-filter: none !important");
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-layout="editorial"] main.main-surface',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-layout="immersive"] main.main-surface',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-icons="contained"] aside.app-shell-left-panel button > svg:first-child',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-decorations="subtle"] main.main-surface',
    );
    const iconTreatments = stylesheet?.textContent
      ?.split("/* Icon treatments preserve")[1]
      ?.split("/* Full home composition")[0];
    expect(iconTreatments).not.toMatch(
      /(?:^|\n)\s*(?:width|height|padding|background)\s*:/,
    );
    expect(stylesheet?.textContent).not.toContain("body > div:first-child");
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-app-root]",
    );
    expect(document.getElementById("codex-app-root")).toHaveAttribute(
      "data-codex-styler-app-root",
    );

    const transientPortal = document.createElement("div");
    transientPortal.id = "transient-sidebar-portal";
    document.body.prepend(transientPortal);
    await vi.waitFor(() => {
      expect(document.getElementById("codex-app-root")).toHaveAttribute(
        "data-codex-styler-app-root",
      );
    });
    expect(transientPortal).not.toHaveAttribute("data-codex-styler-app-root");
  });

  it("keeps full-page settings routes above the backdrop", async () => {
    document.body.innerHTML = `
      <div id="root">
        <aside class="app-shell-left-panel"></aside>
        <main class="main-surface"><div role="main"></div></main>
      </div>
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

    const root = document.getElementById("root") as HTMLElement;
    root.innerHTML = `
      <div class="main-surface">
        <nav>Settings</nav>
        <section>General settings</section>
      </div>
    `;

    await vi.waitFor(() => {
      expect(root).toHaveAttribute("data-codex-styler-app-root");
      expect(document.documentElement.dataset.codexStylerPage).toBe("settings");
    });
    await new Promise((resolve) => setTimeout(resolve, 750));

    expect(document.documentElement.dataset.codexStylerMode).toBe("semantic");
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-fallback",
    );
  });

  it("preserves native portal layering while tracking overlay roots", async () => {
    document.body.innerHTML = `
      <div id="root">
        <aside class="app-shell-left-panel"></aside>
        <main class="main-surface"><div role="main"></div></main>
      </div>
    `;
    await runtime().apply(nativeRefined, "dark", "developer");

    const portal = document.createElement("div");
    portal.style.position = "fixed";
    portal.style.zIndex = "55";
    portal.innerHTML = '<div role="dialog">Theme settings</div>';
    document.body.appendChild(portal);

    await vi.waitFor(() => {
      expect(portal).toHaveAttribute("data-codex-styler-overlay-root");
    });
    expect(portal).not.toHaveAttribute("data-codex-styler-app-root");
    expect(portal).not.toHaveAttribute("data-codex-styler-unlayered-root");
    expect(getComputedStyle(portal).zIndex).toBe("55");
  });

  it("maps optional semantic palette roles to Codex component tokens", async () => {
    document.body.innerHTML = `
      <div id="codex-app-root">
        <aside class="app-shell-left-panel"></aside>
        <main class="main-surface"><div role="main"></div></main>
      </div>
    `;
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        backgroundColor: "rgba(20, 24, 28, 0.72)",
        backgroundImage: "none",
      })),
    );
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.appearance.palette = {
      canvas: "#101318",
      surfaceRaised: "#252A31",
      controlHover: "#303741",
      success: "#52C982",
    };

    await runtime().apply(theme, "dark", "developer");

    const stylesheet = document.getElementById("codex-styler-runtime-style");
    expect(stylesheet?.textContent).toContain("--codex-styler-canvas: #101318");
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-surface-raised: #252A31",
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-control-hover: #303741",
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-success: #52C982",
    );
  });

  it("compacts short home layouts and guards the composer safe area", async () => {
    document.body.innerHTML = `
      <div id="codex-app-root">
        <aside class="app-shell-left-panel"></aside>
        <main class="main-surface">
          <div role="main">
            <div data-feature="game-source"></div>
            <section class="group/home-suggestions"></section>
            <div class="horizontal-scroll-fade-mask">
              <div class="group/project-selector"></div>
            </div>
            <div class="composer-surface-chrome"></div>
          </div>
        </main>
      </div>
    `;
    const homeMain = document.querySelector('[role="main"]') as HTMLElement;
    const project = document.querySelector(
      ".group\\/project-selector",
    ) as HTMLElement;
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    Object.defineProperties(homeMain, {
      clientHeight: { value: 620, configurable: true },
      clientWidth: { value: 680, configurable: true },
    });
    project.getBoundingClientRect = () =>
      ({ top: 680, bottom: 720 }) as DOMRect;
    composer.getBoundingClientRect = () =>
      ({ top: 700, bottom: 798 }) as DOMRect;
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        backgroundColor: "rgba(20, 24, 28, 0.72)",
        backgroundImage: "none",
      })),
    );

    await runtime().apply(nativeRefined, "dark", "developer");

    expect(document.documentElement.dataset.codexStylerDensity).toBe("compact");
    expect(document.documentElement).toHaveAttribute(
      "data-codex-styler-collision-guard",
    );
  });

  it("allows developer mode to force semantic styling", async () => {
    const outcome = await runtime().apply(nativeRefined, "dark", "developer");
    expect(outcome.resolvedMode).toBe("developer");
    expect(document.documentElement.dataset.codexStylerMode).toBe("semantic");
  });
});
