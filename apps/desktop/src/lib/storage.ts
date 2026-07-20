import type {
  CompanionDefinition,
  EntityAttachment,
  ThemeDefinition,
  ThemeVariantName,
} from "@codex-styler/theme-core";
import type { LocalePreference } from "./i18n";

export type ManagerAppearance = "system" | "light" | "dark";
export type RuntimeStrategy = "enhanced" | "conservative";
export type CompanionMode = "theme-default" | "custom" | "disabled";
export type PreviewScenario =
  | "home"
  | "task"
  | "changes"
  | "terminal"
  | "settings"
  | "components"
  | "dialog"
  | "right-panel";

export interface WorkspaceUiPreferences {
  focusMode: boolean;
  themeEditorLayersWidth: number;
  themeEditorInspectorWidth: number;
  themeEditorPreviewScenario: PreviewScenario;
}

export interface UserSettings {
  locale: LocalePreference;
  appearance: ManagerAppearance;
  runtimeStrategy: RuntimeStrategy;
  codexInstallPath: string | null;
  appliedThemeId: string | null;
  themeVariant: ThemeVariantName;
  companionMode: CompanionMode;
  companionId: string | null;
  companionAnchors: Record<string, { x: number; y: number }>;
  companionSizes: Record<string, number>;
  companionAttachments: Record<string, EntityAttachment | null>;
  reduceMotion: boolean;
  composerMomentsEnabled: boolean;
  automaticUpdateChecks: boolean;
  skippedUpdateVersion: string | null;
  lastUpdateCheckAt: string | null;
  onboardingComplete: boolean;
}

const settingsKey = "codex-styler.settings.v1";
const themesKey = "codex-styler.local-themes.v1";
const companionsKey = "codex-styler.local-companions.v1";
const uiPreferencesKey = "codex-styler.ui.v1";

const defaultUiPreferences: WorkspaceUiPreferences = {
  focusMode: true,
  themeEditorLayersWidth: 220,
  themeEditorInspectorWidth: 300,
  themeEditorPreviewScenario: "home",
};

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
      const runtimeStrategy: RuntimeStrategy =
        parsed.runtimeStrategy === "compatibility" ||
        parsed.runtimeStrategy === "conservative"
          ? "conservative"
          : "enhanced";
      const companionMode: CompanionMode = [
        "theme-default",
        "custom",
        "disabled",
      ].includes(parsed.companionMode ?? "")
        ? (parsed.companionMode as CompanionMode)
        : parsed.companionId
          ? "custom"
          : "theme-default";
      const themeVariant: ThemeVariantName =
        parsed.themeVariant === "light" ? "light" : "dark";
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
        locale: ["system", "en", "zh-CN"].includes(parsed.locale ?? "")
          ? parsed.locale!
          : "system",
        appearance: ["system", "light", "dark"].includes(
          parsed.appearance ?? "",
        )
          ? parsed.appearance!
          : "system",
        runtimeStrategy,
        codexInstallPath:
          typeof parsed.codexInstallPath === "string" ||
          parsed.codexInstallPath === null
            ? parsed.codexInstallPath
            : null,
        appliedThemeId:
          typeof parsed.appliedThemeId === "string" ||
          parsed.appliedThemeId === null
            ? parsed.appliedThemeId
            : null,
        themeVariant,
        companionMode,
        companionId:
          typeof parsed.companionId === "string" || parsed.companionId === null
            ? parsed.companionId
            : null,
        companionAnchors: isRecord(parsed.companionAnchors)
          ? (parsed.companionAnchors as UserSettings["companionAnchors"])
          : {},
        companionSizes: isRecord(parsed.companionSizes)
          ? (parsed.companionSizes as UserSettings["companionSizes"])
          : {},
        companionAttachments: isRecord(parsed.companionAttachments)
          ? (parsed.companionAttachments as UserSettings["companionAttachments"])
          : {},
        reduceMotion:
          typeof parsed.reduceMotion === "boolean"
            ? parsed.reduceMotion
            : false,
        composerMomentsEnabled:
          typeof parsed.composerMomentsEnabled === "boolean"
            ? parsed.composerMomentsEnabled
            : true,
        automaticUpdateChecks,
        skippedUpdateVersion:
          typeof parsed.skippedUpdateVersion === "string" ||
          parsed.skippedUpdateVersion === null
            ? parsed.skippedUpdateVersion
            : null,
        lastUpdateCheckAt:
          typeof parsed.lastUpdateCheckAt === "string" ||
          parsed.lastUpdateCheckAt === null
            ? parsed.lastUpdateCheckAt
            : null,
        onboardingComplete:
          typeof parsed.onboardingComplete === "boolean"
            ? parsed.onboardingComplete
            : false,
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
    themeVariant: "dark",
    companionMode: "theme-default",
    companionId: null,
    companionAnchors: {},
    companionSizes: {},
    companionAttachments: {},
    reduceMotion: false,
    composerMomentsEnabled: true,
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

export function loadWorkspaceUiPreferences(): WorkspaceUiPreferences {
  try {
    const stored = JSON.parse(
      localStorage.getItem(uiPreferencesKey) ?? "{}",
    ) as Partial<WorkspaceUiPreferences>;
    return {
      focusMode:
        typeof stored.focusMode === "boolean"
          ? stored.focusMode
          : defaultUiPreferences.focusMode,
      themeEditorLayersWidth: finiteClamped(
        stored.themeEditorLayersWidth,
        defaultUiPreferences.themeEditorLayersWidth,
        184,
        320,
      ),
      themeEditorInspectorWidth: finiteClamped(
        stored.themeEditorInspectorWidth,
        defaultUiPreferences.themeEditorInspectorWidth,
        264,
        400,
      ),
      themeEditorPreviewScenario: isPreviewScenario(
        stored.themeEditorPreviewScenario,
      )
        ? stored.themeEditorPreviewScenario
        : defaultUiPreferences.themeEditorPreviewScenario,
    };
  } catch {
    return { ...defaultUiPreferences };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteClamped(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback;
}

function isPreviewScenario(value: unknown): value is PreviewScenario {
  return [
    "home",
    "task",
    "changes",
    "terminal",
    "settings",
    "components",
    "dialog",
    "right-panel",
  ].includes(String(value));
}

export function saveWorkspaceUiPreferences(
  preferences: WorkspaceUiPreferences,
): void {
  localStorage.setItem(uiPreferencesKey, JSON.stringify(preferences));
}
