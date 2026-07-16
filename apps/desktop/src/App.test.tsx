import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { builtinThemes } from "@codex-styler/theme-core";
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
        runtimeStrategy: "auto",
        reduceMotion: false,
        manualUpdateChecks: true,
        onboardingComplete: true,
      }),
    );
  });

  it("renders the core navigation and compatibility status", async () => {
    render(<App />);
    expect(screen.getAllByText("Codex Styler").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Themes" })).toBeInTheDocument();
    expect(
      screen.getAllByText("Compatibility not verified").length,
    ).toBeGreaterThan(0);
  });

  it("asks before quitting an existing Codex session", async () => {
    render(<App />);
    expect(
      await screen.findByText("Codex is already running"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restart and apply" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restart and apply" }));
    expect(
      screen.getByRole("dialog", {
        name: "Restart Codex to apply this theme?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quit Codex and continue" }),
    ).toBeInTheDocument();
  });

  it("uses a language dropdown with system language first", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const language = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect(language.options[0]?.value).toBe("system");
    expect(language.options[0]?.textContent).toBe("Follow system language");
  });

  it("offers enhanced and conservative runtime strategies", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const strategy = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    expect([...strategy.options].map((option) => option.value)).toEqual([
      "enhanced",
      "conservative",
    ]);
    expect(strategy.value).toBe("enhanced");
  });

  it("exposes a native window drag region", () => {
    const { container } = render(<App />);
    expect(
      container.querySelector("[data-tauri-drag-region]"),
    ).toBeInTheDocument();
  });

  it("selects a theme from the entire theme row", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Selected: Nocturne Studio" }),
    );
    expect(screen.getAllByText("Nocturne Studio").length).toBeGreaterThan(0);
  });

  it("keeps companions independent and exposes draggable placement", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("button", { name: /Moss/ }));
    expect(
      screen.getByText("Drag the companion to place it"),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.scene-entity[data-draggable="true"]'),
    ).toBeInTheDocument();
  });

  it("makes editor layers and reset controls actionable", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.click(screen.getByRole("button", { name: "Surfaces" }));
    expect(screen.getByText("Contrast protected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));
    expect(screen.getByRole("menuitem", { name: /Moss/ })).toBeInTheDocument();
  });

  it("deletes a local theme after confirmation", async () => {
    const localTheme = structuredClone(builtinThemes[0]);
    localTheme.id = "local.theme-to-delete";
    localTheme.metadata.name = "Theme to delete";
    localTheme.locales.en.name = "Theme to delete";
    localStorage.setItem(
      "codex-styler.local-themes.v1",
      JSON.stringify([localTheme]),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^My Themes/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Delete theme: Theme to delete" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete theme" }));
    await waitFor(() =>
      expect(screen.queryByText("Theme to delete")).not.toBeInTheDocument(),
    );
  });
});
