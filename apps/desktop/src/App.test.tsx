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
  checkForUpdates,
  chooseCodexInstallPath,
  detectCodex,
  downloadAndInstallUpdate,
  getRuntimeStatus,
  launchCodex,
  quitCodex,
  restartApp,
  validateCodexInstallPath,
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

const appliedRuntime: RuntimeStatus = {
  state: "applied",
  connected: true,
  startedByStyler: true,
  port: 43123,
  codexVersion: "26.707.72221",
  compatibility: "supported",
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
    chooseCodexInstallPath: vi.fn(),
    launchCodex: vi.fn(),
    quitCodex: vi.fn(),
    checkForUpdates: vi.fn().mockResolvedValue({
      currentVersion: "0.1.0-alpha.9",
      update: null,
    }),
    downloadAndInstallUpdate: vi.fn(),
    restartApp: vi.fn(),
    validateCodexInstallPath: vi.fn(),
  };
});

describe("Codex Styler shell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(detectCodex).mockReset();
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: true,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });
    vi.mocked(getRuntimeStatus).mockReset();
    vi.mocked(getRuntimeStatus).mockResolvedValue(disconnectedRuntime);
    vi.mocked(applyTheme).mockReset();
    vi.mocked(applyTheme).mockResolvedValue(appliedRuntime);
    vi.mocked(launchCodex).mockReset();
    vi.mocked(launchCodex).mockResolvedValue({
      ...appliedRuntime,
      state: "connected",
    });
    vi.mocked(quitCodex).mockReset();
    vi.mocked(quitCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });
    vi.mocked(chooseCodexInstallPath).mockReset();
    vi.mocked(chooseCodexInstallPath).mockResolvedValue(null);
    vi.mocked(validateCodexInstallPath).mockReset();
    vi.mocked(validateCodexInstallPath).mockResolvedValue(true);
    vi.mocked(checkForUpdates).mockReset();
    vi.mocked(checkForUpdates).mockResolvedValue({
      currentVersion: "0.1.0-alpha.9",
      update: null,
    });
    vi.mocked(downloadAndInstallUpdate).mockReset();
    vi.mocked(restartApp).mockReset();
    localStorage.clear();
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "auto",
        reduceMotion: false,
        automaticUpdateChecks: false,
        skippedUpdateVersion: null,
        lastUpdateCheckAt: null,
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

  it("keeps automatic detection primary and saves a validated fallback path", async () => {
    vi.mocked(chooseCodexInstallPath).mockResolvedValue(
      "/Applications/ChatGPT.app",
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(await screen.findByText("Automatically detected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose application" }));
    await waitFor(() =>
      expect(validateCodexInstallPath).toHaveBeenCalledWith(
        "/Applications/ChatGPT.app",
      ),
    );
    await waitFor(() =>
      expect(detectCodex).toHaveBeenCalledWith("/Applications/ChatGPT.app"),
    );
    expect(await screen.findByText("Custom fallback")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use automatic detection" }),
    ).toBeInTheDocument();
  });

  it("checks for updates from settings and reports the current version", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Codex Styler 0.1.0-alpha.9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Check for updates" }));
    await waitFor(() => expect(checkForUpdates).toHaveBeenCalledOnce());
    expect(await screen.findByText("You’re up to date")).toBeInTheDocument();
  });

  it("downloads, installs, and restarts from the update dialog", async () => {
    vi.mocked(checkForUpdates).mockResolvedValue({
      currentVersion: "0.1.0-alpha.9",
      update: {
        version: "0.1.0-alpha.9",
        notes: "A safer updater and corrected companion thumbnails.",
        publishedAt: "2026-07-17T08:00:00Z",
        prerelease: true,
      },
    });
    vi.mocked(downloadAndInstallUpdate).mockImplementation(async (onEvent) => {
      onEvent({ event: "Started", data: { contentLength: 100 } });
      onEvent({ event: "Progress", data: { chunkLength: 100 } });
      onEvent({ event: "Finished" });
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Check for updates" }));
    expect(
      await screen.findByRole("dialog", {
        name: "Codex Styler 0.1.0-alpha.9",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Download and install" }),
    );
    await waitFor(() =>
      expect(downloadAndInstallUpdate).toHaveBeenCalledOnce(),
    );
    await waitFor(() => expect(restartApp).toHaveBeenCalledOnce());
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
      screen.getByRole("button", { name: "Preview: Nocturne Studio" }),
    );
    expect(screen.getAllByText("Nocturne Studio").length).toBeGreaterThan(0);
  });

  it("applies a theme row immediately when Codex is live", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        companionMode: "theme-default",
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Nocturne Studio" }),
    );
    await waitFor(() => expect(applyTheme).toHaveBeenCalledOnce());
    expect((await screen.findAllByText("Live in Codex")).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("button", { name: "Apply to Codex" }),
    ).not.toBeInTheDocument();
  });

  it("applies a companion immediately without restarting live Codex", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        companionMode: "theme-default",
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("button", { name: /Pico/ }));
    await waitFor(() => expect(applyTheme).toHaveBeenCalledOnce());
    const appliedTheme = vi.mocked(applyTheme).mock.calls[0]?.[0];
    expect(appliedTheme?.scene.entities[0]?.id).toBe("pico-parrot");
    expect(quitCodex).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Companion applied to Codex"),
    ).toBeInTheDocument();
  });

  it("finishes the confirmed restart flow after Codex closes", async () => {
    vi.mocked(detectCodex)
      .mockResolvedValueOnce({
        installed: true,
        running: true,
        path: "/Applications/ChatGPT.app",
        version: "26.707.72221",
        platform: "macos",
      })
      .mockResolvedValue({
        installed: true,
        running: false,
        path: "/Applications/ChatGPT.app",
        version: "26.707.72221",
        platform: "macos",
      });
    render(<App />);
    expect(
      await screen.findByText("Codex is already running"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restart and apply" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Quit Codex and continue" }),
    );
    await waitFor(() => expect(quitCodex).toHaveBeenCalledOnce());
    await waitFor(() => expect(launchCodex).toHaveBeenCalledOnce());
    await waitFor(() => expect(applyTheme).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole("dialog", {
        name: "Restart Codex to apply this theme?",
      }),
    ).not.toBeInTheDocument();
  });

  it("ships the gilded and circus themes with their signature companions", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Gilded Grandeur" }),
    );
    expect(screen.getByLabelText("Reset God")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Merry Big Top" }),
    );
    expect(screen.getByLabelText("Token Thief")).toBeInTheDocument();
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

  it("clips companion thumbnails to exactly one atlas frame", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    const pico = screen.getByRole("button", { name: /Pico/ });
    const viewport = pico.querySelector(".companion-option__visual--sprite");
    const frame = pico.querySelector<HTMLElement>(".companion-option__frame");
    expect(viewport).toContainElement(frame);
    expect(frame?.style.backgroundImage).toContain("pico-parrot-atlas");
    expect(Number.parseFloat(frame?.style.width ?? "0")).toBeLessThanOrEqual(
      64,
    );
    expect(Number.parseFloat(frame?.style.height ?? "0")).toBeLessThanOrEqual(
      64,
    );
  });

  it("uses each refined theme's default companion until the user disables it", () => {
    render(<App />);
    expect(document.querySelector(".scene-entity")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("button", { name: /No companion/ }));
    expect(document.querySelector(".scene-entity")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Nocturne Studio" }),
    );
    expect(document.querySelector(".scene-entity")).not.toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: /Expressive/ }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: /Create from image/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start blank/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Use existing theme/ }),
    ).toBeInTheDocument();
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
