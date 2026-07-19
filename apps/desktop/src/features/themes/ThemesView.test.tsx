import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});
