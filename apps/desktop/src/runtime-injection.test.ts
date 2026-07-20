import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeRefined, type SceneEntity } from "@codex-styler/theme-core";
import runtimeSource from "../src-tauri/src/runtime.js?raw";
import composerMomentsSource from "../src-tauri/src/composer-moments.js?raw";
import composerSettingsAdapterSource from "../src-tauri/src/composer-settings-adapter.js?raw";
import { contrastRatio, minimumContrast } from "./lib/contrast";
import { resolveThemeContrast } from "./lib/theme-contrast";
import { assignThemeColorHarmony } from "./lib/theme-color-harmony";
import { resolveThemePreviewPalette } from "./lib/theme-preview-palette";
import {
  codexFixture,
  installCodexIntelligenceFixture,
  portalFixture,
} from "./test/fixtures/codex-dom";

interface InjectedRuntime {
  version: number;
  apply: (
    theme: typeof nativeRefined,
    variant: "light" | "dark",
    mode: "auto" | "compatibility" | "developer",
    revision?: number,
    experience?: {
      composerMomentsEnabled: boolean;
      reduceMotion: boolean;
    },
  ) => Promise<{
    resolvedMode: string;
    reason: string | null;
    stale?: boolean;
    contrastRepairApplied?: boolean;
  }>;
  updateEntity: (
    entity: unknown,
    revision?: number,
  ) => { ok: boolean; stale: boolean };
  restore: () => void;
}

interface InjectedRuntimeInternals {
  semanticPalette: (
    appearance: (typeof nativeRefined)["variants"]["light"]["appearance"],
    background: (typeof nativeRefined)["variants"]["light"]["background"],
    contrastSystem: ReturnType<typeof resolveThemeContrast>,
  ) => ReturnType<typeof resolveThemePreviewPalette>;
}

function runtime(): InjectedRuntime {
  return (
    window as typeof window & { __CODEX_STYLER_RUNTIME__: InjectedRuntime }
  ).__CODEX_STYLER_RUNTIME__;
}

function runtimeInternals(): InjectedRuntimeInternals {
  return (
    window as typeof window & {
      __CODEX_STYLER_RUNTIME_INTERNALS__: InjectedRuntimeInternals;
    }
  ).__CODEX_STYLER_RUNTIME_INTERNALS__;
}

const TEST_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA" +
  "DUlEQVR42mNk+M/wHwAF/gL+X2NDWQAAAABJRU5ErkJggg==";

function testSpriteEntity(overrides: Partial<SceneEntity> = {}): SceneEntity {
  return {
    id: "test-companion",
    name: "Test companion",
    renderer: {
      type: "sprite-atlas",
      asset: TEST_IMAGE,
      pages: [TEST_IMAGE],
      columns: 2,
      rows: 2,
      framesPerPage: 4,
      frameWidth: 1,
      frameHeight: 1,
      directions: 4,
      frameCount: 4,
      poses: [
        { id: "pose-up", angle: 0, frame: 0 },
        { id: "pose-right", angle: 90, frame: 1 },
        { id: "pose-down", angle: 180, frame: 2 },
        { id: "pose-left", angle: 270, frame: 3 },
      ],
      idleClips: [
        {
          id: "blink",
          poseIds: ["pose-up"],
          frames: [{ frame: 0, durationMs: 80 }],
          minimumDelayMs: 500,
          maximumDelayMs: 1000,
        },
      ],
      neutralFrame: 0,
      reducedMotionFrame: 0,
      transitionFps: 30,
      normalization: "preserve",
      alphaThreshold: 12,
    },
    behaviors: ["idle", "look-at-pointer", "reduce-motion-fallback"],
    anchor: { x: 80, y: 70 },
    size: 80,
    opacity: 1,
    ...overrides,
  };
}

describe("injected compatibility runtime", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete (window as unknown as Record<string, unknown>)
      .__CODEX_STYLER_RUNTIME__;
    delete (window as unknown as Record<string, unknown>)
      .__CODEX_STYLER_RUNTIME_INTERNALS__;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(performance.now() + 20);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Function(
      `${composerSettingsAdapterSource}\n${composerMomentsSource}\n${runtimeSource}`,
    )();
  });

  afterEach(() => {
    runtime().restore();
    delete (window as unknown as Record<string, unknown>)
      .__CODEX_STYLER_RUNTIME_INTERNALS__;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back automatically when Codex adapter anchors are absent", async () => {
    const outcome = await runtime().apply(nativeRefined, "dark", "auto");
    expect(outcome.resolvedMode).toBe("compatibility");
    expect(outcome.reason).toContain("application root");
    expect(document.documentElement.dataset.codexStylerMode).toBe(
      "compatibility",
    );
    expect(
      document.getElementById("codex-styler-contrast-repair-style"),
    ).toBeNull();
  });

  it("restores and replaces an older injected runtime", () => {
    runtime().restore();
    const restore = vi.fn();
    (
      window as typeof window & {
        __CODEX_STYLER_RUNTIME__: { version: number; restore: () => void };
      }
    ).__CODEX_STYLER_RUNTIME__ = { version: 20, restore };

    Function(
      `${composerSettingsAdapterSource}\n${composerMomentsSource}\n${runtimeSource}`,
    )();

    expect(restore).toHaveBeenCalledOnce();
    expect(runtime().version).toBe(38);
  });

  it("adds theme-adaptive composer moments without touching prompt content", async () => {
    document.body.innerHTML = codexFixture("task");
    installCodexIntelligenceFixture();
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    const originalPrompt = composer.textContent;
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({
      x: 180,
      y: 540,
      left: 180,
      top: 540,
      right: 820,
      bottom: 650,
      width: 640,
      height: 110,
      toJSON: () => ({}),
    });

    await runtime().apply(nativeRefined, "dark", "compatibility", 1, {
      composerMomentsEnabled: true,
      reduceMotion: true,
    });

    const root = document.getElementById("codex-styler-composer-moments");
    const trigger = root?.querySelector<HTMLButtonElement>(".csm-trigger");
    expect(root).not.toBeNull();
    expect(root?.style.getPropertyValue("--csm-accent")).toBe(
      nativeRefined.variants.dark.appearance.accent,
    );
    expect(root?.style.getPropertyValue("--csm-surface-opacity")).toBe(
      `${Math.round(
        nativeRefined.variants.dark.appearance.surfaceOpacity * 100,
      )}%`,
    );
    expect(root?.style.getPropertyValue("--csm-blur")).toBe(
      `${nativeRefined.variants.dark.appearance.focusBlur}px`,
    );
    expect(getComputedStyle(root as HTMLElement).zIndex).toBe("10");
    expect(trigger).toHaveAccessibleName("Open configuration plays");

    trigger?.click();
    const menu = root?.querySelector<HTMLElement>("[role='menu']");
    expect(menu).not.toHaveAttribute("hidden");
    expect(root?.querySelectorAll("[role='menuitem']")).toHaveLength(5);

    root?.querySelector<HTMLButtonElement>("[data-game='toss']")?.click();
    await vi.waitFor(() =>
      expect(root?.querySelector("[role='application']")).toHaveAccessibleName(
        "Lucky Setup",
      ),
    );
    expect(root?.querySelector(".csm-proposal")).not.toBeNull();
    expect(root?.textContent).toContain("Reasoning effort");
    expect(root?.textContent).toContain("Speed");
    expect(composer.textContent).toBe(originalPrompt);

    runtime().restore();
    expect(document.getElementById("codex-styler-composer-moments")).toBeNull();
  });

  it("keeps composer moments absent when the user turns them off", async () => {
    document.body.innerHTML = codexFixture("task");

    await runtime().apply(nativeRefined, "dark", "compatibility", 1, {
      composerMomentsEnabled: false,
      reduceMotion: false,
    });

    expect(document.getElementById("codex-styler-composer-moments")).toBeNull();
  });

  it("keeps composer moments idempotent across theme updates and restores focus", async () => {
    document.body.innerHTML = codexFixture("task");
    installCodexIntelligenceFixture();
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({
      x: 180,
      y: 540,
      left: 180,
      top: 540,
      right: 820,
      bottom: 650,
      width: 640,
      height: 110,
      toJSON: () => ({}),
    });

    const experience = {
      composerMomentsEnabled: true,
      reduceMotion: true,
    };
    await runtime().apply(
      nativeRefined,
      "dark",
      "compatibility",
      1,
      experience,
    );
    await runtime().apply(
      nativeRefined,
      "light",
      "compatibility",
      2,
      experience,
    );

    expect(
      document.querySelectorAll("#codex-styler-composer-moments"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("#codex-styler-composer-moments-style"),
    ).toHaveLength(1);

    const trigger = document.querySelector<HTMLButtonElement>(".csm-trigger");
    trigger?.focus();
    trigger?.click();
    const menuItems = document.querySelectorAll<HTMLButtonElement>(
      ".csm-menu [role='menuitem']",
    );
    expect(menuItems[0]).toHaveFocus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(menuItems[1]).toHaveFocus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(trigger).toHaveFocus();
    expect(document.querySelector<HTMLElement>(".csm-menu")).toHaveAttribute(
      "hidden",
    );
  });

  it("opens every animated composer moment and renders its first frame", async () => {
    document.body.innerHTML = codexFixture("task");
    installCodexIntelligenceFixture();
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({
      x: 180,
      y: 540,
      left: 180,
      top: 540,
      right: 820,
      bottom: 650,
      width: 640,
      height: 110,
      toJSON: () => ({}),
    });
    await runtime().apply(nativeRefined, "dark", "compatibility", 1, {
      composerMomentsEnabled: true,
      reduceMotion: false,
    });

    const gradient = { addColorStop: vi.fn() };
    const context = {
      arc: vi.fn(),
      arcTo: vi.fn(),
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => gradient),
      createRadialGradient: vi.fn(() => gradient),
      ellipse: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animationFrames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    for (const game of ["marbles", "claw", "toss", "balance", "route"]) {
      animationFrames.length = 0;
      context.clearRect.mockClear();
      document.querySelector<HTMLButtonElement>(".csm-trigger")?.click();
      document
        .querySelector<HTMLButtonElement>(`[data-game='${game}']`)
        ?.click();
      await vi.waitFor(() =>
        expect(
          document.querySelector<HTMLElement>(".csm-stage"),
        ).not.toBeNull(),
      );
      const stage = document.querySelector<HTMLElement>(".csm-stage");
      expect(stage).toHaveFocus();
      expect(stage?.querySelector("canvas")).not.toBeNull();
      const keyboardAction = new KeyboardEvent("keydown", {
        key: game === "balance" || game === "route" ? "ArrowRight" : "Enter",
        bubbles: true,
        cancelable: true,
      });
      stage?.dispatchEvent(keyboardAction);
      expect(keyboardAction.defaultPrevented).toBe(true);
      animationFrames.shift()?.(performance.now() + 16);
      expect(context.clearRect).toHaveBeenCalled();
      document.querySelector<HTMLButtonElement>(".csm-close")?.click();
      expect(document.querySelector(".csm-stage")).toBeNull();
    }
  });

  it("previews an exact configuration diff and verifies the native setting update", async () => {
    document.body.innerHTML = codexFixture("task");
    installCodexIntelligenceFixture();
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    const originalPrompt = composer.textContent;
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({
      x: 180,
      y: 540,
      left: 180,
      top: 540,
      right: 820,
      bottom: 650,
      width: 640,
      height: 110,
      toJSON: () => ({}),
    });

    await runtime().apply(nativeRefined, "dark", "compatibility", 1, {
      composerMomentsEnabled: true,
      reduceMotion: true,
    });
    document.querySelector<HTMLButtonElement>(".csm-trigger")?.click();
    document.querySelector<HTMLButtonElement>("[data-game='marbles']")?.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".csm-proposal")).not.toBeNull(),
    );
    const proposal = document.querySelector(".csm-proposal") as HTMLElement;
    expect(proposal.textContent).toContain("Model");
    expect(proposal.querySelector("s")).not.toBeNull();

    const apply = Array.from(proposal.querySelectorAll("button")).find(
      (button) => button.textContent === "Apply configuration",
    );
    apply?.click();
    await vi.waitFor(() =>
      expect(proposal.textContent).toContain(
        "Configuration applied and verified",
      ),
    );
    expect(composer.textContent).toBe(originalPrompt);
  });

  it("stops safely when the native Codex configuration cannot be identified", async () => {
    document.body.innerHTML = codexFixture("task");
    const composer = document.querySelector(
      ".composer-surface-chrome",
    ) as HTMLElement;
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({
      x: 180,
      y: 540,
      left: 180,
      top: 540,
      right: 820,
      bottom: 650,
      width: 640,
      height: 110,
      toJSON: () => ({}),
    });

    await runtime().apply(nativeRefined, "dark", "compatibility", 1, {
      composerMomentsEnabled: true,
      reduceMotion: true,
    });
    document.querySelector<HTMLButtonElement>(".csm-trigger")?.click();
    document.querySelector<HTMLButtonElement>("[data-game='balance']")?.click();

    await vi.waitFor(() =>
      expect(document.querySelector(".csm-unavailable")).not.toBeNull(),
    );
    expect(document.querySelector(".csm-proposal")).toBeNull();
    expect(document.body.textContent).toContain(
      "No safely adjustable Codex configuration was found",
    );
  });

  it.each([
    [{ surfaceOpacity: 0.96, focusOpacity: 0.98, focusBlur: 0 }, "solid"],
    [{ surfaceOpacity: 0.88, focusOpacity: 0.94, focusBlur: 10 }, "layered"],
    [{ surfaceOpacity: 0.78, focusOpacity: 0.9, focusBlur: 20 }, "frosted"],
  ] as const)(
    "derives the %s surface recipe as %s material",
    async (appearance, expectedMaterial) => {
      const theme = structuredClone(nativeRefined);
      Object.assign(theme.variants.dark.appearance, appearance);

      await runtime().apply(theme, "dark", "compatibility");

      expect(document.documentElement.dataset.codexStylerMaterial).toBe(
        expectedMaterial,
      );
    },
  );

  it.each([
    ["native", "balanced"],
    ["editorial", "editorial"],
    ["immersive", "cinematic"],
  ] as const)(
    "derives the %s layout as %s typography without extending the theme format",
    async (layout, expectedTypography) => {
      const theme = structuredClone(nativeRefined);
      theme.variants.dark.appearance.layout = layout;

      await runtime().apply(theme, "dark", "compatibility");

      expect(document.documentElement.dataset.codexStylerTypography).toBe(
        expectedTypography,
      );
    },
  );

  it.each(["light", "dark"] as const)(
    "keeps the %s preview palette identical to the injected runtime",
    (variant) => {
      const theme = structuredClone(nativeRefined);
      const visual = theme.variants[variant];
      const contrastSystem = resolveThemeContrast(theme, variant);
      const previewPalette = resolveThemePreviewPalette(
        visual.appearance,
        visual.background.color,
        contrastSystem,
      );

      expect(
        runtimeInternals().semanticPalette(
          visual.appearance,
          visual.background,
          contrastSystem,
        ),
      ).toEqual(previewPalette);
    },
  );

  it.each(["tonal", "contrast"] as const)(
    "keeps the %s color harmony identical in preview and runtime",
    (recipe) => {
      const theme = structuredClone(nativeRefined);
      assignThemeColorHarmony(theme, "dark", recipe);
      const visual = theme.variants.dark;
      const contrastSystem = resolveThemeContrast(theme, "dark");

      expect(
        runtimeInternals().semanticPalette(
          visual.appearance,
          visual.background,
          contrastSystem,
        ),
      ).toEqual(
        resolveThemePreviewPalette(
          visual.appearance,
          visual.background.color,
          contrastSystem,
        ),
      );
    },
  );

  it("derives functional colors from the actual surface tone instead of the variant label", () => {
    const theme = structuredClone(nativeRefined);
    const visual = theme.variants.light;
    visual.background.color = "#090B10";
    visual.background.overlay = "#090B10";
    visual.background.overlayOpacity = 1;
    visual.appearance.surface = "#151820";
    visual.appearance.text = "#F4F6FA";
    visual.appearance.mutedText = "#C2C8D2";
    visual.appearance.palette = {
      ...visual.appearance.palette,
      success: "#14311F",
      warning: "#3A2910",
    };
    const contrastSystem = resolveThemeContrast(theme, "light");
    const previewPalette = resolveThemePreviewPalette(
      visual.appearance,
      visual.background.color,
      contrastSystem,
    );
    const injectedPalette = runtimeInternals().semanticPalette(
      visual.appearance,
      visual.background,
      contrastSystem,
    );

    expect(contrastSystem.tone).toBe("light");
    expect(injectedPalette).toEqual(previewPalette);
    expect(
      minimumContrast(
        injectedPalette.success,
        contrastSystem.strongBackgrounds,
      ),
    ).toBeGreaterThanOrEqual(4.49);
    expect(
      minimumContrast(
        injectedPalette.warning,
        contrastSystem.strongBackgrounds,
      ),
    ).toBeGreaterThanOrEqual(4.49);
  });

  it("renders validated scene layers and updates parallax without blocking Codex", async () => {
    const theme = structuredClone(nativeRefined);
    theme.scene.layers = [
      {
        id: "ambient-depth",
        type: "gradient",
        opacity: 0.42,
        blendMode: "soft-light",
        parallax: 20,
      },
      {
        id: "edge-vignette",
        type: "vignette",
        opacity: 0.3,
        blendMode: "multiply",
        parallax: 0,
      },
    ];

    await runtime().apply(theme, "dark", "compatibility");

    const gradient = document.querySelector<HTMLElement>(
      '[data-layer-id="ambient-depth"]',
    );
    expect(gradient).not.toBeNull();
    expect(gradient).toHaveClass("cs-layer-gradient");
    expect(gradient?.style.pointerEvents).toBe("");
    expect(gradient?.style.opacity).toBe("0.42");
    expect(gradient?.style.mixBlendMode).toBe("soft-light");

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: window.innerWidth,
        clientY: window.innerHeight,
      }),
    );
    expect(gradient?.style.transform).toContain("translate(");

    window.dispatchEvent(new Event("blur"));
    expect(gradient?.style.transform).toBe("");

    runtime().restore();
    expect(document.querySelector(".cs-layer")).toBeNull();
  });

  it("uses the matching image layer to control the base background", async () => {
    const theme = structuredClone(nativeRefined);
    const image = "data:image/png;base64,iVBORw0KGgo=";
    theme.variants.dark.background.image = image;
    theme.scene.layers = [
      {
        id: "studio-background",
        type: "image",
        asset: image,
        opacity: 0.68,
        blendMode: "soft-light",
        parallax: 12,
      },
    ];
    theme.variants.dark.motion.intensity = 1;
    theme.variants.dark.motion.parallax = 4;

    await runtime().apply(theme, "dark", "compatibility");

    const background = document.querySelector<HTMLElement>(".cs-background");
    expect(background?.dataset.layerId).toBe("studio-background");
    expect(background?.style.opacity).toBe("0.68");
    expect(background?.style.mixBlendMode).toBe("soft-light");
    expect(
      document.querySelectorAll('[data-layer-id="studio-background"]'),
    ).toHaveLength(1);

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: window.innerWidth,
        clientY: window.innerHeight,
      }),
    );
    expect(background?.style.transform).toContain("translate(-2px, -2px)");
  });

  it("keeps scene layers still when the global parallax depth is zero", async () => {
    const theme = structuredClone(nativeRefined);
    theme.scene.layers = [
      {
        id: "still-gradient",
        type: "gradient",
        opacity: 0.4,
        blendMode: "soft-light",
        parallax: 12,
      },
    ];
    theme.variants.dark.motion.intensity = 1;
    theme.variants.dark.motion.parallax = 0;

    await runtime().apply(theme, "dark", "compatibility");
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: window.innerWidth,
        clientY: window.innerHeight,
      }),
    );

    expect(
      document.querySelector<HTMLElement>('[data-layer-id="still-gradient"]')
        ?.style.transform,
    ).toBe("");
  });

  it("rejects malformed scene layers before injecting them", async () => {
    const theme = structuredClone(nativeRefined);
    theme.scene.layers[0].opacity = 2;

    await expect(
      runtime().apply(theme, "dark", "compatibility"),
    ).rejects.toThrow("invalid scene layer data");
    expect(document.getElementById("codex-styler-scene-root")).toBeNull();
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
    expect(document.documentElement.dataset.codexStylerGeometry).toBe(
      "balanced",
    );
    expect(document.documentElement.dataset.codexStylerTypography).toBe(
      "balanced",
    );
    expect(document.documentElement.dataset.codexStylerMotion).toBe("fluid");
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
    expect(stylesheet?.textContent).toContain(
      '[role="tab"][aria-selected="true"]',
    );
    expect(stylesheet?.textContent).toContain(":focus-visible");
    expect(stylesheet?.textContent).toContain("accent-color:");
    expect(stylesheet?.textContent).toContain('[aria-disabled="true"]');
    expect(stylesheet?.textContent).toContain('[aria-invalid="true"]');
    expect(stylesheet?.textContent).toContain('[data-state="active"]');
    expect(stylesheet?.textContent).toContain(
      "progress::-webkit-progress-value",
    );
    expect(stylesheet?.textContent).toContain("::-webkit-scrollbar-thumb");
    expect(
      stylesheet?.textContent?.match(/scrollbar-width: thin/g),
    ).toHaveLength(1);
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-overlay-root] *::-webkit-scrollbar-thumb",
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-scrollbar-thumb: color-mix(in srgb, var(--codex-styler-accent)",
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-decorations="expressive"',
    );
    expect(stylesheet?.textContent).toContain(
      '[contenteditable="true"] {\n          caret-color:',
    );
    expect(stylesheet?.textContent).toContain(':is(a, [role="link"]):hover');
    expect(stylesheet?.textContent).toContain("::target-text");
    expect(stylesheet?.textContent).toContain("[data-sonner-toast]");
    expect(stylesheet?.textContent).toContain('[role="tooltip"]');
    expect(stylesheet?.textContent).toContain(":not(pre) > code");
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-app-root] table",
    );
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-app-root] details",
    );
    expect(stylesheet?.textContent).toContain(
      '[data-message-author-role="user"]',
    );
    expect(stylesheet?.textContent).toContain(
      "var(--codex-styler-control-active)",
    );
    expect(stylesheet?.textContent).toContain("details[open] > summary");
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-app-root] ins",
    );
    expect(stylesheet?.textContent).toContain(
      "body > [data-codex-styler-app-root] del",
    );
    expect(stylesheet?.textContent).toContain(":is(samp, output)");
    expect(stylesheet?.textContent).toContain('[role="progressbar"]');
    expect(stylesheet?.textContent).toContain('[role="treeitem"]');
    expect(stylesheet?.textContent).toContain('[role="gridcell"]');
    expect(stylesheet?.textContent).toContain("fieldset");
    expect(stylesheet?.textContent).toContain("figcaption");
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
      'data-codex-styler-icons="contained"] body > [data-codex-styler-app-root] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"])',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-icons="themed"] body > [data-codex-styler-overlay-root] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"])',
    );
    expect(stylesheet?.textContent).toContain(
      "color: var(--codex-styler-icon) !important",
    );
    expect(stylesheet?.textContent).toContain(
      "color: var(--codex-styler-icon-emphasis) !important",
    );
    expect(stylesheet?.textContent).toContain(
      ':not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand])',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-decorations="subtle"] main.main-surface',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-page="settings"] body > [data-codex-styler-app-root] .main-surface',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-decorations="expressive"] :is(\n          .composer-surface-chrome',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-geometry="precise"] body > [data-codex-styler-app-root] [role="tablist"]',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-geometry="soft"] body > [data-codex-styler-app-root] [role="tab"]',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-material="solid"]',
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-material="frosted"]',
    );
    expect(stylesheet?.textContent).toContain(
      "background: var(--codex-styler-material-raised) !important",
    );
    expect(stylesheet?.textContent).toContain(
      "background: var(--codex-styler-material-overlay) !important",
    );
    expect(stylesheet?.textContent).toContain(
      "background: var(--codex-styler-material-sunken) !important",
    );
    expect(stylesheet?.textContent).toContain(
      'data-codex-styler-typography="editorial"]',
    );
    expect(stylesheet?.textContent).toContain(
      "line-height: var(--codex-styler-content-leading) !important",
    );
    const typographyTreatments = stylesheet?.textContent
      ?.split("/* Theme typography is content-scoped")[1]
      ?.split(
        'html[data-codex-styler][data-codex-styler-mode="semantic"] body > [data-codex-styler-app-root] :is(fieldset',
      )[0];
    expect(typographyTreatments).toBeDefined();
    expect(typographyTreatments).toContain("[data-message-author-role]");
    expect(typographyTreatments).toContain(".ProseMirror");
    expect(typographyTreatments).toContain("html:lang(zh)");
    expect(typographyTreatments).not.toMatch(
      /(?:^|\n)\s*(?:font-family|font-size|width|height|padding|margin)\s*:/,
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-motion-duration: 190ms",
    );
    const iconTreatments = stylesheet?.textContent
      ?.split("/*\n         * Icon treatments are semantic")[1]
      ?.split("/* Full home composition")[0];
    expect(iconTreatments).toBeDefined();
    expect(iconTreatments).not.toMatch(
      /(?:^|\n)\s*(?:width|height|padding|background|stroke-width)\s*:/,
    );
    expect(iconTreatments).toContain("box-shadow: 0 0 0 3px");
    const decorationTreatments = stylesheet?.textContent
      ?.split("/* Decoration depth is intentionally geometry-safe")[1]
      ?.split(
        'html[data-codex-styler][data-codex-styler-mode="semantic"] ::selection',
      )[0];
    expect(decorationTreatments).toBeDefined();
    expect(decorationTreatments).toContain(
      '[data-pip-obstacle="thread-summary-panel"]',
    );
    expect(decorationTreatments).toContain('[role="alertdialog"]');
    expect(decorationTreatments).toContain('[role="tabpanel"]');
    expect(decorationTreatments).not.toMatch(
      /(?:^|\n)\s*(?:position|display|width|height|z-index|inset)\s*:/,
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

  it.each(["dialog", "toast", "menu"] as const)(
    "keeps %s portals above the companion layer",
    async (kind) => {
      document.body.innerHTML = codexFixture("task");
      await runtime().apply(nativeRefined, "dark", "developer");

      const portal = portalFixture(kind);
      document.body.appendChild(portal);

      await vi.waitFor(() => {
        expect(portal).toHaveAttribute("data-codex-styler-overlay-root");
      });
      expect(portal).toHaveAttribute("data-codex-styler-unlayered-root");
      const stylesheet = document.getElementById("codex-styler-runtime-style");
      expect(stylesheet?.textContent).toContain("z-index: 11");
      expect(stylesheet?.textContent).toContain("z-index: 10");
    },
  );

  it("keeps right-panel tabs and a dynamic composer in the application root", async () => {
    document.body.innerHTML = codexFixture("right-panel");
    await runtime().apply(nativeRefined, "dark", "developer");

    const root = document.getElementById("root") as HTMLElement;
    const tablist = root.querySelector('[role="tablist"]');
    expect(root).toHaveAttribute("data-codex-styler-app-root");
    expect(tablist).not.toBeNull();

    const composer = document.createElement("div");
    composer.className = "composer-surface-chrome";
    root.querySelector('[role="main"]')?.appendChild(composer);
    await vi.waitFor(() => {
      expect(root).toHaveAttribute("data-codex-styler-app-root");
      expect([...root.querySelectorAll(".composer-surface-chrome")]).toContain(
        composer,
      );
    });
    expect(document.getElementById("codex-styler-scene-root")).not.toBeNull();
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
    const contrastSystem = resolveThemeContrast(theme, "dark");
    const previewPalette = resolveThemePreviewPalette(
      theme.variants.dark.appearance,
      theme.variants.dark.background.color,
      contrastSystem,
    );

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
      `--codex-styler-success: ${previewPalette.success}`,
    );
    expect(stylesheet?.textContent).toContain("--codex-styler-icon:");
    expect(stylesheet?.textContent).toContain("--codex-styler-icon-emphasis:");
    expect(stylesheet?.textContent).toContain(
      "--color-icon-primary: var(--codex-styler-icon-emphasis)",
    );
    expect(stylesheet?.textContent).toContain(
      "--color-background-status-success: color-mix(in srgb, var(--codex-styler-success) 16%, var(--codex-styler-surface))",
    );
  });

  it("adapts semantic text to image scene layers and overrides stale Codex appearance classes", async () => {
    document.body.innerHTML = codexFixture("task");
    const theme = structuredClone(nativeRefined);
    const image = "data:image/png;base64,iVBORw0KGgo=";
    delete theme.variants.light.background.image;
    theme.variants.light.appearance.surfaceOpacity = 0.3;
    theme.variants.light.appearance.focusOpacity = 0.97;
    theme.variants.light.appearance.palette = {
      surfaceRaised: theme.variants.light.appearance.text,
      control: theme.variants.light.appearance.text,
    };
    theme.scene.layers = [
      {
        id: "independent-background",
        type: "image",
        asset: image,
        opacity: 1,
        blendMode: "normal",
        parallax: 0,
      },
    ];
    const contrastSystem = resolveThemeContrast(theme, "light");

    await runtime().apply(theme, "light", "developer");

    const stylesheet = document.getElementById("codex-styler-runtime-style");
    expect(contrastSystem.hasImageBackdrop).toBe(true);
    expect(stylesheet?.textContent).toContain(
      `--codex-styler-text-primary: ${contrastSystem.textPrimary}`,
    );
    expect(stylesheet?.textContent).not.toContain(
      `--codex-styler-surface-raised: ${theme.variants.light.appearance.text}`,
    );
    const raisedSurface = stylesheet?.textContent.match(
      /--codex-styler-surface-raised:\s*(#[0-9a-f]{6})/i,
    )?.[1];
    expect(raisedSurface).toBeDefined();
    expect(
      contrastRatio(contrastSystem.textPrimary, raisedSurface as string),
    ).toBeGreaterThanOrEqual(4.49);
    expect(stylesheet?.textContent).toContain(
      `${Math.round(contrastSystem.quietSurfaceOpacity * 100)}%, transparent) !important`,
    );
    expect(stylesheet?.textContent).toContain(
      `${Math.round(contrastSystem.strongSurfaceOpacity * 100)}%, transparent) !important`,
    );
    expect(contrastSystem.strongSurfaceOpacity).toBeGreaterThanOrEqual(0.97);
    expect(stylesheet?.textContent).toContain("scrollbar-width: thin");
    expect(stylesheet?.textContent).toContain(
      "::-webkit-scrollbar-thumb:hover",
    );
    expect(stylesheet?.textContent).toContain("color-scheme: light !important");
    expect(stylesheet?.textContent).toContain(
      '[class~="text-token-text-primary"]',
    );
    expect(stylesheet?.textContent).toContain(
      '[class~="text-token-text-secondary"]',
    );
    expect(stylesheet?.textContent).toContain(
      "--color-token-foreground-secondary: var(--codex-styler-text-secondary)",
    );
    expect(stylesheet?.textContent).toContain(
      ":is(input, textarea)::placeholder",
    );
    expect(stylesheet?.textContent).not.toContain("* {\n          color:");
    expect(document.documentElement.dataset.codexStylerVariant).toBe("light");
    expect(document.documentElement.dataset.codexStylerContrast).toBe(
      contrastSystem.tone,
    );

    runtime().restore();
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-variant",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-contrast",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-geometry",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-material",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-typography",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-motion",
    );
  });

  it("maps theme intensity to geometry-safe runtime motion profiles", async () => {
    document.body.innerHTML = codexFixture("task");
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.motion.intensity = 0.9;

    await runtime().apply(theme, "dark", "developer");

    const stylesheet = document.getElementById("codex-styler-runtime-style");
    expect(document.documentElement).toHaveAttribute(
      "data-codex-styler-motion",
      "expressive",
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-motion-duration: 240ms",
    );
    expect(stylesheet?.textContent).toContain(
      "--codex-styler-motion-lift: 3px",
    );
    expect(stylesheet?.textContent).toContain(
      "@keyframes codex-styler-surface-enter",
    );
    const overlayMotion = stylesheet?.textContent
      ?.split("@keyframes codex-styler-surface-enter")[1]
      ?.split('[role="tooltip"]')[0];
    expect(overlayMotion).toBeDefined();
    expect(overlayMotion).toContain(
      "opacity: var(--codex-styler-motion-overlay-opacity)",
    );
    expect(overlayMotion).not.toContain("transform:");
    expect(stylesheet?.textContent).toContain(
      '[data-codex-styler-motion="fluid"]',
    );
    expect(stylesheet?.textContent).toContain("animation: none !important");

    theme.variants.dark.motion.intensity = 0;
    await runtime().apply(theme, "dark", "developer");
    expect(document.documentElement).toHaveAttribute(
      "data-codex-styler-motion",
      "still",
    );
    expect(
      document.getElementById("codex-styler-runtime-style")?.textContent,
    ).toContain("--codex-styler-motion-duration: 0ms");
    expect(
      document.getElementById("codex-styler-runtime-style")?.textContent,
    ).toContain("transform: translateX(0px)");
  });

  it("repairs a stale Codex foreground without dropping the semantic theme", async () => {
    document.body.innerHTML = codexFixture("task");
    const contrastSystem = resolveThemeContrast(nativeRefined, "dark");
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn((element: Element) => ({
        backgroundColor: element.matches("main.main-surface")
          ? "rgba(20, 24, 28, 0.92)"
          : "rgba(0, 0, 0, 0)",
        backgroundImage: "none",
        color: element.matches('[class~="text-token-text-primary"]')
          ? document.documentElement.hasAttribute(
              "data-codex-styler-contrast-repair",
            )
            ? contrastSystem.textPrimary
            : "#151515"
          : contrastSystem.textPrimary,
        position: "relative",
        zIndex: "auto",
      })),
    );

    const outcome = await runtime().apply(nativeRefined, "dark", "auto");

    expect(outcome.resolvedMode).toBe("semantic");
    expect(outcome.reason).toBeNull();
    expect(outcome.contrastRepairApplied).toBe(true);
    expect(document.documentElement).toHaveAttribute(
      "data-codex-styler-contrast-repair",
      "active",
    );
    const repairStyle = document.getElementById(
      "codex-styler-contrast-repair-style",
    );
    expect(repairStyle?.textContent).toContain(
      `--codex-styler-text-primary: ${contrastSystem.textPrimary}`,
    );
    expect(repairStyle?.textContent).toContain("99%, transparent");

    runtime().restore();
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-contrast-repair",
    );
    expect(
      document.getElementById("codex-styler-contrast-repair-style"),
    ).toBeNull();
  });

  it("falls back only when targeted contrast repair also fails", async () => {
    document.body.innerHTML = codexFixture("task");
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn((element: Element) => ({
        backgroundColor: element.matches("main.main-surface")
          ? "rgba(20, 24, 28, 0.92)"
          : "rgba(0, 0, 0, 0)",
        backgroundImage: "none",
        color: element.matches('[class~="text-token-text-primary"]')
          ? "#151515"
          : "#f7f7f5",
        position: "relative",
        zIndex: "auto",
      })),
    );

    const outcome = await runtime().apply(nativeRefined, "dark", "auto");

    expect(outcome.resolvedMode).toBe("compatibility");
    expect(outcome.reason).toContain("native foreground");
    expect(document.documentElement.dataset.codexStylerMode).toBe(
      "compatibility",
    );
    expect(document.documentElement).not.toHaveAttribute(
      "data-codex-styler-contrast-repair",
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

  it("accepts calibrated poses and ignores stale entity revisions", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const theme = structuredClone(nativeRefined);
    const entity = testSpriteEntity();
    theme.scene.entities = [entity];

    const outcome = await runtime().apply(theme, "dark", "compatibility", 5);
    expect(outcome.stale).not.toBe(true);
    expect(document.getElementById("codex-styler-entity-root")).not.toBeNull();

    expect(runtime().updateEntity(null, 6).stale).toBe(false);
    expect(
      document.getElementById("codex-styler-entity-root")?.childElementCount,
    ).toBe(0);
    expect(runtime().updateEntity(entity, 4).stale).toBe(true);
    expect(
      document.getElementById("codex-styler-entity-root")?.childElementCount,
    ).toBe(0);
  });

  it("keeps free and attached companions inside a size-aware safe area", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(360);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(280);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const theme = structuredClone(nativeRefined);
    const entity = testSpriteEntity({
      anchor: { x: 99, y: 99 },
      size: 140,
    });
    theme.scene.entities = [entity];
    await runtime().apply(theme, "dark", "compatibility", 5);

    const canvas = document.querySelector<HTMLCanvasElement>(
      "#codex-styler-entity-root canvas",
    );
    expect(canvas).toHaveStyle({ left: "282px", top: "202px" });

    const composer = document.createElement("div");
    composer.className = "composer-surface-chrome";
    let targetX = 260;
    vi.spyOn(composer, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          x: targetX,
          y: 210,
          left: targetX,
          top: 210,
          right: targetX + 80,
          bottom: 258,
          width: 80,
          height: 48,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    document.body.appendChild(composer);
    runtime().updateEntity(
      {
        ...entity,
        attachment: {
          target: "composer",
          edge: "top",
          align: 1,
          offset: { x: 12, y: 3 },
        },
      },
      6,
    );
    const attachedCanvas = document.querySelector<HTMLCanvasElement>(
      "#codex-styler-entity-root canvas",
    );
    expect(attachedCanvas).toHaveStyle({ left: "282px", top: "213px" });

    targetX = 20;
    document.dispatchEvent(new Event("scroll"));
    expect(attachedCanvas).toHaveStyle({ left: "112px", top: "213px" });

    composer.remove();
    runtime().updateEntity(
      {
        ...entity,
        attachment: {
          target: "composer",
          edge: "top",
          align: 1,
          offset: { x: 12, y: 3 },
        },
      },
      7,
    );
    const fallbackCanvas = document.querySelector<HTMLCanvasElement>(
      "#codex-styler-entity-root canvas",
    );
    expect(fallbackCanvas).toHaveStyle({ left: "282px", top: "202px" });
  });
});
