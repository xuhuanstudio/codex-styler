import { invoke } from "@tauri-apps/api/core";
import type { ThemeDefinition } from "@codex-styler/theme-core";
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
  state: "idle" | "launching" | "connected" | "applied" | "paused" | "error";
  connected: boolean;
  startedByStyler: boolean;
  port: number | null;
  codexVersion: string | null;
  compatibility: "supported" | "safe" | "blocked";
  message: string | null;
}

const browserStatus: RuntimeStatus = {
  state: "idle",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
};

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function detectCodex(): Promise<CodexDetection> {
  if (!isTauri()) {
    return {
      installed: true,
      running: false,
      path: "/Applications/Codex.app",
      version: "Preview mode",
      platform: navigator.platform,
    };
  }
  return invoke<CodexDetection>("detect_codex");
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  if (!isTauri()) return { ...browserStatus };
  return invoke<RuntimeStatus>("runtime_status");
}

export async function launchCodex(): Promise<RuntimeStatus> {
  if (!isTauri()) {
    return {
      ...browserStatus,
      state: "connected",
      connected: true,
      startedByStyler: true,
      port: 9229,
      message: "Browser preview connection",
    };
  }
  return invoke<RuntimeStatus>("launch_codex");
}

export async function applyTheme(
  theme: ThemeDefinition,
  variant: "light" | "dark",
  runtimeStrategy: RuntimeStrategy,
  resolveAsset?: (theme: ThemeDefinition, path: string) => string,
): Promise<RuntimeStatus> {
  const payload = await prepareThemeForRuntime(theme, resolveAsset);
  if (!isTauri()) {
    return {
      ...browserStatus,
      state: "applied",
      connected: true,
      startedByStyler: true,
      port: 9229,
      message: "Theme applied in preview mode",
    };
  }
  return invoke<RuntimeStatus>("apply_theme", {
    theme: payload,
    variant,
    compatibilityMode: runtimeStrategy,
  });
}

export async function pauseTheme(): Promise<RuntimeStatus> {
  if (!isTauri()) {
    return {
      ...browserStatus,
      state: "paused",
      connected: true,
      startedByStyler: true,
      port: 9229,
    };
  }
  return invoke<RuntimeStatus>("pause_theme");
}

export async function restoreOfficial(): Promise<RuntimeStatus> {
  if (!isTauri()) return { ...browserStatus };
  return invoke<RuntimeStatus>("restore_official");
}
