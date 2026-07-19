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
        motionPreviewing={false}
        motionPreviewDisabled={false}
        motionPreviewHelp="Runs a guided preview."
        onScenarioChange={onScenarioChange}
        onPresentationChange={onPresentationChange}
        onPreviewMotion={vi.fn()}
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
        motionPreviewing={false}
        motionPreviewDisabled={false}
        motionPreviewHelp="Runs a guided preview."
        onScenarioChange={vi.fn()}
        onPresentationChange={onPresentationChange}
        onPreviewMotion={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Task & composer" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Official" }));
    expect(onPresentationChange).toHaveBeenCalledWith("official");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("exposes a described motion preview action with explicit states", () => {
    const onPreviewMotion = vi.fn();
    const { rerender } = render(
      <ThemePreviewControls
        scenario="task"
        presentation="styled"
        t={t}
        motionPreviewing={false}
        motionPreviewDisabled={false}
        motionPreviewHelp="Runs a guided preview."
        onScenarioChange={vi.fn()}
        onPresentationChange={vi.fn()}
        onPreviewMotion={onPreviewMotion}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Task & composer" }));
    const motionButton = screen.getByRole("button", {
      name: /Preview motion/,
    });
    expect(motionButton).toHaveAccessibleDescription("Runs a guided preview.");
    fireEvent.click(motionButton);
    expect(onPreviewMotion).toHaveBeenCalledOnce();

    rerender(
      <ThemePreviewControls
        scenario="task"
        presentation="official"
        t={t}
        motionPreviewing={false}
        motionPreviewDisabled
        motionPreviewHelp="Switch to Styled first."
        onScenarioChange={vi.fn()}
        onPresentationChange={vi.fn()}
        onPreviewMotion={onPreviewMotion}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Task & composer" }));
    expect(
      screen.getByRole("button", { name: /Preview motion/ }),
    ).toBeDisabled();
  });
});
