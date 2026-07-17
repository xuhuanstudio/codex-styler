import type {
  CompanionDefinition,
  EntityAttachment,
  ThemeDefinition,
} from "@codex-styler/theme-core";
import type { LocalePreference } from "./i18n";

export type ManagerAppearance = "system" | "light" | "dark";
export type RuntimeStrategy = "enhanced" | "conservative";
export type CompanionMode = "theme-default" | "custom" | "disabled";

export interface UserSettings {
  locale: LocalePreference;
  appearance: ManagerAppearance;
  runtimeStrategy: RuntimeStrategy;
  codexInstallPath: string | null;
  appliedThemeId: string | null;
  companionMode: CompanionMode;
  companionId: string | null;
  companionAnchors: Record<string, { x: number; y: number }>;
  companionSizes: Record<string, number>;
  companionAttachments: Record<string, EntityAttachment | null>;
  reduceMotion: boolean;
  automaticUpdateChecks: boolean;
  skippedUpdateVersion: string | null;
  lastUpdateCheckAt: string | null;
  onboardingComplete: boolean;
}

const settingsKey = "codex-styler.settings.v1";
const themesKey = "codex-styler.local-themes.v1";
const companionsKey = "codex-styler.local-companions.v1";

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
        manualUpdateChecks?: boolean;
      };
      const runtimeStrategy =
        parsed.runtimeStrategy === "compatibility"
          ? "conservative"
          : "enhanced";
      const companionMode = parsed.companionMode
        ? parsed.companionMode
        : parsed.companionId
          ? "custom"
          : "theme-default";
      const automaticUpdateChecks =
        parsed.automaticUpdateChecks ??
        (parsed.manualUpdateChecks === undefined
          ? true
          : !parsed.manualUpdateChecks);
      const currentSettings = { ...parsed };
      delete currentSettings.manualUpdateChecks;
      return {
        ...defaultSettings(),
        ...currentSettings,
        runtimeStrategy,
        companionMode,
        automaticUpdateChecks,
      };
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
    codexInstallPath: null,
    appliedThemeId: null,
    companionMode: "theme-default",
    companionId: null,
    companionAnchors: {},
    companionSizes: {},
    companionAttachments: {},
    reduceMotion: false,
    automaticUpdateChecks: true,
    skippedUpdateVersion: null,
    lastUpdateCheckAt: null,
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

export function loadLocalCompanions(): CompanionDefinition[] {
  try {
    return JSON.parse(localStorage.getItem(companionsKey) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLocalCompanions(companions: CompanionDefinition[]): void {
  localStorage.setItem(companionsKey, JSON.stringify(companions));
}
