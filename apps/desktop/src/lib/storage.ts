import type { ThemeDefinition } from "@codex-styler/theme-core";
import type { LocalePreference } from "./i18n";

export type ManagerAppearance = "system" | "light" | "dark";
export type RuntimeStrategy = "auto" | "compatibility" | "developer";

export interface UserSettings {
  locale: LocalePreference;
  appearance: ManagerAppearance;
  runtimeStrategy: RuntimeStrategy;
  reduceMotion: boolean;
  manualUpdateChecks: boolean;
  onboardingComplete: boolean;
}

const settingsKey = "codex-styler.settings.v1";
const themesKey = "codex-styler.local-themes.v1";

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(settingsKey);
    if (stored) return { ...defaultSettings(), ...JSON.parse(stored) };
  } catch {
    // Corrupt local settings fall back to safe defaults.
  }
  return defaultSettings();
}

function defaultSettings(): UserSettings {
  return {
    locale: "system",
    appearance: "system",
    runtimeStrategy: "auto",
    reduceMotion: false,
    manualUpdateChecks: true,
    onboardingComplete: false,
  };
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

export function loadLocalThemes(): ThemeDefinition[] {
  try {
    return JSON.parse(localStorage.getItem(themesKey) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLocalThemes(themes: ThemeDefinition[]): void {
  localStorage.setItem(themesKey, JSON.stringify(themes));
}
