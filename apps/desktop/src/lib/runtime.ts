import { Channel, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  composeThemeWithCompanion,
  type CompanionDefinition,
  type CompanionOverrides,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import { prepareThemeForRuntime } from "./assets";
import type { RuntimeStrategy } from "./storage";

export interface CodexDetection {
  installed: boolean;
  running: boolean;
  path: string | null;
  version: string | null;
  platform: string;
}

export interface RuntimeStatus {
  state:
    | "disconnected"
    | "restart-required"
    | "launching"
    | "connected"
    | "applying"
    | "applied"
    | "fallback"
    | "paused"
    | "error";
  connected: boolean;
  startedByStyler: boolean;
  port: number | null;
  codexVersion: string | null;
  compatibility: "supported" | "safe" | "blocked";
  message: string | null;
  revision: number;
}

export interface AvailableUpdate {
  version: string;
  notes: string | null;
  releaseNotes: {
    locale: string;
    summary: string;
    highlights: string[];
    fixes: string[];
  } | null;
  publishedAt: string | null;
  prerelease: boolean;
}

export interface UpdateCheckResult {
  currentVersion: string;
  update: AvailableUpdate | null;
}

/** The user-facing configuration remains decomposed until runtime compilation. */
export interface AppliedConfiguration {
  theme: ThemeDefinition;
  companion: CompanionDefinition | null;
  companionOverrides?: CompanionOverrides;
  variant: "light" | "dark";
  runtimeStrategy: RuntimeStrategy;
  reduceMotion: boolean;
  revision: number;
}

export type UpdateDownloadEvent =
  | { event: "Started"; data: { contentLength: number | null } }
  | { event: "Progress"; data: { chunkLength: number } }
  | { event: "Finished" };

let browserStatus: RuntimeStatus = {
  state: "disconnected",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
  revision: 0,
};

function browserPreviewStatus(): RuntimeStatus | null {
  if (typeof window === "undefined") return null;
  const preview = browserPreviewMode();
  const message =
    preview === "windows-store"
      ? "Codex could not be launched: The Microsoft Store installation could not be resolved to an application identity"
      : preview === "permission"
        ? "Codex could not be launched: Access is denied (os error 5)"
        : preview === "connection"
          ? "Could not open the Codex debugging socket: Connection refused"
          : preview === "timeout"
            ? "Codex did not expose a trusted page target before the connection timeout"
            : preview === "unknown"
              ? "Codex could not be launched: An unexpected desktop error occurred"
              : null;
  return message
    ? {
        ...browserStatus,
        state: "error",
        connected: false,
        startedByStyler: false,
        port: null,
        compatibility: "safe",
        message,
      }
    : null;
}

function browserPreviewMode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("runtimePreview");
}

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function detectCodex(
  customPath?: string | null,
): Promise<CodexDetection> {
  if (!isTauri()) {
    const preview = browserPreviewMode();
    if (preview === "windows-store" || preview === "permission") {
      return {
        installed: true,
        running: false,
        path: "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.0.0.0_x64__2p2nqsd0c76g0\\app\\Codex.exe",
        version: "26.0.0.0",
        platform: "win32",
      };
    }
    return {
      installed: true,
      running: false,
      path: "/Applications/Codex.app",
      version: "Preview mode",
      platform: navigator.platform,
    };
  }
  return invoke<CodexDetection>("detect_codex", { customPath });
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  if (!isTauri()) return { ...(browserPreviewStatus() ?? browserStatus) };
  return invoke<RuntimeStatus>("runtime_status");
}

export async function launchCodex(
  customPath?: string | null,
): Promise<RuntimeStatus> {
  if (!isTauri()) {
    browserStatus = {
      ...browserStatus,
      state: "connected",
      connected: true,
      startedByStyler: true,
      port: 9229,
      message: "Browser preview connection",
    };
    return { ...browserStatus };
  }
  return invoke<RuntimeStatus>("launch_codex", { customPath });
}

export async function quitCodex(
  customPath?: string | null,
): Promise<CodexDetection> {
  if (!isTauri()) return detectCodex(customPath);
  return invoke<CodexDetection>("quit_codex", { customPath });
}

export async function chooseCodexInstallPath(
  platform: string,
): Promise<string | null> {
  if (!isTauri()) return null;
  const selected = await open(
    platform.toLowerCase().includes("mac")
      ? {
          title: "Choose the Codex or ChatGPT application",
          directory: true,
          multiple: false,
        }
      : {
          title: "Choose Codex.exe or ChatGPT.exe",
          directory: false,
          multiple: false,
          filters: [{ name: "Codex Desktop", extensions: ["exe"] }],
        },
  );
  return typeof selected === "string" ? selected : null;
}

export async function validateCodexInstallPath(path: string): Promise<boolean> {
  if (!isTauri()) return true;
  return invoke<boolean>("validate_codex_path", { path });
}

export async function applyTheme(
  theme: ThemeDefinition,
  variant: "light" | "dark",
  runtimeStrategy: RuntimeStrategy,
  resolveAsset?: (theme: ThemeDefinition, path: string) => string,
  revision = 0,
): Promise<RuntimeStatus> {
  const payload = await prepareThemeForRuntime(theme, resolveAsset);
  if (!isTauri()) {
    browserStatus = {
      ...browserStatus,
      state: "applied",
      connected: true,
      startedByStyler: true,
      port: 9229,
      revision,
      message: "Theme applied in preview mode",
    };
    return { ...browserStatus };
  }
  return invoke<RuntimeStatus>("apply_theme", {
    theme: payload,
    variant,
    compatibilityMode:
      runtimeStrategy === "enhanced" ? "auto" : "compatibility",
    revision,
  });
}

export async function applyConfiguration(
  configuration: AppliedConfiguration,
  resolveAsset?: (theme: ThemeDefinition, path: string) => string,
): Promise<RuntimeStatus> {
  const compiled = prepareMotionPreference(
    composeThemeWithCompanion(
      configuration.theme,
      configuration.companion,
      configuration.companionOverrides,
    ),
    configuration.reduceMotion,
  );
  return applyTheme(
    compiled,
    configuration.variant,
    configuration.runtimeStrategy,
    resolveAsset,
    configuration.revision,
  );
}

export async function updateCompanion(
  theme: ThemeDefinition,
  resolveAsset: ((theme: ThemeDefinition, path: string) => string) | undefined,
  revision: number,
): Promise<RuntimeStatus> {
  const payload = await prepareThemeForRuntime(theme, resolveAsset);
  const entity = payload.scene.entities[0] ?? null;
  if (!isTauri()) {
    browserStatus = {
      ...browserStatus,
      state: "applied",
      connected: true,
      startedByStyler: true,
      port: 9229,
      revision,
      message: "Companion updated in preview mode",
    };
    return { ...browserStatus };
  }
  return invoke<RuntimeStatus>("update_companion", { entity, revision });
}

export async function updateCompanionConfiguration(
  configuration: AppliedConfiguration,
  resolveAsset?: (theme: ThemeDefinition, path: string) => string,
): Promise<RuntimeStatus> {
  const compiled = prepareMotionPreference(
    composeThemeWithCompanion(
      configuration.theme,
      configuration.companion,
      configuration.companionOverrides,
    ),
    configuration.reduceMotion,
  );
  return updateCompanion(compiled, resolveAsset, configuration.revision);
}

export function prepareMotionPreference(
  theme: ThemeDefinition,
  reduceMotion: boolean,
): ThemeDefinition {
  if (!reduceMotion) return theme;
  const reduced = structuredClone(theme);
  for (const visual of Object.values(reduced.variants)) {
    visual.motion.intensity = 0;
    visual.motion.parallax = 0;
  }
  for (const entity of reduced.scene.entities) {
    entity.behaviors = entity.behaviors.filter(
      (behavior) =>
        behavior !== "idle" &&
        behavior !== "parallax" &&
        behavior !== "look-at-pointer",
    );
    if (entity.renderer.type === "sprite-atlas") {
      entity.renderer.neutralFrame =
        entity.renderer.reducedMotionFrame ?? entity.renderer.neutralFrame ?? 0;
      delete entity.renderer.idleClips;
    }
  }
  return reduced;
}

export async function pauseTheme(): Promise<RuntimeStatus> {
  if (!isTauri()) {
    browserStatus = {
      ...browserStatus,
      state: "paused",
      connected: true,
      startedByStyler: true,
      port: 9229,
    };
    return { ...browserStatus };
  }
  return invoke<RuntimeStatus>("pause_theme");
}

export async function restoreOfficial(): Promise<RuntimeStatus> {
  if (!isTauri()) {
    browserStatus = {
      ...browserStatus,
      state: "disconnected",
      connected: false,
      startedByStyler: false,
      port: null,
      message: null,
    };
    return { ...browserStatus };
  }
  return invoke<RuntimeStatus>("restore_official");
}

export async function checkForUpdates(
  locale: "en" | "zh-CN",
): Promise<UpdateCheckResult> {
  if (!isTauri()) {
    return { currentVersion: "0.2.0-beta.7", update: null };
  }
  return invoke<UpdateCheckResult>("check_for_updates", { locale });
}

export async function downloadAndInstallUpdate(
  onEvent: (event: UpdateDownloadEvent) => void,
): Promise<void> {
  if (!isTauri()) return;
  const channel = new Channel<UpdateDownloadEvent>();
  channel.onmessage = onEvent;
  await invoke("download_and_install_update", { onEvent: channel });
}

export async function restartApp(): Promise<void> {
  if (!isTauri()) return;
  await invoke("restart_app");
}
