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
import {
  applyTheme,
  getRuntimeStatus,
  type RuntimeStatus,
} from "./lib/runtime";

const disconnectedRuntime: RuntimeStatus = {
  state: "idle",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
};

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
    getRuntimeStatus: vi.fn().mockResolvedValue({
      state: "idle",
      connected: false,
      startedByStyler: false,
      port: null,
      codexVersion: null,
      compatibility: "safe",
      message: null,
    }),
    applyTheme: vi.fn(),
  };
});

describe("Codex Styler shell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(getRuntimeStatus).mockReset();
    vi.mocked(getRuntimeStatus).mockResolvedValue(disconnectedRuntime);
    vi.mocked(applyTheme).mockReset();
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
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Themes" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create" }),
    ).not.toBeInTheDocument();
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

  it("rechecks backend connection state before applying an edited theme", async () => {
    vi.mocked(getRuntimeStatus)
      .mockResolvedValueOnce({
        ...disconnectedRuntime,
        state: "connected",
        connected: true,
        startedByStyler: true,
        port: 43123,
      })
      .mockResolvedValueOnce(disconnectedRuntime);
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    const applyButtons = screen.getAllByRole("button", {
      name: "Apply to Codex",
    });
    fireEvent.click(applyButtons.at(-1)!);

    expect(
      await screen.findByRole("dialog", {
        name: "Restart Codex to apply this theme?",
      }),
    ).toBeInTheDocument();
    expect(applyTheme).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
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
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Surfaces" }));
    expect(screen.getByText("Contrast protected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Workspace layout" }),
      { target: { value: "immersive" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Icon treatment" }), {
      target: { value: "themed" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Detail treatment" }),
      { target: { value: "expressive" } },
    );
    const preview = container.querySelector(".workspace-preview");
    expect(preview).toHaveAttribute("data-layout", "immersive");
    expect(preview).toHaveAttribute("data-icon-style", "themed");
    expect(preview).toHaveAttribute("data-decorations", "expressive");
    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));
    expect(screen.getByRole("menuitem", { name: /Moss/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Motion" }));
    expect(screen.getByRole("button", { name: /Expressive/ })).toBeInTheDocument();
  });

  it("keeps theme creation inside the theme library", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    expect(screen.getByRole("tab", { name: /Built-in/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /My Themes/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    expect(
      screen.getByRole("dialog", { name: "How would you like to begin?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create from image/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start blank/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use existing theme/ })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("tab", { name: /^My Themes/ }));
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
