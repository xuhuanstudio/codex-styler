import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  composeThemeWithCompanion,
  gildedGrandeur,
  merryBigTop,
  mossCompanion,
  nativeRefined,
} from "@codex-styler/theme-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewWorkspace } from "./PreviewWorkspace";
import { resolveThemeContrast } from "../lib/theme-contrast";
import { resolveThemePreviewPalette } from "../lib/theme-preview-palette";

describe("PreviewWorkspace task views", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lets the theme editor move between conversation, changes, and terminal", () => {
    const onScenarioChange = vi.fn();
    render(
      <PreviewWorkspace
        theme={nativeRefined}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="task"
        onScenarioChange={onScenarioChange}
      />,
    );

    expect(screen.getByRole("tab", { name: "Conversation" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));

    expect(onScenarioChange).toHaveBeenNthCalledWith(1, "changes");
    expect(onScenarioChange).toHaveBeenNthCalledWith(2, "terminal");
  });

  it("renders dedicated changes and terminal compositions", () => {
    const { rerender } = render(
      <PreviewWorkspace
        theme={nativeRefined}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="changes"
      />,
    );

    expect(screen.getByText("Working tree")).toBeInTheDocument();

    rerender(
      <PreviewWorkspace
        theme={nativeRefined}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="terminal"
      />,
    );

    expect(screen.getByText("Theme verification")).toBeInTheDocument();
  });

  it("uses the versioned Codex shell without editor-only navigation in library previews", () => {
    const { container } = render(
      <PreviewWorkspace
        theme={nativeRefined}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="task"
      />,
    );

    expect(
      container.querySelector('[data-codex-preview-shell="2026-07"]'),
    ).toBeTruthy();
    expect(container.querySelector(".workspace-sidebar__primary")).toBeTruthy();
    expect(
      container.querySelector(".workspace-header__navigation"),
    ).toBeTruthy();
    expect(container.querySelector(".workspace-content-shell")).toBeTruthy();
    expect(container.querySelector(".workspace-composer__field")).toBeTruthy();
    expect(
      container.querySelector(
        '.workspace-context-tabs[aria-label="Task views"]',
      ),
    ).not.toBeInTheDocument();
  });

  it("exposes the derived geometry, material, typography, and motion character", () => {
    const { container, rerender } = render(
      <PreviewWorkspace
        theme={gildedGrandeur}
        variant="dark"
        locale="en"
        reduceMotion={false}
        resolveAsset={(_, path) => path}
      />,
    );
    const preview = container.querySelector(".workspace-preview");

    expect(preview).toHaveAttribute("data-geometry", "precise");
    expect(preview).toHaveAttribute("data-material", "frosted");
    expect(preview).toHaveAttribute("data-typography", "editorial");
    expect(preview).toHaveAttribute("data-motion-character", "fluid");

    rerender(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion={false}
        resolveAsset={(_, path) => path}
      />,
    );

    expect(preview).toHaveAttribute("data-geometry", "soft");
    expect(preview).toHaveAttribute("data-material", "frosted");
    expect(preview).toHaveAttribute("data-typography", "cinematic");
    expect(preview).toHaveAttribute("data-motion-character", "expressive");
  });

  it("collapses theme motion to still when reduced motion is enabled", () => {
    const { container } = render(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
      />,
    );

    const preview = container.querySelector(".workspace-preview");
    expect(preview).toHaveAttribute("data-motion-character", "still");
    expect(preview).toHaveStyle("--preview-motion-duration: 0ms");
  });

  it("keeps the official comparison outside Styler material and typography", () => {
    const { container } = render(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        presentation="official"
      />,
    );

    expect(container.querySelector(".workspace-preview")).not.toHaveAttribute(
      "data-typography",
    );
    expect(container.querySelector(".workspace-preview")).not.toHaveAttribute(
      "data-material",
    );
  });

  it("keeps expressive material depth available in every focus scenario", () => {
    const { container, rerender } = render(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="settings"
      />,
    );
    const preview = container.querySelector(".workspace-preview");

    expect(preview).toHaveAttribute("data-decorations", "expressive");
    expect(container.querySelector(".workspace-settings-state")).toBeTruthy();

    rerender(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="right-panel"
      />,
    );
    expect(container.querySelector(".workspace-right-panel")).toBeTruthy();

    rerender(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="dialog"
      />,
    );
    expect(container.querySelector(".workspace-dialog-layer")).toBeTruthy();
  });

  it("previews the interaction chrome derived from the theme accent", () => {
    const { container } = render(
      <PreviewWorkspace
        theme={merryBigTop}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="components"
      />,
    );

    expect(container.querySelector(".workspace-component-caret")).toBeTruthy();
    expect(
      container.querySelector(".workspace-component-selection"),
    ).toHaveTextContent("Selected text");
    expect(
      container.querySelector(".workspace-component-link"),
    ).toHaveTextContent("View guide");
    expect(
      container.querySelector(".workspace-component-scroll-sample"),
    ).toBeTruthy();
  });

  it("consumes the complete semantic text and border contract", () => {
    const theme = structuredClone(nativeRefined);
    const appearance = theme.variants.dark.appearance;
    appearance.palette = {
      ...appearance.palette,
      textTertiary: "#A7AFBD",
      borderSubtle: "#303640",
      borderStrong: "#667084",
    };
    const contrastSystem = resolveThemeContrast(theme, "dark");
    const palette = resolveThemePreviewPalette(
      appearance,
      theme.variants.dark.background.color,
      contrastSystem,
    );
    const { container } = render(
      <PreviewWorkspace
        theme={theme}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        scenario="settings"
      />,
    );
    const preview = container.querySelector<HTMLElement>(".workspace-preview");

    expect(preview?.style.getPropertyValue("--preview-tertiary")).toBe(
      palette.textTertiary,
    );
    expect(preview?.style.getPropertyValue("--preview-border-subtle")).toBe(
      palette.borderSubtle,
    );
    expect(preview?.style.getPropertyValue("--preview-border-strong")).toBe(
      palette.borderStrong,
    );
    expect(preview?.style.getPropertyValue("--preview-icon")).toBe(
      palette.icon,
    );
    expect(preview?.style.getPropertyValue("--preview-icon-emphasis")).toBe(
      palette.iconEmphasis,
    );
  });

  it("runs a controlled motion preview and preserves each scene layer scale", () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 42),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { container } = render(
      <PreviewWorkspace
        theme={gildedGrandeur}
        variant="dark"
        locale="en"
        reduceMotion={false}
        resolveAsset={(_, path) => path}
        motionPreviewRevision={1}
      />,
    );

    const preview = container.querySelector(".workspace-preview");
    const backdrop = container.querySelector<HTMLElement>(
      ".workspace-preview__backdrop",
    );
    expect(preview).toHaveAttribute("data-motion-preview", "playing");

    fireEvent.mouseMove(preview as Element, { clientX: 100, clientY: 80 });

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(backdrop?.style.transform).toContain(
      "scale(var(--preview-parallax-scale, 1.015))",
    );
  });

  it("does not run guided motion when Reduce Motion is enabled", () => {
    const requestAnimationFrame = vi.fn(() => 42);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { container } = render(
      <PreviewWorkspace
        theme={gildedGrandeur}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        motionPreviewRevision={1}
      />,
    );

    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(container.querySelector(".workspace-preview")).not.toHaveAttribute(
      "data-motion-preview",
    );
  });

  it("keeps an attached companion grounded after React rerenders the preview", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("workspace-preview") ? 800 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("workspace-preview") ? 400 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("workspace-preview")) {
          return DOMRect.fromRect({ x: 0, y: 0, width: 800, height: 400 });
        }
        if (this.classList.contains("workspace-composer__field")) {
          return DOMRect.fromRect({ x: 200, y: 320, width: 500, height: 45 });
        }
        return DOMRect.fromRect();
      },
    );
    const theme = composeThemeWithCompanion(nativeRefined, mossCompanion);
    const { container, rerender } = render(
      <PreviewWorkspace
        theme={theme}
        variant="dark"
        locale="en"
        reduceMotion
        resolveAsset={(_, path) => path}
        compact
      />,
    );

    const entity = container.querySelector<HTMLElement>(".scene-entity");
    await waitFor(() => {
      expect(entity?.style.getPropertyValue("--entity-x")).toBe("610px");
      expect(
        Number.parseFloat(entity?.style.getPropertyValue("--entity-y") ?? "0"),
      ).toBeCloseTo(321.58, 1);
    });

    rerender(
      <PreviewWorkspace
        theme={theme}
        variant="dark"
        locale="en"
        reduceMotion={false}
        resolveAsset={(_, path) => path}
        compact
      />,
    );

    expect(entity?.style.getPropertyValue("--entity-x")).toBe("610px");
    expect(
      Number.parseFloat(entity?.style.getPropertyValue("--entity-y") ?? "0"),
    ).toBeCloseTo(321.58, 1);
  });
});
