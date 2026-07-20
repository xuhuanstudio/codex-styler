import { fireEvent, render, screen, within } from "@testing-library/react";
import { builtinCompanions, builtinThemes } from "@codex-styler/theme-core";
import { describe, expect, it, vi } from "vitest";
import { translate } from "../../lib/i18n";
import { createCompanionProject } from "../companion-creator/model";
import { CompanionsView } from "./CompanionsView";

describe("CompanionsView installed companion management", () => {
  it("keeps source, export, and delete actions available in the detail view", () => {
    const project = createCompanionProject("project-12345678");
    project.name = "Orbit Fox";
    const companion = structuredClone(builtinCompanions[0]);
    companion.id = "local.orbit-fox-12345678";
    companion.name = "Orbit Fox";
    companion.locales.en = {
      name: "Orbit Fox",
      description: "A locally installed companion.",
    };
    const onEditProject = vi.fn();
    const onExport = vi.fn();
    const onDelete = vi.fn();
    const onSizeChange = vi.fn();
    const onPlacementModeChange = vi.fn();
    const onResetPlacement = vi.fn();

    render(
      <CompanionsView
        locale="en"
        selected={companion}
        previewThemeFor={() => builtinThemes[0]}
        localCompanions={[companion]}
        projects={[project]}
        collection="mine"
        variant="dark"
        reduceMotion
        t={(key) => translate("en", key)}
        onSelect={vi.fn()}
        onCollectionChange={vi.fn()}
        onCreate={vi.fn()}
        onEditProject={onEditProject}
        onDeleteProject={vi.fn()}
        onImport={vi.fn()}
        onExport={onExport}
        onDelete={onDelete}
        selectedSize={136}
        placementCustomized
        placementMode="composer"
        onSizeChange={onSizeChange}
        onPlacementModeChange={onPlacementModeChange}
        onResetPlacement={onResetPlacement}
        onAnchorChange={vi.fn()}
        onAttachmentChange={vi.fn()}
        resolveAsset={() => ""}
        resolveCompanionAsset={() => ""}
        isLive={false}
        busy={false}
      />,
    );

    expect(screen.getByText("Installed locally")).toBeVisible();
    const actions = screen.getByRole("group", {
      name: "Installed companion actions",
    });
    fireEvent.click(
      within(actions).getByRole("button", { name: "Edit source project" }),
    );
    fireEvent.click(
      within(actions).getByRole("button", { name: "Export companion" }),
    );
    fireEvent.click(
      within(actions).getByRole("button", { name: "Delete companion" }),
    );

    expect(onEditProject).toHaveBeenCalledWith(project);
    expect(onExport).toHaveBeenCalledWith(companion);
    expect(onDelete).toHaveBeenCalledWith(companion);

    fireEvent.change(screen.getByRole("slider", { name: "Companion size" }), {
      target: { value: "180" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Reset size & placement" }),
    );
    expect(onSizeChange).toHaveBeenCalledWith(180);
    expect(
      screen.getByRole("button", { name: "Composer edge" }),
    ).toHaveAttribute("aria-pressed", "true");
    const freePositionButton = screen.getByRole("button", {
      name: "Free position",
    });
    expect(freePositionButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(freePositionButton);
    expect(onPlacementModeChange).toHaveBeenCalledWith("free");
    expect(onResetPlacement).toHaveBeenCalledOnce();

    const search = screen.getByRole("searchbox", {
      name: "Search companions",
    });
    const list = screen.getByRole("region", { name: "Companions" });
    fireEvent.change(search, { target: { value: "missing" } });
    expect(
      within(list).getByText("No companions match this search."),
    ).toBeVisible();

    fireEvent.click(
      within(screen.getByRole("search")).getByRole("button", {
        name: "Clear search",
      }),
    );
    expect(
      within(list).getByRole("button", { name: /Orbit Fox/ }),
    ).toBeVisible();
  });
});
