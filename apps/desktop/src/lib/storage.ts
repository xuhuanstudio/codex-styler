import type {
  EntityAttachment,
  ThemeDefinition,
} from "@codex-styler/theme-core";
import type { LocalePreference } from "./i18n";

export type ManagerAppearance = "system" | "light" | "dark";
export type RuntimeStrategy = "enhanced" | "conservative";

export interface UserSettings {
  locale: LocalePreference;
  appearance: ManagerAppearance;
  runtimeStrategy: RuntimeStrategy;
  companionId: string | null;
  companionAnchors: Record<string, { x: number; y: number }>;
  companionSizes: Record<string, number>;
  companionAttachments: Record<string, EntityAttachment | null>;
  reduceMotion: boolean;
  manualUpdateChecks: boolean;
  onboardingComplete: boolean;
}

const settingsKey = "codex-styler.settings.v1";
const themesKey = "codex-styler.local-themes.v1";

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(settingsKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Omit<
        Partial<UserSettings>,
        "runtimeStrategy"
      > & {
        runtimeStrategy?:
          RuntimeStrategy | "auto" | "compatibility" | "developer";
      };
      const runtimeStrategy =
        parsed.runtimeStrategy === "compatibility"
          ? "conservative"
          : "enhanced";
      return { ...defaultSettings(), ...parsed, runtimeStrategy };
    }
  } catch {
    // Corrupt local settings fall back to safe defaults.
  }
  return defaultSettings();
}

function defaultSettings(): UserSettings {
  return {
    locale: "system",
    appearance: "system",
    runtimeStrategy: "enhanced",
    companionId: null,
    companionAnchors: {},
    companionSizes: {},
    companionAttachments: {},
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
