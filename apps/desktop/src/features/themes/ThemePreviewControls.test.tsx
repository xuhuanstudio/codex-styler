import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translate, type MessageKey } from "../../lib/i18n";
import { ThemePreviewControls } from "./ThemePreviewControls";

const t = (key: MessageKey) => translate("en", key);

describe("ThemePreviewControls", () => {
  afterEach(cleanup);

  it("keeps the detailed controls out of the preview until requested", () => {
    const onScenarioChange = vi.fn();
    const onPresentationChange = vi.fn();
    render(
      <ThemePreviewControls
        scenario="task"
        presentation="styled"
        t={t}
        onScenarioChange={onScenarioChange}
        onPresentationChange={onPresentationChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Task & composer" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("group", { name: "Preview controls" }),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("group", { name: "Preview controls" }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Preview scenario" }),
      { target: { value: "settings" } },
    );
    expect(onScenarioChange).toHaveBeenCalledWith("settings");
  });

  it("supports keyboard dismissal and explicit appearance comparison", () => {
    const onPresentationChange = vi.fn();
    render(
      <ThemePreviewControls
        scenario="task"
        presentation="styled"
        t={t}
        onScenarioChange={vi.fn()}
        onPresentationChange={onPresentationChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Task & composer" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Official" }));
    expect(onPresentationChange).toHaveBeenCalledWith("official");

    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });
});
