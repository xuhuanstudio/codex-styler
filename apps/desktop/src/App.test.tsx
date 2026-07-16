import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./lib/runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/runtime")>();
  return {
    ...actual,
    detectCodex: vi.fn().mockResolvedValue({
      installed: true,
      running: true,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    }),
  };
});

describe("Codex Styler shell", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("does not offer to launch over an existing Codex session", async () => {
    render(<App />);
    expect(await screen.findByText("Codex is already running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check again" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply to Codex" })).not.toBeInTheDocument();
  });
});
