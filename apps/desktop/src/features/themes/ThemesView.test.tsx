import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { gildedGrandeur } from "@codex-styler/theme-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translate, type MessageKey } from "../../lib/i18n";
import { ThemesView } from "./ThemesView";

const t = (key: MessageKey) => translate("en", key);

function renderThemesView(reduceMotion = false) {
  return render(
    <ThemesView
      locale="en"
      selectedTheme={gildedGrandeur}
      previewThemeFor={(theme) => theme}
      localThemes={[]}
      collection="builtIn"
      variant="dark"
      reduceMotion={reduceMotion}
      t={t}
      onSelect={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onCollectionChange={vi.fn()}
      onNew={vi.fn()}
      onImport={vi.fn()}
      resolveAsset={(_, path) => path}
      liveThemeId={null}
      busy={false}
    />,
  );
}

describe("ThemesView", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("turns the motion capability into a real guided theme preview", () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 42),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { container } = renderThemesView();

    fireEvent.click(
      screen.getByRole("button", { name: "Inspect this effect: Motion" }),
    );

    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-motion-preview",
      "playing",
    );
    expect(
      screen.getByRole("button", { name: "Inspect this effect: Motion" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps authored motion still when Reduce Motion is enabled", () => {
    const requestAnimationFrame = vi.fn(() => 42);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { container } = renderThemesView(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Inspect this effect: Motion" }),
    );

    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(container.querySelector(".workspace-preview")).not.toHaveAttribute(
      "data-motion-preview",
    );
  });

  it("filters the library by localized copy and clears with Escape", () => {
    const { container } = renderThemesView();
    const search = screen.getByRole("searchbox", { name: "Search themes" });
    const list = screen.getByLabelText("All themes");

    fireEvent.change(search, { target: { value: "garden" } });

    expect(
      within(list).getByRole("button", { name: "Preview: Quiet Garden" }),
    ).toBeVisible();
    expect(
      within(list).queryByRole("button", { name: "Preview: Native Refined" }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".featured-theme__copy h2"),
    ).toHaveTextContent("Quiet Garden");

    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("");
    expect(
      within(list).getByRole("button", { name: "Preview: Native Refined" }),
    ).toBeVisible();
  });

  it("moves focus into compact details and restores the selected row", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    const { container } = renderThemesView();
    const trigger = screen.getByRole("button", {
      name: "Preview: Native Refined",
    });

    fireEvent.click(trigger);

    const back = screen.getByRole("button", { name: "Back to themes" });
    expect(back).toHaveFocus();
    expect(container.querySelector(".theme-library-workspace")).toHaveClass(
      "theme-library-workspace--detail",
    );

    fireEvent.keyDown(back, { key: "Escape" });

    expect(trigger).toHaveFocus();
    expect(container.querySelector(".theme-library-workspace")).not.toHaveClass(
      "theme-library-workspace--detail",
    );
  });
});
