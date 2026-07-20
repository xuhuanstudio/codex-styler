import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { builtinCompanions, builtinThemes } from "@codex-styler/theme-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createCompanionProject } from "./features/companion-creator/model";
import {
  deleteCompanionProject,
  listCompanionProjects,
} from "./features/companion-creator/project-files";
import {
  applyConfiguration,
  checkForUpdates,
  chooseCodexInstallPath,
  detectCodex,
  downloadAndInstallUpdate,
  getRuntimeStatus,
  launchCodex,
  pauseTheme,
  quitCodex,
  restoreOfficial,
  restartApp,
  updateCompanionConfiguration,
  updateRuntimeExperience,
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
    updateRuntimeExperience: vi.fn(),
    chooseCodexInstallPath: vi.fn(),
    launchCodex: vi.fn(),
    pauseTheme: vi.fn(),
    quitCodex: vi.fn(),
    restoreOfficial: vi.fn(),
    checkForUpdates: vi.fn().mockResolvedValue({
      currentVersion: "0.2.0-beta.2",
      update: null,
    }),
    downloadAndInstallUpdate: vi.fn(),
    restartApp: vi.fn(),
    validateCodexInstallPath: vi.fn(),
  };
});

vi.mock("./features/companion-creator/project-files", () => ({
  listCompanionProjects: vi.fn().mockResolvedValue([]),
  deleteCompanionProject: vi.fn().mockResolvedValue(undefined),
}));

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
    vi.mocked(updateRuntimeExperience).mockReset();
    vi.mocked(updateRuntimeExperience).mockResolvedValue(appliedRuntime);
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
    vi.mocked(pauseTheme).mockReset();
    vi.mocked(pauseTheme).mockResolvedValue({
      ...appliedRuntime,
      state: "paused",
    });
    vi.mocked(restoreOfficial).mockReset();
    vi.mocked(restoreOfficial).mockResolvedValue(disconnectedRuntime);
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
    vi.mocked(listCompanionProjects).mockReset();
    vi.mocked(listCompanionProjects).mockResolvedValue([]);
    vi.mocked(deleteCompanionProject).mockReset();
    vi.mocked(deleteCompanionProject).mockResolvedValue(undefined);
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
      screen.getByRole("button", { name: "Interactions" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Verified when applied").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByText(
        "Use the setup bar below when you are ready to apply.",
      ),
    ).not.toBeInTheDocument();
    const decorativePreview = document.querySelector(".workspace-preview");
    expect(decorativePreview).toHaveAttribute("aria-hidden", "true");
    expect(decorativePreview).toHaveAttribute("inert");
    const main = document.querySelector(".app-main");
    const viewport = document.querySelector(".app-main__viewport");
    const configurationDock = document.querySelector(".configuration-dock");
    expect(main).toHaveAttribute("data-has-configuration-dock", "true");
    expect(viewport?.parentElement).toBe(main);
    expect(configurationDock?.parentElement).toBe(main);
    expect(configurationDock?.previousElementSibling).toBe(viewport);
  });

  it("keeps composer interactions as a dedicated, persistent selection", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Interactions" }));

    expect(
      screen.getByRole("heading", { name: "Interactions", level: 1 }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Orbit Recipe/ }));

    expect(
      screen.getByRole("option", { name: /Orbit Recipe/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      JSON.parse(localStorage.getItem("codex-styler.settings.v1") ?? "{}")
        .composerInteractionMode,
    ).toBe("marbles");
  });

  it("restores the selected interaction after reconnecting without reapplying the theme", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ...appliedRuntime,
      state: "connected",
      revision: 7,
    });
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        themeVariant: "dark",
        companionMode: "theme-default",
        composerInteractionMode: "toss",
        reduceMotion: false,
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );

    render(<App />);

    await waitFor(() => expect(updateRuntimeExperience).toHaveBeenCalledOnce());
    expect(vi.mocked(updateRuntimeExperience).mock.calls[0]).toEqual([
      {
        composerInteractionMode: "toss",
        locale: "en",
        reduceMotion: false,
      },
      8,
    ]);
    expect(applyConfiguration).not.toHaveBeenCalled();
  });

  it("uses the persistent setup bar instead of redundant selection toasts", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Preview: Gilded Grandeur" }),
    );
    expect(screen.queryByText("Theme selected")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Current setup" })).getByText(
        "Gilded Grandeur",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("button", { name: /Moss/ }));
    expect(screen.queryByText("Companion selected")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Current setup" })).getByText(
        "Moss",
      ),
    ).toBeInTheDocument();
  });

  it("browses another theme collection without silently changing the setup", () => {
    const localTheme = structuredClone(builtinThemes[0]);
    localTheme.id = "local.library-preview";
    localTheme.locales.en = {
      name: "Library Preview",
      description: "A local theme shown without applying it.",
    };
    localStorage.setItem(
      "codex-styler.local-themes.v1",
      JSON.stringify([localTheme]),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("tab", { name: /My themes/i }));

    expect(screen.getAllByText("Library Preview").length).toBeGreaterThan(0);
    expect(
      within(screen.getByRole("region", { name: "Current setup" })).getByText(
        "Native Refined",
      ),
    ).toBeVisible();
  });

  it("previews another companion collection without replacing the selection", () => {
    const localCompanion = structuredClone(builtinCompanions[0]);
    localCompanion.id = "local.companion-preview";
    localCompanion.name = "Orbit Fox";
    localCompanion.locales.en = {
      name: "Orbit Fox",
      description: "A local companion shown without applying it.",
    };
    localStorage.setItem(
      "codex-styler.local-companions.v1",
      JSON.stringify([localCompanion]),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("tab", { name: /My companions/i }));

    expect(screen.getAllByText("Orbit Fox").length).toBeGreaterThan(0);
    expect(
      within(screen.getByRole("region", { name: "Current setup" })).getByText(
        "Moss",
      ),
    ).toBeVisible();
  });

  it("routes a missing Codex installation to location settings", async () => {
    vi.mocked(detectCodex).mockResolvedValue({
      installed: false,
      running: false,
      path: null,
      version: null,
      platform: "windows",
    });

    render(<App />);

    expect(await screen.findByText("Codex not found")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Review Codex location" }),
    );
    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("finishes first-run setup by applying the reviewed configuration", async () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        reduceMotion: false,
        automaticUpdateChecks: false,
        skippedUpdateVersion: null,
        lastUpdateCheckAt: null,
        onboardingComplete: false,
      }),
    );
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });

    render(<App />);
    const safetyDialog = await screen.findByRole("dialog", {
      name: "A reversible connection, not an app modification.",
    });
    await screen.findByText("Codex Desktop detected");
    fireEvent.click(
      within(safetyDialog).getByRole("button", { name: "Continue" }),
    );

    const styleDialog = screen.getByRole("dialog", {
      name: "Start with a complete visual direction.",
    });
    fireEvent.click(
      within(styleDialog).getByRole("button", { name: "Continue" }),
    );

    const reviewDialog = screen.getByRole("dialog", {
      name: "Your first setup is ready.",
    });
    fireEvent.click(
      within(reviewDialog).getByRole("button", { name: "Start and apply" }),
    );

    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("codex-styler.settings.v1") ?? "{}")
        .onboardingComplete,
    ).toBe(true);
  });

  it("preserves the current companion when the setup guide is revisited", async () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("codex-styler.settings.v1") ?? "{}"),
        companionMode: "custom",
        companionId: "token-thief",
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Review setup guide" }));

    const safetyDialog = await screen.findByRole("dialog", {
      name: "A reversible connection, not an app modification.",
    });
    await screen.findByText("Codex Desktop detected");
    fireEvent.click(
      within(safetyDialog).getByRole("button", { name: "Continue" }),
    );

    const styleDialog = screen.getByRole("dialog", {
      name: "Start with a complete visual direction.",
    });
    const currentCompanion = within(styleDialog).getByRole("button", {
      name: /Token ThiefCurrent selection/,
    });
    expect(currentCompanion).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(
      within(styleDialog).getByRole("button", { name: "Continue" }),
    );

    const reviewDialog = screen.getByRole("dialog", {
      name: "Review your selected setup.",
    });
    expect(within(reviewDialog).getByText("Token Thief")).toBeVisible();
  });

  it("waits for installation detection before advancing first-run setup", async () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        reduceMotion: false,
        automaticUpdateChecks: false,
        skippedUpdateVersion: null,
        lastUpdateCheckAt: null,
        onboardingComplete: false,
      }),
    );
    const detection = deferred<Awaited<ReturnType<typeof detectCodex>>>();
    vi.mocked(detectCodex).mockReturnValue(detection.promise);

    render(<App />);
    const dialog = await screen.findByRole("dialog", {
      name: "A reversible connection, not an app modification.",
    });
    const continueButton = within(dialog).getByRole("button", {
      name: "Continue",
    });
    expect(continueButton).toBeDisabled();
    expect(
      within(dialog).getByText("Looking for Codex Desktop…"),
    ).toBeVisible();

    detection.resolve({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });

    await waitFor(() => expect(continueButton).toBeEnabled());
  });

  it("asks before quitting an existing Codex session", async () => {
    render(<App />);
    expect(await screen.findByText("Restart required")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restart Codex & apply" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Restart Codex & apply" }),
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));

    expect(
      await screen.findByRole("dialog", {
        name: "Restart Codex to apply this theme?",
      }),
    ).toBeInTheDocument();
    expect(applyConfiguration).not.toHaveBeenCalled();
  });

  it("uses honest theme editor apply labels and keeps the live result visible", async () => {
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ...appliedRuntime,
      state: "connected",
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));

    fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));
    const applied = await screen.findByRole("button", {
      name: "Applied to Codex",
    });
    expect(applied).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    fireEvent.click(screen.getByText("Fine tune"));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Workspace layout" }),
      { target: { value: "immersive" } },
    );
    expect(
      await screen.findByRole("button", { name: "Save & apply" }),
    ).toBeEnabled();
  });

  it("keeps theme apply failures visible inside focus mode", async () => {
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ...appliedRuntime,
      state: "connected",
    });
    vi.mocked(applyConfiguration).mockRejectedValueOnce(
      new Error(
        "Could not open the Codex debugging socket: connection refused",
      ),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));

    const failure = await screen.findByRole("alert");
    expect(
      within(failure).getByText("This theme needs attention"),
    ).toBeVisible();
    expect(
      within(failure).getByText(/temporary Codex connection was lost/i),
    ).toBeVisible();
    expect(
      within(failure).getByRole("button", { name: "Retry apply" }),
    ).toBeEnabled();
  });

  it("uses a language dropdown with system language first", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const language = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect(language.options[0]?.value).toBe("system");
    expect(language.options[0]?.textContent).toBe("Follow system language");
  });

  it("keeps all settings in the original compact continuous flow", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Language" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Manager appearance" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Runtime compatibility" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Automatically check for updates",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Diagnostics & compatibility" }),
    ).toBeVisible();
    expect(screen.queryByText("CODEX & COMPATIBILITY")).not.toBeInTheDocument();
  });

  it("keeps hidden import controls out of keyboard navigation", () => {
    const { container } = render(<App />);
    const fileInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs).toHaveLength(3);
    fileInputs.forEach((input) => {
      expect(input).toHaveAttribute("tabindex", "-1");
      expect(input).toHaveAttribute("aria-hidden", "true");
    });
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
    expect(screen.getByText("Codex Styler 0.2.0-beta.7")).toBeInTheDocument();
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

  it("restores the persisted applied theme as the initial selection", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    const nocturne = builtinThemes.find(
      (theme) => theme.metadata.name === "Nocturne Studio",
    )!;
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: nocturne.id,
        themeVariant: "dark",
        companionMode: "theme-default",
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );

    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));

    expect(
      screen.getByRole("button", { name: "Preview: Nocturne Studio" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("persists and applies a Codex light variant immediately when live", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        themeVariant: "dark",
        companionMode: "theme-default",
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Light" }));

    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledOnce());
    expect(vi.mocked(applyConfiguration).mock.calls[0]?.[0]).toMatchObject({
      variant: "light",
      reduceMotion: false,
    });
    expect(
      JSON.parse(localStorage.getItem("codex-styler.settings.v1") ?? "{}"),
    ).toMatchObject({ themeVariant: "light" });
  });

  it("reapplies live runtime compatibility and reduced-motion settings", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    vi.mocked(applyConfiguration).mockImplementation(async (configuration) => ({
      ...appliedRuntime,
      revision: configuration.revision,
    }));
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        themeVariant: "dark",
        companionMode: "theme-default",
        reduceMotion: false,
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const strategy = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(strategy, { target: { value: "conservative" } });
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledOnce());
    expect(vi.mocked(applyConfiguration).mock.calls[0]?.[0]).toMatchObject({
      runtimeStrategy: "conservative",
      reduceMotion: false,
    });

    fireEvent.click(screen.getByRole("switch", { name: "Reduce motion" }));
    await waitFor(() => expect(applyConfiguration).toHaveBeenCalledTimes(2));
    expect(vi.mocked(applyConfiguration).mock.calls[1]?.[0]).toMatchObject({
      runtimeStrategy: "conservative",
      reduceMotion: true,
    });
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

  it("invalidates a stale connected badge when Codex is reopened externally", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValueOnce(appliedRuntime);
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        themeVariant: "dark",
        companionMode: "theme-default",
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();

    vi.mocked(getRuntimeStatus).mockResolvedValue(disconnectedRuntime);
    fireEvent(window, new Event("focus"));

    expect(
      await screen.findByRole("button", { name: "Restart Codex & apply" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByText("Restart required")).toBeInTheDocument();
  });

  it("recovers from a refused debugging socket with the restart flow", async () => {
    vi.mocked(getRuntimeStatus)
      .mockResolvedValueOnce(appliedRuntime)
      .mockResolvedValueOnce(appliedRuntime)
      .mockResolvedValueOnce(disconnectedRuntime);
    vi.mocked(applyConfiguration).mockRejectedValueOnce(
      new Error(
        "Could not open the Codex debugging socket: IO error: Connection refused",
      ),
    );
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "en",
        appearance: "system",
        runtimeStrategy: "enhanced",
        appliedThemeId: builtinThemes[0].id,
        themeVariant: "dark",
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

    expect(
      await screen.findByRole("button", { name: "Restart Codex & apply" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Restart Codex & apply" }),
    );
    expect(
      screen.getByRole("dialog", {
        name: "Restart Codex to apply this theme?",
      }),
    ).toBeInTheDocument();
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
    expect(await screen.findByText("Restart required")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Restart Codex & apply" }),
    );
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

  it("explains a Microsoft Store identity failure in the selected language", async () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        locale: "zh-CN",
        appearance: "system",
        runtimeStrategy: "enhanced",
        reduceMotion: false,
        automaticUpdateChecks: false,
        onboardingComplete: true,
      }),
    );
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.0.0.0_x64__2p2nqsd0c76g0\\app\\Codex.exe",
      version: "26.0.0.0",
      platform: "windows",
    });
    vi.mocked(launchCodex).mockRejectedValue(
      new Error(
        "Codex could not be launched: The Microsoft Store installation could not be resolved to an application identity",
      ),
    );

    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "启动 Codex 并应用" }),
    );

    expect(
      await screen.findByText(/Windows 无法启动 Microsoft Store 版 Codex/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/could not be resolved to an application identity/),
    ).not.toBeInTheDocument();

    const locationAction = screen.getByRole("button", {
      name: "检查 Codex 位置",
    });
    fireEvent.click(locationAction);
    const locationSection = await screen.findByText("Codex 应用位置");
    await waitFor(() =>
      expect(locationSection.closest("section")).toHaveFocus(),
    );
  });

  it("routes an unknown runtime failure to focused local diagnostics", async () => {
    vi.mocked(detectCodex).mockResolvedValue({
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    });
    vi.mocked(launchCodex).mockRejectedValue(
      new Error("Codex could not be launched: unexpected desktop failure"),
    );

    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Codex & apply" }),
    );
    expect(
      await screen.findByText(/Open Diagnostics & compatibility/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open diagnostics" }));
    const diagnosticsHeading = await screen.findByRole("heading", {
      name: "Diagnostics & compatibility",
    });
    await waitFor(() =>
      expect(diagnosticsHeading.closest("section")).toHaveFocus(),
    );
  });

  it("rechecks the process after a target timeout and offers one restart", async () => {
    const stoppedDetection = {
      installed: true,
      running: false,
      path: "/Applications/ChatGPT.app",
      version: "26.707.72221",
      platform: "macos",
    };
    vi.mocked(detectCodex)
      .mockResolvedValueOnce(stoppedDetection)
      .mockResolvedValueOnce(stoppedDetection)
      .mockResolvedValue({ ...stoppedDetection, running: true });
    vi.mocked(launchCodex).mockRejectedValue(
      new Error(
        "Codex did not expose a trusted page target before the connection timeout",
      ),
    );

    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Codex & apply" }),
    );

    expect(
      await screen.findByRole("button", { name: "Restart Codex & apply" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Restart required")).toBeInTheDocument();
  });

  it("keeps a failed restore recoverable and prevents duplicate restore calls", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue(appliedRuntime);
    vi.mocked(restoreOfficial).mockRejectedValue(
      new Error("runtime restore failed unexpectedly"),
    );

    render(<App />);
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    const restore = screen.getByRole("button", { name: "Restore official" });
    fireEvent.click(restore);
    fireEvent.click(restore);

    expect(restoreOfficial).toHaveBeenCalledOnce();
    expect(
      await screen.findByText(/Could not restore the official interface/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open diagnostics" }),
    ).toBeInTheDocument();
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

  it("reports the theme visual personality without coupling it to a companion", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    const facts = container.querySelector(".theme-facts");
    expect(
      container.querySelector(".featured-theme__preview .workspace-preview"),
    ).toHaveClass("workspace-preview--compact");
    expect(facts).toHaveTextContent("CompositionNative rhythm · Balanced");
    expect(facts).toHaveTextContent("Icon treatmentContained");
    expect(facts).toHaveTextContent("Motion styleFluid");
    expect(facts).not.toHaveTextContent("Companion");
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
    fireEvent.change(screen.getByRole("slider", { name: "Companion size" }), {
      target: { value: "180" },
    });
    expect(document.querySelector(".scene-entity")).toHaveStyle({
      "--entity-size": "180px",
    });
    expect(
      screen.getByRole("button", { name: "Reset size & placement" }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Reset size & placement" }),
    );
    expect(document.querySelector(".scene-entity")).toHaveStyle({
      "--entity-size": "136px",
    });
    expect(
      screen.getByRole("button", { name: "Reset size & placement" }),
    ).toBeDisabled();
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
    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    expect(screen.getByText("Visual safety")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Visual safety"));
    expect(screen.getByText("Primary text")).toBeInTheDocument();
    expect(screen.getByText("Interface icons")).toBeInTheDocument();
    expect(screen.getByText("Status feedback")).toBeInTheDocument();
    expect(screen.getByText("Code changes")).toBeInTheDocument();
    expect(screen.getByText("Accent controls")).toBeInTheDocument();
    expect(screen.getByText("Component boundaries")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Revert to saved" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Editorial" }));
    const preview = container.querySelector(".workspace-preview");
    expect(preview).toHaveAttribute("data-layout", "editorial");
    expect(preview).toHaveAttribute("data-icon-style", "themed");
    expect(preview).toHaveAttribute("data-decorations", "subtle");
    fireEvent.click(screen.getByRole("button", { name: "Immersive" }));
    expect(preview).toHaveAttribute("data-layout", "immersive");
    expect(preview).toHaveAttribute("data-icon-style", "themed");
    expect(preview).toHaveAttribute("data-decorations", "expressive");
    fireEvent.click(screen.getByRole("button", { name: "Undo theme change" }));
    expect(preview).toHaveAttribute("data-layout", "editorial");
    expect(preview).toHaveAttribute("data-icon-style", "themed");
    expect(preview).toHaveAttribute("data-decorations", "subtle");
    fireEvent.click(screen.getByRole("button", { name: "Undo theme change" }));
    expect(preview).toHaveAttribute("data-layout", "native");
    expect(preview).toHaveAttribute("data-icon-style", "native");
    expect(preview).toHaveAttribute("data-decorations", "none");
    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));
    expect(
      screen.getByRole("menuitem", { name: "Gradient layer" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Gradient layer" }));
    expect(
      screen.getByRole("button", { name: "Gradient layer 2" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Motion" }));
    expect(
      screen.getByRole("button", { name: /Expressive/ }),
    ).toBeInTheDocument();
  });

  it("explains which Codex views each theme section affects", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));

    expect(
      screen.getByRole("region", { name: "Live effect mapped" }),
    ).toHaveTextContent("8 preview views");
    expect(
      container.querySelector('[data-theme-control="background.brightness"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    expect(
      screen.getByRole("region", { name: "Enhanced mode effect" }),
    ).toHaveTextContent(
      "Panels, controls, selected and disabled states, status feedback, diffs, icons, and layout update together",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview on Components & states" }),
    );
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-preview-scenario",
      "components",
    );
    expect(
      container.querySelector(".workspace-component-grid"),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-theme-control="surfaces.layout"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-theme-control="surfaces.treatment"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-theme-control="surfaces.material"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-theme-control="surfaces.focus-opacity"]'),
    ).toBeInTheDocument();
    const harmony = container.querySelector(
      '[data-theme-control="surfaces.color-harmony"]',
    );
    expect(harmony).toHaveTextContent("Automatic");
    expect(harmony).toHaveTextContent("Tonal harmony");
    expect(harmony).toHaveTextContent("Clear hierarchy");
    const preview = container.querySelector(
      ".workspace-preview",
    ) as HTMLElement;
    const automaticBorder = preview.style.getPropertyValue(
      "--preview-border-strong",
    );
    const clearHierarchy = screen.getByRole("button", {
      name: /Clear hierarchy/,
    });
    fireEvent.click(clearHierarchy);
    expect(clearHierarchy).toHaveAttribute("aria-pressed", "true");
    expect(preview.style.getPropertyValue("--preview-border-strong")).not.toBe(
      automaticBorder,
    );

    const frostedMaterial = screen.getByRole("button", { name: "Frosted" });
    fireEvent.click(frostedMaterial);
    expect(frostedMaterial).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("slider", { name: /Focused panel opacity/ }),
    ).toHaveValue("0.92");
    expect(screen.getByRole("slider", { name: /Glass blur/ })).toHaveValue(
      "20",
    );
    expect(container.querySelector(".workspace-preview")).toHaveStyle({
      "--preview-focus-blur": "20px",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Recommended pairing" }),
    );
    expect(
      screen.getByRole("region", { name: "Recommendation only" }),
    ).toHaveTextContent("without replacing the current companion");
    expect(
      screen.queryByRole("button", { name: /Preview on/ }),
    ).not.toBeInTheDocument();
  });

  it("uses a reversible list-to-detail flow for compact theme properties", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));

    const appearance = screen.getByRole("button", { name: "Appearance" });
    const editorLayout = container.querySelector(".editor-layout");
    expect(appearance).toHaveAttribute("aria-expanded", "false");
    expect(editorLayout).not.toHaveClass("editor-layout--inspector-open");

    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    expect(appearance).toHaveAttribute("aria-expanded", "true");
    expect(editorLayout).toHaveClass("editor-layout--inspector-open");

    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(appearance).toHaveAttribute("aria-expanded", "false");
    expect(editorLayout).not.toHaveClass("editor-layout--inspector-open");
    expect(appearance).toHaveFocus();
  });

  it("compares the current theme edit with the saved version without changing the draft", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));

    const savedPreview = screen.getByRole("button", { name: "Saved" });
    expect(savedPreview).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    fireEvent.click(screen.getByText("Fine tune"));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Workspace layout" }),
      { target: { value: "immersive" } },
    );
    expect(savedPreview).toBeEnabled();
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "immersive",
    );

    fireEvent.click(savedPreview);
    expect(container.querySelector(".canvas-stage")).toHaveAttribute(
      "data-preview-version",
      "saved",
    );
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "native",
    );
    expect(screen.getByText("Saved preview")).toBeInTheDocument();
    expect(container.querySelector(".inspector")).toHaveClass(
      "inspector--preview-saved",
    );
    expect(container.querySelector(".inspector-content")).toHaveAttribute(
      "inert",
    );

    fireEvent.click(screen.getByRole("button", { name: "Return" }));
    await waitFor(() =>
      expect(container.querySelector(".canvas-stage")).toHaveAttribute(
        "data-preview-version",
        "current",
      ),
    );
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "immersive",
    );
    expect(container.querySelector(".inspector-content")).not.toHaveAttribute(
      "inert",
    );

    const versionControl = container.querySelector(".canvas-version-control");
    expect(versionControl).not.toBeNull();
    fireEvent.click(
      within(versionControl as HTMLElement).getByRole("button", {
        name: "Official",
      }),
    );
    expect(container.querySelector(".canvas-stage")).toHaveAttribute(
      "data-preview-version",
      "official",
    );
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-preview-presentation",
      "official",
    );
    expect(screen.getByText("Official Codex reference")).toBeInTheDocument();
    expect(container.querySelector(".inspector-content")).toHaveAttribute(
      "inert",
    );

    fireEvent.click(screen.getByRole("button", { name: "Return" }));
    expect(container.querySelector(".canvas-stage")).toHaveAttribute(
      "data-preview-version",
      "current",
    );
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-preview-presentation",
      "styled",
    );

    fireEvent.click(savedPreview);
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    expect(container.querySelector(".canvas-stage")).toHaveAttribute(
      "data-preview-version",
      "current",
    );
  });

  it("undoes and redoes theme edits from buttons and keyboard shortcuts", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    fireEvent.click(screen.getByText("Fine tune"));

    const layout = screen.getByRole("combobox", { name: "Workspace layout" });
    const undo = screen.getByRole("button", { name: "Undo theme change" });
    const redo = screen.getByRole("button", { name: "Redo theme change" });
    const saveDraft = screen.getByRole("button", { name: "Save draft" });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();
    expect(saveDraft).toBeDisabled();
    expect(saveDraft).toHaveAttribute("data-dirty", "false");

    fireEvent.change(layout, { target: { value: "immersive" } });
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "immersive",
    );
    expect(undo).toBeEnabled();
    expect(saveDraft).toBeEnabled();
    expect(saveDraft).toHaveAttribute("data-dirty", "true");

    fireEvent.click(undo);
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "native",
    );
    expect(screen.getByText("Theme change undone")).toBeInTheDocument();
    expect(redo).toBeEnabled();

    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "immersive",
    );

    fireEvent.click(saveDraft);
    await waitFor(() =>
      expect(screen.getByText("All changes saved")).toBeInTheDocument(),
    );
    expect(saveDraft).toBeDisabled();
    expect(saveDraft).toHaveAttribute("data-dirty", "false");
    expect(undo).toBeEnabled();

    fireEvent.keyDown(window, { key: "z", metaKey: true });
    expect(container.querySelector(".workspace-preview")).toHaveAttribute(
      "data-layout",
      "native",
    );
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(saveDraft).toBeEnabled();
    expect(saveDraft).toHaveAttribute("data-dirty", "true");
  });

  it("protects unsaved theme edits when leaving the editor", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    fireEvent.click(screen.getByText("Fine tune"));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Workspace layout" }),
      { target: { value: "immersive" } },
    );

    const homeNavigation = screen.getByRole("button", { name: "Home" });
    homeNavigation.focus();
    fireEvent.click(homeNavigation);
    expect(
      screen.getByRole("dialog", { name: "Save this theme before leaving?" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", {
        name: "Save this theme before leaving?",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Untitled Theme" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(homeNavigation).toHaveFocus());

    fireEvent.click(homeNavigation);
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("heading", { name: "Untitled Theme" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(homeNavigation).toHaveFocus());

    fireEvent.click(homeNavigation);
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(
      screen.getByRole("heading", {
        name: "Your Codex, composed in one place.",
      }),
    ).toBeInTheDocument();
  });

  it("saves an edited theme before completing navigation", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Interface system" }));
    fireEvent.click(screen.getByText("Fine tune"));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Workspace layout" }),
      { target: { value: "immersive" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Save and leave" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Settings" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("dialog", {
        name: "Save this theme before leaving?",
      }),
    ).not.toBeInTheDocument();
  });

  it("resizes editor panels with the keyboard and keeps recommendations independent", async () => {
    localStorage.setItem(
      "codex-styler.settings.v1",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("codex-styler.settings.v1") ?? "{}"),
        companionMode: "custom",
        companionId: "moss-gecko",
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    fireEvent.click(screen.getByRole("button", { name: "New theme" }));
    fireEvent.click(screen.getByRole("button", { name: /Start blank/ }));

    const layersSeparator = await screen.findByRole("separator", {
      name: "Scene layers",
    });
    expect(layersSeparator).toHaveAttribute("aria-valuenow", "220");
    fireEvent.keyDown(layersSeparator, { key: "ArrowRight" });
    expect(layersSeparator).toHaveAttribute("aria-valuenow", "228");

    expect(screen.getByLabelText("Moss")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Recommended pairing" }),
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Recommended pairing" }),
      { target: { value: "pico-parrot" } },
    );
    expect(screen.getByLabelText("Moss")).toBeInTheDocument();
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

  it("compares a styled theme with an uncluttered official baseline", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));
    const previewControls = screen.getByRole("button", {
      name: "Task & composer",
    });
    expect(previewControls).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(previewControls);
    expect(previewControls).toHaveAttribute("aria-expanded", "true");

    const comparison = screen.getByRole("group", {
      name: "Compare appearance",
    });
    const styled = within(comparison).getByRole("button", { name: "Styled" });
    const official = within(comparison).getByRole("button", {
      name: "Official",
    });
    const preview = document.querySelector(
      ".featured-theme__preview .workspace-preview",
    );

    expect(styled).toHaveAttribute("aria-pressed", "true");
    expect(preview).toHaveAttribute("data-preview-presentation", "styled");

    fireEvent.click(official);
    expect(official).toHaveAttribute("aria-pressed", "true");
    expect(preview).toHaveAttribute("data-preview-presentation", "official");
    expect(preview).toHaveAttribute("data-layout", "native");
    expect(
      document.querySelector(".featured-theme__preview .workspace-entity"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Task & composer" }));
    fireEvent.click(styled);
    expect(preview).toHaveAttribute("data-preview-presentation", "styled");
  });

  it("previews representative Codex surfaces before applying a theme", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Themes" }));

    const preview = document.querySelector(
      ".featured-theme__preview .workspace-preview",
    );

    expect(preview).toHaveAttribute("data-preview-scenario", "task");
    fireEvent.click(screen.getByRole("button", { name: "Task & composer" }));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Preview scenario" }),
      { target: { value: "settings" } },
    );
    expect(preview).toHaveAttribute("data-preview-scenario", "settings");

    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".theme-preview-controls__trigger",
      ) as HTMLButtonElement,
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Preview scenario" }),
      { target: { value: "dialog" } },
    );
    expect(preview).toHaveAttribute("data-preview-scenario", "dialog");

    const controlsEffect = screen.getByRole("button", {
      name: "Inspect this effect: Controls",
    });
    fireEvent.click(controlsEffect);
    expect(preview).toHaveAttribute("data-preview-scenario", "components");
    expect(
      screen.getByRole("button", { name: "Components & states" }),
    ).toHaveAttribute("aria-expanded", "false");
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
      screen.getByRole("button", { name: "More actions: Theme to delete" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete theme" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete theme" }));
    await waitFor(() =>
      expect(screen.queryByText("Theme to delete")).not.toBeInTheDocument(),
    );
  });

  it("explains creator draft progress and confirms destructive deletion", async () => {
    const project = createCompanionProject("local-draft-to-delete");
    project.name = "Orbit fox";
    project.step = "cleanup";
    project.updatedAt = "2026-07-19T02:30:00.000Z";
    project.frames = [
      {
        id: "frame-1",
        sourceIndex: 0,
        excluded: false,
        visualDelta: 0,
        baselineOffset: { x: 0, y: 0 },
      },
    ];
    vi.mocked(listCompanionProjects).mockResolvedValue([project]);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Companions" }));
    fireEvent.click(screen.getByRole("tab", { name: /My Companions/ }));

    expect(
      await screen.findByRole("button", {
        name: /Continue draft: Orbit fox, Background cleanup, 3\/7/,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Delete draft: Orbit fox" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Delete this creator draft?" }),
    ).toHaveTextContent(
      "An installed companion with the same name will not be deleted.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteCompanionProject).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete draft: Orbit fox" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete draft" }));

    await waitFor(() =>
      expect(deleteCompanionProject).toHaveBeenCalledWith(
        "local-draft-to-delete",
      ),
    );
    expect(
      screen.queryByRole("button", {
        name: /Continue draft: Orbit fox/,
      }),
    ).not.toBeInTheDocument();
  });
});
