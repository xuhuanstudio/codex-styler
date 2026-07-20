import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceLibraryToolbar } from "./ResourceLibraryToolbar";

describe("ResourceLibraryToolbar", () => {
  it("keeps resource tabs and search behavior behind one shared boundary", () => {
    const onTabChange = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <ResourceLibraryToolbar
        ariaLabel="Themes"
        tabs={[
          { id: "builtIn", label: "Built-in", count: 5 },
          { id: "mine", label: "My themes", count: 2 },
        ]}
        activeTab="builtIn"
        onTabChange={onTabChange}
        search={{
          value: "",
          label: "Search themes",
          placeholder: "Search themes",
          clearLabel: "Clear search",
          resultCount: 5,
          totalCount: 5,
          onChange: onSearchChange,
        }}
      />,
    );

    expect(screen.getByRole("tab", { name: /Built-in/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: /My themes/ }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search themes" }), {
      target: { value: "garden" },
    });

    expect(onTabChange).toHaveBeenCalledWith("mine");
    expect(onSearchChange).toHaveBeenCalledWith("garden");
  });
});
