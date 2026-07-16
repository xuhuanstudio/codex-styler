import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("Codex Styler shell", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        reduceMotion: false,
        manualUpdateChecks: true,
        onboardingComplete: true,
      }),
    );
  });

  it("renders the core navigation and safety status", async () => {
    render(<App />);
    expect(screen.getAllByText("Codex Styler").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Themes" })).toBeInTheDocument();
    expect(screen.getAllByText("Safe mode").length).toBeGreaterThan(0);
  });
});
