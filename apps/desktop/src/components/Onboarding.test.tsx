import { fireEvent, render, screen } from "@testing-library/react";
import { builtinThemes } from "@codex-styler/theme-core";
import { describe, expect, it, vi } from "vitest";
import type { MessageKey } from "../lib/i18n";
import { Onboarding } from "./Onboarding";

describe("Onboarding", () => {
  it("keeps navigation and actions outside the scrolling stage content", () => {
    const theme = builtinThemes[0]!;
    const { container } = render(
      <Onboarding
        isFirstRun={false}
        locale="en"
        detection={{
          installed: true,
          running: false,
          path: "/Applications/Codex.app",
          version: "test",
          platform: "macos",
        }}
        selectedTheme={theme}
        previewTheme={theme}
        selectedCompanion={null}
        recommendedCompanion={null}
        variant="dark"
        reduceMotion={false}
        requiresRestart={false}
        onSelectTheme={vi.fn()}
        onSelectCompanion={vi.fn()}
        onSelectVariant={vi.fn()}
        onApply={vi.fn()}
        onOpenSettings={vi.fn()}
        resolveAsset={() => ""}
        t={(key: MessageKey) => key}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const stepNavigation = screen.getByRole("navigation", {
      name: "setupGuide",
    });
    const content = container.querySelector<HTMLElement>(".onboarding-content");
    const footer = container.querySelector<HTMLElement>(".onboarding-footer");

    expect(dialog).toContainElement(stepNavigation);
    expect(content).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(content?.nextElementSibling).toBe(footer);
    expect(content).not.toContainElement(footer);

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: "setupStyleTitle" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /previous/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /continue/i })).toBeVisible();
  });
});
