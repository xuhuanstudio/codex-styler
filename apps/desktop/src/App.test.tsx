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
  applyConfiguration,
  checkForUpdates,
  chooseCodexInstallPath,
  detectCodex,
  downloadAndInstallUpdate,
  getRuntimeStatus,
  launchCodex,
  quitCodex,
  restartApp,
  updateCompanionConfiguration,
  validateCodexInstallPath,
  type RuntimeStatus,
} from "./lib/runtime";

const disconnectedRuntime: RuntimeStatus = {
  state: "disconnected",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
  revision: 0,
};

const appliedRuntime: RuntimeStatus = {
  state: "applied",
  connected: true,
  startedByStyler: true,
  port: 43123,
  codexVersion: "26.707.72221",
  compatibility: "supported",
  message: null,
  revision: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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
      state: "disconnected",
      connected: false,
      startedByStyler: false,
      port: null,
      codexVersion: null,
      compatibility: "safe",
      message: null,
      revision: 0,
    }),
    applyConfiguration: vi.fn(),
    updateCompanionConfiguration: vi.fn(),
    chooseCodexInstallPath: vi.fn(),
    launchCodex: vi.fn(),
    quitCodex: vi.fn(),
    checkForUpdates: vi.fn().mockResolvedValue({
      currentVersion: "0.2.0-beta.2",
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
    vi.mocked(applyConfiguration).mockReset();
    vi.mocked(applyConfiguration).mockResolvedValue(appliedRuntime);
    vi.mocked(updateCompanionConfiguration).mockReset();
    vi.mocked(updateCompanionConfiguration).mockResolvedValue(appliedRuntime);
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
      currentVersion: "0.2.0-beta.2",
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
    expect(applyConfiguration).not.toHaveBeenCalled();
  });

  it("uses a language dropdown with system language first", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const language = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect(language.options[0]?.value).toBe("system");
    expect(language.options[0]?.textContent).toBe("Follow system language");
  });

  it("requests update notes in the selected application language", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const language = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(language, { target: { value: "zh-CN" } });
    fireEvent.click(screen.getByRole("button", { name: "检查更新" }));
    await waitFor(() => expect(checkForUpdates).toHaveBeenCalledWith("zh-CN"));
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
    expect(
      await screen.findByText("Automatically detected"),
    ).toBeInTheDocument();
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
    expect(screen.getByText("Codex Styler 0.2.0-beta.2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Check for updates" }));
    await waitFor(() => expect(checkForUpdates).toHaveBeenCalledWith("en"));
    expect(await screen.findByText("You’re up to date")).toBeInTheDocument();
  });

  it("downloads, installs, and restarts from the update dialog", async () => {
    vi.mocked(checkForUpdates).mockResolvedValue({
      currentVersion: "0.2.0-beta.2",
      update: {
        version: "0.2.0-beta.2",
        notes: "A safer updater and corrected companion thumbnails.",
        releaseNotes: {
          locale: "en",
          summary: "A more reliable Companion Studio.",
          highlights: ["Localized update details before download."],
          fixes: ["Corrected companion portrait slicing."],
        },
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
        name: "Codex Styler 0.2.0-beta.2",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A more reliable Companion Studio."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("A safer updater and corrected companion thumbnails."),
    ).not.toBeInTheDocument();
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
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledOnce());
    expect(
      (await screen.findAllByText("Live in Codex")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Apply to Codex" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the newest theme when rapid live selections resolve out of order", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    const first = deferred<RuntimeStatus>();
    const second = deferred<RuntimeStatus>();
    vi.mocked(applyConfiguration)
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
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
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledOnce());
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Quiet Garden" }),
    );
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledTimes(2));
    second.resolve({ ...appliedRuntime, revision: 2 });
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Preview: Quiet Garden",
        }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    first.resolve({ ...appliedRuntime, revision: 1 });
    await Promise.resolve();
    expect(
      screen.getByRole("button", { name: "Preview: Quiet Garden" }),
    ).toHaveAttribute("aria-pressed", "true");
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
    await waitFor(() =>
      expect(updateCompanionConfiguration).toHaveBeenCalledOnce(),
    );
    const appliedConfiguration = vi.mocked(updateCompanionConfiguration).mock
      .calls[0]?.[0];
    expect(appliedConfiguration?.companion?.entity.id).toBe("pico-parrot");
    expect(applyConfiguration).not.toHaveBeenCalled();
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
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledOnce());
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

  it("uses independent portraits instead of decoding atlases in the list", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    const pico = screen.getByRole("button", { name: /Pico/ });
    const viewport = pico.querySelector(".companion-option__visual--sprite");
    const frame = pico.querySelector<HTMLElement>(".companion-option__frame");
    expect(viewport).toContainElement(frame);
    expect(frame).toHaveAttribute("data-preview-source", "portrait");
    expect(frame?.style.backgroundImage).toContain("pico-parrot-portrait.webp");
    expect(frame?.style.backgroundImage).not.toContain("pico-parrot-atlas");
    expect(frame?.style.width).toBe("64px");
    expect(frame?.style.height).toBe("64px");
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
