import {
  Check,
  Film,
  FolderOpen,
  Gamepad2,
  Layers3,
  Leaf,
  MoreHorizontal,
  Monitor,
  Moon,
  MousePointer2,
  PawPrint,
  Palette,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import {
  builtinCompanions,
  builtinThemes,
  composeThemeWithCompanion,
  defaultCompanionForTheme,
  embeddedCompanionForTheme,
  type CompanionDefinition,
  type EntityAttachment,
  type SceneLayer,
  type ThemeDefinition,
  type ThemeVariant,
} from "@codex-styler/theme-core";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BrandMark } from "./components/BrandMark";
import { ConfigurationDock } from "./components/ConfigurationDock";
import { Onboarding } from "./components/Onboarding";
import { PreviewWorkspace } from "./components/PreviewWorkspace";
import { SelectField } from "./components/ui/SelectField";
import type { CompanionCreatorProject } from "./features/companion-creator/model";
import {
  DeleteCompanionDialog,
  DeleteCompanionProjectDialog,
  DeleteThemeDialog,
  DiagnosticsDialog,
  RestartCodexDialog,
  UnsavedThemeDialog,
  UpdateDialog,
  type UpdateInstallStatus,
} from "./features/app-shell/AppDialogs";
import {
  deleteCompanionProject,
  listCompanionProjects,
} from "./features/companion-creator/project-files";
import {
  resolveLocale,
  translate,
  type Locale,
  type MessageKey,
} from "./lib/i18n";
import {
  loadLocalThemes,
  loadLocalCompanions,
  loadSettings,
  loadWorkspaceUiPreferences,
  saveLocalCompanions,
  saveLocalThemes,
  saveSettings,
  saveWorkspaceUiPreferences,
  type RuntimeStrategy,
  type UserSettings,
  type WorkspaceUiPreferences,
} from "./lib/storage";
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
  restartApp,
  restoreOfficial,
  updateCompanionConfiguration,
  updateRuntimeExperience,
  validateCodexInstallPath,
  type AvailableUpdate,
  type CodexDetection,
  type RuntimeStatus,
} from "./lib/runtime";
import {
  createBlankTheme,
  createAdaptiveTheme,
  type AdaptiveScheme,
  type AdaptiveSchemeId,
} from "./lib/adaptive-theme";
import {
  deleteThemeArchive,
  exportTheme,
  hydrateThemeAssetMaps,
  importTheme,
  persistThemeCopy,
  persistGeneratedTheme,
  type ThemeAssetMap,
} from "./lib/theme-files";
import { assignThemeVariantField } from "./lib/theme-draft";
import {
  assignThemeColorHarmony,
  type ThemeColorHarmonyId,
} from "./lib/theme-color-harmony";
import {
  applyCompanionPlacementMode,
  resolveCompanionPlacementMode,
  type SelectableCompanionPlacementMode,
} from "./lib/companion-placement-modes";

const CompanionCreator = lazy(() =>
  import("./features/companion-creator/CompanionCreator").then((module) => ({
    default: module.CompanionCreator,
  })),
);
import {
  deleteCompanionArchive,
  exportCompanion,
  hydrateCompanionAssetMaps,
  importCompanion,
  persistCompanion,
  type CompanionAssetMap,
} from "./lib/companion-files";
import { themeAssetUrl } from "./lib/assets";
import { collectDiagnostics, type DiagnosticsReport } from "./lib/diagnostics";
import {
  appSessionReducer,
  createInitialAppSession,
  type ThemeVariantName,
} from "./lib/app-session";
import {
  classifyRuntimeFailure,
  configurationPresentation,
  runtimeFailureMessageKey,
} from "./lib/configuration-presentation";
import { SettingsView } from "./features/settings/SettingsView";
import { HomeView } from "./features/home/HomeView";
import { ThemesView, type ThemeCollection } from "./features/themes/ThemesView";
import {
  NewThemeDialog,
  type NewThemeStep,
} from "./features/themes/NewThemeDialog";
import {
  CompanionsView,
  type CompanionCollection,
} from "./features/companions/CompanionsView";
import { ThemeEditorView } from "./features/theme-editor/ThemeEditorView";
import { InteractionsView } from "./features/interactions/InteractionsView";
import {
  themeDraftsEqual,
  useThemeDraftHistory,
} from "./features/theme-editor/use-theme-draft-history";

type View =
  | "home"
  | "themes"
  | "companions"
  | "interactions"
  | "settings"
  | "editor"
  | "companion-editor";
type UpdateStatus = "idle" | "checking" | "current" | "error";
type ApplySuccessMessage =
  | "configurationApplied"
  | "themeApplied"
  | "companionApplied"
  | "companionPositionApplied";
const initialRuntime: RuntimeStatus = {
  state: "disconnected",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
  revision: 0,
};

function isRuntimeConnectionFailure(message: string): boolean {
  const failure = classifyRuntimeFailure(message);
  return failure === "connection" || failure === "timeout";
}

function initialCompanionForTheme(
  theme: ThemeDefinition,
  settings: UserSettings,
  localCompanions: CompanionDefinition[],
): CompanionDefinition | null {
  if (settings.companionMode === "disabled") return null;
  const companions = [...builtinCompanions, ...localCompanions];
  if (settings.companionMode === "custom") {
    return companions.find((item) => item.id === settings.companionId) ?? null;
  }
  const recommendedId = theme.metadata.recommendedCompanionId;
  return (
    (recommendedId
      ? companions.find((item) => item.id === recommendedId)
      : null) ??
    embeddedCompanionForTheme(theme) ??
    defaultCompanionForTheme(theme.id)
  );
}

export function App() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [localThemes, setLocalThemes] =
    useState<ThemeDefinition[]>(loadLocalThemes);
  const [localCompanions, setLocalCompanions] =
    useState<CompanionDefinition[]>(loadLocalCompanions);
  const [uiPreferences, setUiPreferences] = useState<WorkspaceUiPreferences>(
    loadWorkspaceUiPreferences,
  );
  const settingsRef = useRef(settings);
  const [view, setView] = useState<View>("home");
  const initialTheme =
    [...builtinThemes, ...localThemes].find(
      (theme) => theme.id === settings.appliedThemeId,
    ) ?? builtinThemes[0];
  const [session, dispatchSession] = useReducer(
    appSessionReducer,
    createInitialAppSession(
      initialTheme,
      initialRuntime,
      initialCompanionForTheme(initialTheme, settings, localCompanions),
      undefined,
      settings.themeVariant,
    ),
  );
  const selectedTheme = session.selection.theme;
  const variant = session.selection.variant;
  const runtime = session.runtime;
  const setRuntime = (
    next: RuntimeStatus | ((current: RuntimeStatus) => RuntimeStatus),
  ) => {
    if (typeof next === "function") {
      dispatchSession({ type: "runtime/update", update: next });
    } else {
      dispatchSession({ type: "runtime/replace", runtime: next });
    }
  };
  const {
    theme: draftTheme,
    commit: commitThemeDraft,
    reset: resetThemeDraft,
    undo: undoThemeDraft,
    redo: redoThemeDraft,
    breakGroup: breakThemeHistoryGroup,
    canUndo: canUndoThemeDraft,
    canRedo: canRedoThemeDraft,
  } = useThemeDraftHistory(initialTheme);
  const draftThemeRef = useRef(draftTheme);
  const [detection, setDetection] = useState<CodexDetection | null>(null);
  const [themeCollection, setThemeCollection] =
    useState<ThemeCollection>("builtIn");
  const [companionCollection, setCompanionCollection] =
    useState<CompanionCollection>("builtIn");
  const [newThemeStep, setNewThemeStep] = useState<NewThemeStep | null>(null);
  const [themeAssetMaps, setThemeAssetMaps] = useState<
    Record<string, ThemeAssetMap>
  >({});
  const [companionAssetMaps, setCompanionAssetMaps] = useState<
    Record<string, CompanionAssetMap>
  >({});
  const [companionProjects, setCompanionProjects] = useState<
    CompanionCreatorProject[]
  >([]);
  const [activeCompanionProject, setActiveCompanionProject] =
    useState<CompanionCreatorProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastAppliedTheme, setLastAppliedTheme] = useState<{
    theme: ThemeDefinition;
    variant: ThemeVariantName;
  } | null>(null);
  const [installPathBusy, setInstallPathBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState("0.2.0-beta.8");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [availableUpdate, setAvailableUpdate] =
    useState<AvailableUpdate | null>(null);
  const [updateInstallStatus, setUpdateInstallStatus] =
    useState<UpdateInstallStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [diagnosticsReport, setDiagnosticsReport] =
    useState<DiagnosticsReport | null>(null);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    !settings.onboardingComplete,
  );
  const [pendingDelete, setPendingDelete] = useState<ThemeDefinition | null>(
    null,
  );
  const [pendingCompanionDelete, setPendingCompanionDelete] =
    useState<CompanionDefinition | null>(null);
  const [pendingCompanionProjectDelete, setPendingCompanionProjectDelete] =
    useState<CompanionCreatorProject | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<View | null>(null);
  const [pendingApplication, setPendingApplication] = useState<{
    theme: ThemeDefinition;
    companion: CompanionDefinition | null;
    settings: UserSettings;
    variant: ThemeVariantName;
    preserveSelection: boolean;
    successMessage: ApplySuccessMessage;
  } | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [settingsFocusRequest, setSettingsFocusRequest] = useState<{
    target: "codex" | "diagnostics";
    revision: number;
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const appMainRef = useRef<HTMLDivElement>(null);
  const pendingNavigationTriggerRef = useRef<HTMLElement | null>(null);
  const companionImportRef = useRef<HTMLInputElement>(null);
  const backgroundImportRef = useRef<HTMLInputElement>(null);
  const [backgroundImportMode, setBackgroundImportMode] = useState<
    "create" | "replace"
  >("create");
  const [adaptiveSchemes, setAdaptiveSchemes] = useState<AdaptiveScheme[]>([]);
  const [activeAdaptiveScheme, setActiveAdaptiveScheme] =
    useState<AdaptiveSchemeId | null>(null);
  const startupUpdateCheckRef = useRef(false);
  const liveCompanionSyncRef = useRef<number | null>(null);
  const runtimeExperienceSyncRef = useRef<string | null>(null);
  const applyRevisionRef = useRef(0);

  const locale = resolveLocale(settings.locale);
  const t = (key: MessageKey) => translate(locale, key);

  useEffect(() => {
    const element = appMainRef.current;
    if (!element) return;
    if (typeof element.scrollTo === "function") {
      element.scrollTo({ top: 0, behavior: "auto" });
    } else {
      element.scrollTop = 0;
    }
  }, [view]);

  useEffect(() => {
    if (!pendingNavigation) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy) return;
      event.preventDefault();
      cancelPendingNavigation();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [busy, pendingNavigation]);

  useEffect(() => {
    if (!pendingNavigation || busy || session.draft.themeDirty) return;
    const nextView = pendingNavigation;
    pendingNavigationTriggerRef.current = null;
    setPendingNavigation(null);
    setView(nextView);
  }, [busy, pendingNavigation, session.draft.themeDirty]);
  const themePersistenceMessage = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    if (
      /theme asset is unavailable|missing generated theme asset|declared asset is missing/i.test(
        detail,
      )
    ) {
      return t("themeAssetUnavailable");
    }
    if (/theme manifest is invalid|must |invalid value/i.test(detail)) {
      return t("themeValidationFailed");
    }
    return t("themeSaveFailed");
  };
  const runtimeFailureMessage = (detail: string) =>
    t(runtimeFailureMessageKey(detail));
  const allCompanions = [...builtinCompanions, ...localCompanions];
  const companionForTheme = (
    theme: ThemeDefinition,
    sourceSettings: UserSettings = settings,
  ) => {
    if (sourceSettings.companionMode === "disabled") return null;
    if (sourceSettings.companionMode === "custom") {
      return (
        allCompanions.find((item) => item.id === sourceSettings.companionId) ??
        null
      );
    }
    const recommendedId = theme.metadata.recommendedCompanionId;
    return (
      (recommendedId
        ? allCompanions.find((item) => item.id === recommendedId)
        : null) ??
      embeddedCompanionForTheme(theme) ??
      defaultCompanionForTheme(theme.id)
    );
  };
  const selectedCompanion = session.selection.companion;
  const resolveAsset = (theme: ThemeDefinition, path: string) => {
    const companion = companionForTheme(theme);
    return (
      themeAssetMaps[theme.id]?.[path] ??
      (companion ? companionAssetMaps[companion.id]?.[path] : undefined) ??
      themeAssetUrl(theme, path)
    );
  };
  const appliedTheme =
    [...builtinThemes, ...localThemes].find(
      (theme) => theme.id === settings.appliedThemeId,
    ) ?? selectedTheme;
  const isLive =
    runtime.connected &&
    settings.appliedThemeId !== null &&
    (runtime.state === "applied" ||
      runtime.state === "fallback" ||
      runtime.state === "applying");
  const isDraftApplied =
    isLive &&
    !session.draft.themeDirty &&
    lastAppliedTheme !== null &&
    lastAppliedTheme.variant === variant &&
    themeDraftsEqual(draftTheme, lastAppliedTheme.theme);
  const configuration = configurationPresentation({
    runtime,
    detection,
    runtimeStrategy: settings.runtimeStrategy,
  });
  const displayedTheme = isLive ? appliedTheme : selectedTheme;
  const companionOverridesFor = (
    companion: CompanionDefinition | null,
    sourceSettings: UserSettings,
  ) => {
    if (!companion) return undefined;
    const overrides: {
      anchor?: { x: number; y: number };
      attachment?: EntityAttachment | null;
      size?: number;
    } = {
      anchor: sourceSettings.companionAnchors[companion.id],
      size: sourceSettings.companionSizes[companion.id],
    };
    if (
      Object.prototype.hasOwnProperty.call(
        sourceSettings.companionAttachments,
        companion.id,
      )
    ) {
      overrides.attachment = sourceSettings.companionAttachments[companion.id];
    }
    return overrides;
  };
  const selectCompanionInSession = (
    companion: CompanionDefinition | null,
    sourceSettings: UserSettings = settingsRef.current,
  ) => {
    dispatchSession({
      type: "selection/companion",
      companion,
      companionOverrides: companionOverridesFor(companion, sourceSettings),
    });
  };
  const setSelectedTheme = (
    theme: ThemeDefinition,
    sourceSettings: UserSettings = settingsRef.current,
  ) => {
    dispatchSession({ type: "selection/theme", theme });
    selectCompanionInSession(
      companionForTheme(theme, sourceSettings),
      sourceSettings,
    );
  };
  const composeTheme = (
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = companionForTheme(theme),
    sourceSettings: UserSettings = settings,
  ) => {
    return composeThemeWithCompanion(
      theme,
      companion,
      companionOverridesFor(companion, sourceSettings),
    );
  };

  useEffect(() => {
    saveSettings(settings);
    settingsRef.current = settings;
    document.documentElement.dataset.appearance = settings.appearance;
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle(
      "reduce-motion",
      settings.reduceMotion,
    );
  }, [locale, settings]);

  useEffect(() => {
    saveWorkspaceUiPreferences(uiPreferences);
  }, [uiPreferences]);

  useEffect(() => {
    if (
      !runtime.connected ||
      (runtime.state !== "applied" && runtime.state !== "fallback") ||
      lastAppliedTheme !== null
    ) {
      return;
    }
    setLastAppliedTheme({
      theme: structuredClone(appliedTheme),
      variant: settings.themeVariant,
    });
  }, [appliedTheme, lastAppliedTheme, runtime, settings.themeVariant]);

  useEffect(() => {
    selectCompanionInSession(
      companionForTheme(selectedTheme, settings),
      settings,
    );
  }, [
    localCompanions,
    selectedTheme.id,
    selectedTheme.metadata.recommendedCompanionId,
    settings.companionAnchors,
    settings.companionAttachments,
    settings.companionId,
    settings.companionMode,
    settings.companionSizes,
  ]);

  useEffect(
    () => () => {
      if (liveCompanionSyncRef.current !== null) {
        window.clearTimeout(liveCompanionSyncRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    void Promise.all([
      detectCodex(settingsRef.current.codexInstallPath),
      getRuntimeStatus(),
    ]).then(([detected, status]) => {
      syncDetection(detected, status);
    });
  }, []);

  useEffect(() => {
    if (
      !runtime.connected ||
      runtime.state === "applying" ||
      runtime.state === "launching"
    ) {
      return;
    }
    let disposed = false;
    let checking = false;
    const reconcile = async () => {
      if (checking) return;
      checking = true;
      try {
        const status = await getRuntimeStatus();
        if (disposed) return;
        if (status.connected) {
          setRuntime(status);
          return;
        }
        const detected = await detectCodex(
          settingsRef.current.codexInstallPath,
        );
        if (!disposed) syncDetection(detected, status);
      } catch (error) {
        console.warn("Could not refresh the Codex runtime connection", error);
      } finally {
        checking = false;
      }
    };
    const onFocus = () => void reconcile();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    const interval = window.setInterval(() => void reconcile(), 4_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [runtime.connected, runtime.state]);

  useEffect(() => {
    if (!runtime.connected) {
      runtimeExperienceSyncRef.current = null;
      return;
    }
    if (busy || (runtime.state !== "applied" && runtime.state !== "fallback")) {
      return;
    }
    const signature = [
      runtime.port ?? "connected",
      settings.composerInteractionMode,
      locale,
      settings.reduceMotion ? "reduced" : "animated",
    ].join(":");
    if (runtimeExperienceSyncRef.current === signature) return;
    runtimeExperienceSyncRef.current = signature;
    const revision = Math.max(applyRevisionRef.current, runtime.revision) + 1;
    applyRevisionRef.current = revision;
    let active = true;
    void updateRuntimeExperience(
      {
        composerInteractionMode: settings.composerInteractionMode,
        locale,
        reduceMotion: settings.reduceMotion,
      },
      revision,
    )
      .then((next) => {
        if (active && revision === applyRevisionRef.current) setRuntime(next);
      })
      .catch((error) => {
        if (!active) return;
        if (runtimeExperienceSyncRef.current === signature) {
          runtimeExperienceSyncRef.current = null;
        }
        /* A runtime from an older Styler build remains safe and usable. The
           next full apply upgrades it; do not force a theme restart here. */
        console.warn("Could not synchronize interaction preferences", error);
      });
    return () => {
      active = false;
    };
  }, [
    busy,
    locale,
    runtime.connected,
    runtime.port,
    runtime.revision,
    runtime.state,
    settings.composerInteractionMode,
    settings.reduceMotion,
  ]);

  useEffect(() => {
    void listCompanionProjects()
      .then(setCompanionProjects)
      .catch((error) =>
        console.warn("Could not restore companion drafts", error),
      );
  }, []);

  useEffect(() => {
    let active = true;
    void hydrateCompanionAssetMaps(localCompanions).then((maps) => {
      if (active) {
        setCompanionAssetMaps((current) => ({ ...current, ...maps }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void hydrateThemeAssetMaps(localThemes).then((maps) => {
      if (active) setThemeAssetMaps((current) => ({ ...current, ...maps }));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    draftThemeRef.current = draftTheme;
    dispatchSession({
      type: "draft/theme-dirty",
      dirty: !themeDraftsEqual(draftTheme, selectedTheme),
    });
  }, [draftTheme, selectedTheme]);

  useEffect(() => {
    if (themeDraftsEqual(draftThemeRef.current, selectedTheme)) return;
    resetThemeDraft(selectedTheme);
  }, [resetThemeDraft, selectedTheme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (
      startupUpdateCheckRef.current ||
      !settings.onboardingComplete ||
      !settings.automaticUpdateChecks
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      startupUpdateCheckRef.current = true;
      void handleCheckForUpdates(false);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [locale, settings.automaticUpdateChecks, settings.onboardingComplete]);

  const appTheme = useMemo(() => {
    if (settings.appearance === "system") return "system";
    return settings.appearance;
  }, [settings.appearance]);

  const needsManualRestart =
    runtime.state === "restart-required" ||
    (detection?.running === true && !runtime.connected);

  function syncDetection(
    nextDetection: CodexDetection,
    status?: RuntimeStatus,
  ) {
    setDetection(nextDetection);
    setRuntime((current) => {
      const next = status ?? current;
      if (next.connected) return next;
      if (nextDetection.running) {
        return { ...next, state: "restart-required" };
      }
      return next.state === "restart-required"
        ? { ...next, state: "disconnected" }
        : next;
    });
  }

  async function recoverRuntimeFailure(detail: string, revision: number) {
    if (!isRuntimeConnectionFailure(detail)) {
      setRuntime((current) => ({
        ...current,
        state: "error",
        message: detail,
        revision,
      }));
      return;
    }
    try {
      const [status, detected] = await Promise.all([
        getRuntimeStatus(),
        detectCodex(settingsRef.current.codexInstallPath),
      ]);
      if (revision !== applyRevisionRef.current) return;
      syncDetection(detected, {
        ...status,
        state: "error",
        connected: false,
        startedByStyler: false,
        port: null,
        compatibility: "safe",
        message: detail,
        revision: Math.max(status.revision, revision),
      });
    } catch {
      if (revision !== applyRevisionRef.current) return;
      setRuntime((current) => ({
        ...current,
        state: "error",
        connected: false,
        startedByStyler: false,
        port: null,
        compatibility: "safe",
        message: detail,
        revision,
      }));
    }
  }

  async function performApply(
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = companionForTheme(theme),
    settingsSnapshot: UserSettings = settingsRef.current,
    options: {
      preserveSelection?: boolean;
      successMessage?: ApplySuccessMessage;
      variant?: ThemeVariantName;
    } = {},
  ) {
    const revision = ++applyRevisionRef.current;
    const preserveSelection = options.preserveSelection ?? false;
    const successMessage = options.successMessage ?? "configurationApplied";
    const variantSnapshot = options.variant ?? settingsSnapshot.themeVariant;
    setBusy(true);
    dispatchSession({ type: "operation/start", revision, phase: "applying" });
    setRuntime((current) => ({
      ...current,
      state: "applying",
      revision,
      message: null,
    }));
    try {
      let next = await getRuntimeStatus();
      if (revision !== applyRevisionRef.current) return;
      if (!next.connected) {
        const currentDetection = await detectCodex(
          settingsSnapshot.codexInstallPath,
        );
        if (revision !== applyRevisionRef.current) return;
        syncDetection(currentDetection);
        if (currentDetection.running) {
          setRuntime((current) => ({
            ...current,
            state: "restart-required",
            message: null,
            revision,
          }));
          setRestartError(null);
          setPendingApplication({
            theme,
            companion,
            settings: settingsSnapshot,
            variant: variantSnapshot,
            preserveSelection,
            successMessage,
          });
          return;
        }
      }
      if (!next.connected) {
        next = await launchCodex(settingsSnapshot.codexInstallPath);
        if (revision !== applyRevisionRef.current) return;
      }
      next = await applyConfiguration(
        {
          theme,
          companion,
          companionOverrides: companionOverridesFor(
            companion,
            settingsSnapshot,
          ),
          variant: variantSnapshot,
          runtimeStrategy: settingsSnapshot.runtimeStrategy,
          reduceMotion: settingsSnapshot.reduceMotion,
          composerInteractionMode: settingsSnapshot.composerInteractionMode,
          locale: resolveLocale(settingsSnapshot.locale),
          revision,
        },
        resolveAsset,
      );
      if (revision !== applyRevisionRef.current) return;
      setRuntime(next);
      setLastAppliedTheme({
        theme: structuredClone(theme),
        variant: variantSnapshot,
      });
      if (!preserveSelection) setSelectedTheme(theme);
      updateSettings({ appliedThemeId: theme.id });
      syncDetection(await detectCodex(settingsSnapshot.codexInstallPath));
      setToast(t(successMessage));
      dispatchSession({ type: "operation/complete", revision });
    } catch (error) {
      if (revision !== applyRevisionRef.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      await recoverRuntimeFailure(detail, revision);
      if (revision !== applyRevisionRef.current) return;
      dispatchSession({ type: "operation/error", revision, message: detail });
      setToast(`${t("applyFailed")}: ${runtimeFailureMessage(detail)}`);
    } finally {
      if (revision === applyRevisionRef.current) setBusy(false);
    }
  }

  async function performCompanionUpdate(
    theme: ThemeDefinition,
    companion: CompanionDefinition | null,
    settingsSnapshot: UserSettings,
    successMessage: ApplySuccessMessage,
  ) {
    const revision = ++applyRevisionRef.current;
    setBusy(true);
    dispatchSession({ type: "operation/start", revision, phase: "applying" });
    setRuntime((current) => ({
      ...current,
      state: "applying",
      revision,
      message: null,
    }));
    try {
      const next = await updateCompanionConfiguration(
        {
          theme,
          companion,
          companionOverrides: companionOverridesFor(
            companion,
            settingsSnapshot,
          ),
          variant: settingsSnapshot.themeVariant,
          runtimeStrategy: settingsSnapshot.runtimeStrategy,
          reduceMotion: settingsSnapshot.reduceMotion,
          composerInteractionMode: settingsSnapshot.composerInteractionMode,
          locale: resolveLocale(settingsSnapshot.locale),
          revision,
        },
        resolveAsset,
      );
      if (revision !== applyRevisionRef.current) return;
      setRuntime(next);
      setToast(t(successMessage));
      dispatchSession({ type: "operation/complete", revision });
    } catch (error) {
      if (revision !== applyRevisionRef.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      await recoverRuntimeFailure(detail, revision);
      if (revision !== applyRevisionRef.current) return;
      dispatchSession({ type: "operation/error", revision, message: detail });
      setToast(`${t("applyFailed")}: ${runtimeFailureMessage(detail)}`);
    } finally {
      if (revision === applyRevisionRef.current) setBusy(false);
    }
  }

  function requestApply(
    theme: ThemeDefinition = view === "editor" ? draftTheme : selectedTheme,
    companion: CompanionDefinition | null = companionForTheme(theme),
    settingsSnapshot: UserSettings = settingsRef.current,
    options: {
      preserveSelection?: boolean;
      successMessage?: ApplySuccessMessage;
      variant?: ThemeVariantName;
    } = {},
  ) {
    if (needsManualRestart) {
      setRestartError(null);
      setPendingApplication({
        theme,
        companion,
        settings: settingsSnapshot,
        variant: options.variant ?? settingsSnapshot.themeVariant,
        preserveSelection: options.preserveSelection ?? false,
        successMessage: options.successMessage ?? "configurationApplied",
      });
      return;
    }
    void performApply(theme, companion, settingsSnapshot, options);
  }

  async function handleQuitAndApply() {
    if (!pendingApplication) return;
    const application = pendingApplication;
    setRestartError(null);
    setBusy(true);
    try {
      const detected = await quitCodex(application.settings.codexInstallPath);
      syncDetection(detected);
      setPendingApplication(null);
      setRestartError(null);
      await performApply(
        application.theme,
        application.companion,
        application.settings,
        {
          preserveSelection: application.preserveSelection,
          successMessage: application.successMessage,
          variant: application.variant,
        },
      );
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : String(error);
      setRestartError(runtimeFailureMessage(detail));
      setToast(t("codexQuitFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    if (busy) return;
    const revision = ++applyRevisionRef.current;
    setBusy(true);
    try {
      setRuntime(await pauseTheme());
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      await recoverRuntimeFailure(detail, revision);
      setToast(`${t("applyFailed")}: ${runtimeFailureMessage(detail)}`);
    } finally {
      if (revision === applyRevisionRef.current) setBusy(false);
    }
  }

  async function handleRestore() {
    if (busy) return;
    const revision = ++applyRevisionRef.current;
    setBusy(true);
    try {
      const restored = await restoreOfficial();
      if (revision !== applyRevisionRef.current) return;
      dispatchSession({ type: "runtime/reset", runtime: restored });
      setLastAppliedTheme(null);
      setToast(t("restore"));
    } catch (error) {
      if (revision !== applyRevisionRef.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      await recoverRuntimeFailure(detail, revision);
      setToast(`${t("restoreFailed")}: ${runtimeFailureMessage(detail)}`);
    } finally {
      if (revision === applyRevisionRef.current) setBusy(false);
    }
  }

  async function handleCheckForUpdates(manual = true) {
    setUpdateStatus("checking");
    try {
      const result = await checkForUpdates(locale);
      const checkedAt = new Date().toISOString();
      setCurrentVersion(result.currentVersion);
      updateSettings({ lastUpdateCheckAt: checkedAt });
      setUpdateStatus("current");
      if (
        result.update &&
        (manual || result.update.version !== settings.skippedUpdateVersion)
      ) {
        setAvailableUpdate(result.update);
        setUpdateInstallStatus("idle");
        setUpdateProgress(null);
      } else if (manual) {
        setToast(t("upToDate"));
      }
    } catch (error) {
      console.error(error);
      setUpdateStatus("error");
      if (manual) setToast(t("updateCheckFailed"));
    }
  }

  async function handleDownloadAndInstallUpdate() {
    if (!availableUpdate || updateInstallStatus !== "idle") return;
    let downloaded = 0;
    let contentLength: number | null = null;
    setUpdateInstallStatus("downloading");
    setUpdateProgress(0);
    try {
      await downloadAndInstallUpdate((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength;
          downloaded = 0;
          setUpdateProgress(contentLength ? 0 : null);
          return;
        }
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setUpdateProgress(
            contentLength
              ? Math.min(100, Math.round((downloaded / contentLength) * 100))
              : null,
          );
          return;
        }
        setUpdateProgress(100);
        setUpdateInstallStatus("installing");
      });
      setUpdateInstallStatus("restarting");
      await restartApp();
    } catch (error) {
      console.error(error);
      setUpdateInstallStatus("idle");
      setUpdateProgress(null);
      setToast(t("updateInstallFailed"));
    }
  }

  function updateSettings(patch: Partial<UserSettings>): UserSettings {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    return next;
  }

  function handleSettingsChange(patch: Partial<UserSettings>) {
    const next = updateSettings(patch);
    const affectsRuntime =
      Object.prototype.hasOwnProperty.call(patch, "runtimeStrategy") ||
      Object.prototype.hasOwnProperty.call(patch, "reduceMotion");
    if (isLive && affectsRuntime) {
      void performApply(
        appliedTheme,
        companionForTheme(appliedTheme, next),
        next,
        {
          preserveSelection: true,
          successMessage: "configurationApplied",
          variant: next.themeVariant,
        },
      );
    }
  }

  async function handleChooseCodexInstall() {
    setInstallPathBusy(true);
    try {
      const platform = detection?.platform ?? navigator.platform;
      const path = await chooseCodexInstallPath(platform.toLowerCase());
      if (!path) return;
      if (!(await validateCodexInstallPath(path))) {
        setToast(t("codexPathInvalid"));
        return;
      }
      updateSettings({ codexInstallPath: path });
      syncDetection(await detectCodex(path));
      setToast(t("codexPathSaved"));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setToast(`${t("codexPathInvalid")}: ${detail}`);
    } finally {
      setInstallPathBusy(false);
    }
  }

  async function handleUseAutomaticCodexInstall() {
    setInstallPathBusy(true);
    try {
      updateSettings({ codexInstallPath: null });
      syncDetection(await detectCodex(null));
      setToast(t("automaticDetectionRestored"));
    } finally {
      setInstallPathBusy(false);
    }
  }

  async function handleRunDiagnostics() {
    setDiagnosticsBusy(true);
    try {
      setDiagnosticsReport(
        await collectDiagnostics(settingsRef.current.codexInstallPath),
      );
    } catch (error) {
      console.error(error);
      setToast(t("diagnosticsFailed"));
    } finally {
      setDiagnosticsBusy(false);
    }
  }

  function startWindowDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !("__TAURI_INTERNALS__" in window)) return;
    void getCurrentWindow().startDragging();
  }

  function chooseTheme(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
    if (isLive) {
      void performApply(
        theme,
        companionForTheme(theme, settingsRef.current),
        settingsRef.current,
        {
          successMessage: "themeApplied",
          variant: settingsRef.current.themeVariant,
        },
      );
    }
  }

  function chooseVariant(nextVariant: ThemeVariantName) {
    if (nextVariant === settingsRef.current.themeVariant) return;
    const next = updateSettings({ themeVariant: nextVariant });
    dispatchSession({ type: "selection/variant", variant: nextVariant });
    if (isLive) {
      void performApply(
        appliedTheme,
        companionForTheme(appliedTheme, next),
        next,
        {
          preserveSelection: true,
          successMessage: "themeApplied",
          variant: nextVariant,
        },
      );
    }
  }

  function updateVariant(
    section: "background" | "appearance" | "motion",
    key: string,
    value: number | string,
    historyGroup?: string,
  ) {
    commitThemeDraft(
      (next) => {
        assignThemeVariantField(next, variant, section, key, value);
        return next;
      },
      historyGroup ?? `${variant}.${section}.${key}`,
    );
  }

  function setThemeColorHarmony(recipe: ThemeColorHarmonyId) {
    commitThemeDraft((next) => {
      assignThemeColorHarmony(next, variant, recipe);
      return next;
    }, `${variant}.appearance.color-harmony`);
  }

  function addSceneLayer(type: "image" | "gradient" | "vignette") {
    commitThemeDraft((next) => {
      if (next.scene.layers.length >= 8) return next;
      const suffix = `${Date.now().toString(36)}-${next.scene.layers.length + 1}`;
      const image = next.variants[variant].background.image;
      next.scene.layers.push({
        id: `${type}-${suffix}`.slice(0, 39),
        type,
        ...(type === "image" && image ? { asset: image } : {}),
        opacity: type === "vignette" ? 0.3 : type === "gradient" ? 0.22 : 0.7,
        blendMode: type === "vignette" ? "multiply" : "normal",
        parallax: type === "image" ? 5 : 0,
      });
      return next;
    });
  }

  function updateSceneLayer(
    layerId: string,
    patch: Partial<ThemeDefinition["scene"]["layers"][number]>,
  ) {
    commitThemeDraft(
      (next) => {
        const layer = next.scene.layers.find((item) => item.id === layerId);
        if (!layer) return next;
        Object.assign(layer, patch);
        return next;
      },
      `scene.${layerId}.${Object.keys(patch).sort().join("-")}`,
    );
  }

  function removeSceneLayer(layerId: string) {
    commitThemeDraft((next) => {
      next.scene.layers = next.scene.layers.filter(
        (item) => item.id !== layerId,
      );
      return next;
    });
  }

  function setRecommendedCompanion(companionId: string | null) {
    commitThemeDraft((next) => {
      if (companionId) {
        next.metadata.recommendedCompanionId = companionId;
      } else {
        delete next.metadata.recommendedCompanionId;
      }
      return next;
    });
  }

  function commitSelectedCompanionOverrides(next: UserSettings) {
    if (!selectedCompanion) return;
    dispatchSession({
      type: "selection/companion-overrides",
      companionOverrides: companionOverridesFor(selectedCompanion, next),
    });
    scheduleLiveCompanionSync(next);
  }

  function updateEntitySize(size: number) {
    if (!selectedCompanion) return;
    const current = settingsRef.current;
    const next = updateSettings({
      companionSizes: {
        ...current.companionSizes,
        [selectedCompanion.id]: size,
      },
    });
    commitSelectedCompanionOverrides(next);
  }

  function updateEntityAnchor(anchor: { x: number; y: number }) {
    if (!selectedCompanion) return;
    const current = settingsRef.current;
    const next = updateSettings({
      companionAnchors: {
        ...current.companionAnchors,
        [selectedCompanion.id]: anchor,
      },
    });
    commitSelectedCompanionOverrides(next);
  }

  function updateEntityAttachment(attachment: EntityAttachment | null) {
    if (!selectedCompanion) return;
    const current = settingsRef.current;
    const next = updateSettings({
      companionAttachments: {
        ...current.companionAttachments,
        [selectedCompanion.id]: attachment,
      },
    });
    commitSelectedCompanionOverrides(next);
  }

  function setEntityPlacementMode(mode: SelectableCompanionPlacementMode) {
    if (!selectedCompanion) return;
    const current = settingsRef.current;
    const hasAttachmentOverride = Object.prototype.hasOwnProperty.call(
      current.companionAttachments,
      selectedCompanion.id,
    );
    const currentPlacement = {
      anchor:
        current.companionAnchors[selectedCompanion.id] ??
        selectedCompanion.entity.anchor,
      attachment: hasAttachmentOverride
        ? current.companionAttachments[selectedCompanion.id]
        : (selectedCompanion.entity.attachment ?? null),
    };
    if (resolveCompanionPlacementMode(currentPlacement.attachment) === mode) {
      return;
    }
    const placement = applyCompanionPlacementMode(
      mode,
      currentPlacement,
      selectedCompanion.entity.attachment,
    );
    const next = updateSettings({
      companionAnchors: {
        ...current.companionAnchors,
        [selectedCompanion.id]: placement.anchor,
      },
      companionAttachments: {
        ...current.companionAttachments,
        [selectedCompanion.id]: placement.attachment,
      },
    });
    commitSelectedCompanionOverrides(next);
  }

  function resetEntityPlacement() {
    if (!selectedCompanion) return;
    const current = settingsRef.current;
    const companionAnchors = { ...current.companionAnchors };
    const companionSizes = { ...current.companionSizes };
    const companionAttachments = { ...current.companionAttachments };
    delete companionAnchors[selectedCompanion.id];
    delete companionSizes[selectedCompanion.id];
    delete companionAttachments[selectedCompanion.id];
    const next = updateSettings({
      companionAnchors,
      companionSizes,
      companionAttachments,
    });
    commitSelectedCompanionOverrides(next);
  }

  function selectCompanion(companion: CompanionDefinition | null) {
    if (liveCompanionSyncRef.current !== null) {
      window.clearTimeout(liveCompanionSyncRef.current);
      liveCompanionSyncRef.current = null;
    }
    const next = updateSettings({
      companionMode: companion ? "custom" : "disabled",
      companionId: companion?.id ?? null,
    });
    selectCompanionInSession(companion, next);
    if (isLive) {
      void performCompanionUpdate(
        appliedTheme,
        companion,
        next,
        "companionApplied",
      );
    }
  }

  function scheduleLiveCompanionSync(nextSettings: UserSettings) {
    if (!isLive) return;
    if (liveCompanionSyncRef.current !== null) {
      window.clearTimeout(liveCompanionSyncRef.current);
    }
    const theme = appliedTheme;
    const companion = companionForTheme(theme, nextSettings);
    liveCompanionSyncRef.current = window.setTimeout(() => {
      liveCompanionSyncRef.current = null;
      void performCompanionUpdate(
        theme,
        companion,
        nextSettings,
        "companionPositionApplied",
      );
    }, 180);
  }

  function resetDraft() {
    commitThemeDraft(() => structuredClone(selectedTheme));
    setToast(t("resetTheme"));
  }

  function handleUndoThemeDraft() {
    undoThemeDraft();
    setToast(t("themeChangeUndone"));
  }

  function handleRedoThemeDraft() {
    redoThemeDraft();
    setToast(t("themeChangeRedone"));
  }

  function navigateTo(nextView: View) {
    if (
      view === "editor" &&
      nextView !== "editor" &&
      session.draft.themeDirty
    ) {
      pendingNavigationTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPendingNavigation(nextView);
      return;
    }
    if (nextView === "settings") setSettingsFocusRequest(null);
    setView(nextView);
  }

  function openSettingsTarget(target: "codex" | "diagnostics") {
    setToast(null);
    setSettingsFocusRequest((current) => ({
      target,
      revision: (current?.revision ?? 0) + 1,
    }));
    setView("settings");
  }

  function cancelPendingNavigation() {
    const trigger = pendingNavigationTriggerRef.current;
    pendingNavigationTriggerRef.current = null;
    setPendingNavigation(null);
    window.setTimeout(() => trigger?.focus(), 0);
  }

  async function saveAndNavigate() {
    if (!pendingNavigation) return;
    const nextView = pendingNavigation;
    if (!(await saveDraftTheme())) return;
    pendingNavigationTriggerRef.current = null;
    setPendingNavigation(null);
    setView(nextView);
  }

  function discardAndNavigate() {
    if (!pendingNavigation) return;
    const nextView = pendingNavigation;
    resetThemeDraft(selectedTheme);
    pendingNavigationTriggerRef.current = null;
    setPendingNavigation(null);
    setView(nextView);
  }

  function openLocalThemeEditor(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
    resetThemeDraft(theme);
    setView("editor");
  }

  function openThemeEditor(theme: ThemeDefinition) {
    if (localThemes.some((item) => item.id === theme.id)) {
      openLocalThemeEditor(theme);
      return;
    }
    void duplicateTheme(theme);
  }

  async function duplicateTheme(theme: ThemeDefinition) {
    setBusy(true);
    try {
      const duplicate = structuredClone(theme);
      duplicate.id =
        "local." +
        theme.id.split(".").at(-1) +
        "-" +
        Math.random().toString(36).slice(2, 7);
      duplicate.version = "0.1.0";
      duplicate.metadata.name += " Copy";
      if (duplicate.locales.en) {
        duplicate.locales.en.name += " Copy";
      }
      if (duplicate.locales["zh-CN"]) {
        duplicate.locales["zh-CN"].name += " 副本";
      }
      const assetMap = await persistThemeCopy(duplicate, (_, path) =>
        resolveAsset(theme, path),
      );
      setThemeAssetMaps((current) => ({
        ...current,
        [duplicate.id]: assetMap,
      }));
      const next = [duplicate, ...localThemes];
      setLocalThemes(next);
      saveLocalThemes(next);
      setSelectedTheme(duplicate);
      resetThemeDraft(duplicate);
      setToast(t("savedCopy"));
      setThemeCollection("mine");
      setView("editor");
    } catch (error) {
      console.error(error);
      setToast(themePersistenceMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importTheme(file);
      const importedTheme = imported.themePackage.theme;
      const next = [
        importedTheme,
        ...localThemes.filter((theme) => theme.id !== importedTheme.id),
      ];
      setThemeAssetMaps((current) => ({
        ...current,
        [importedTheme.id]: imported.assetMap,
      }));
      setLocalThemes(next);
      saveLocalThemes(next);
      setSelectedTheme(importedTheme);
      setToast(t("imported"));
      setThemeCollection("mine");
      setView("themes");
    } catch (error) {
      console.error(error);
      setToast(t("invalidTheme"));
    } finally {
      event.target.value = "";
    }
  }

  async function handleCompanionImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importCompanion(file);
      const next = [
        imported.companion,
        ...localCompanions.filter(
          (companion) => companion.id !== imported.companion.id,
        ),
      ];
      setCompanionAssetMaps((current) => ({
        ...current,
        [imported.companion.id]: imported.assetMap,
      }));
      setLocalCompanions(next);
      saveLocalCompanions(next);
      setCompanionCollection("mine");
      selectCompanion(imported.companion);
      setToast(t("companionImported"));
      setView("companions");
    } catch (error) {
      console.error(error);
      setToast(t("invalidCompanion"));
    } finally {
      event.target.value = "";
    }
  }

  async function handleSavedCompanion(
    companion: CompanionDefinition,
    files: Map<string, Uint8Array>,
  ) {
    const assetMap = await persistCompanion(companion, files);
    const next = [
      companion,
      ...localCompanions.filter((item) => item.id !== companion.id),
    ];
    setCompanionAssetMaps((current) => ({
      ...current,
      [companion.id]: assetMap,
    }));
    setLocalCompanions(next);
    saveLocalCompanions(next);
    setCompanionCollection("mine");
    selectCompanion(companion);
    setCompanionProjects(await listCompanionProjects().catch(() => []));
    setView("companions");
    setToast(t("companionSaved"));
  }

  async function handleDeleteCompanionProject() {
    if (!pendingCompanionProjectDelete) return;
    const projectId = pendingCompanionProjectDelete.id;
    try {
      await deleteCompanionProject(projectId);
      setCompanionProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
      setPendingCompanionProjectDelete(null);
      setToast(t("draftDeleted"));
    } catch (error) {
      console.error(error);
      setToast(t("companionProjectDeleteFailed"));
    }
  }

  async function handleExportCompanion(companion: CompanionDefinition) {
    try {
      await exportCompanion(
        companion,
        (path) =>
          companionAssetMaps[companion.id]?.[path] ??
          themeAssetUrl(selectedTheme, path),
      );
      setToast(t("companionExported"));
    } catch (error) {
      console.error(error);
      setToast(t("invalidCompanion"));
    }
  }

  async function handleDeleteCompanion() {
    if (!pendingCompanionDelete) return;
    const companionId = pendingCompanionDelete.id;
    try {
      await deleteCompanionArchive(companionId);
      const next = localCompanions.filter((item) => item.id !== companionId);
      setLocalCompanions(next);
      saveLocalCompanions(next);
      setCompanionAssetMaps((current) => {
        for (const url of Object.values(current[companionId] ?? {})) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        }
        const remaining = { ...current };
        delete remaining[companionId];
        return remaining;
      });
      if (settingsRef.current.companionId === companionId) {
        selectCompanion(null);
      }
      setPendingCompanionDelete(null);
      setToast(t("companionDeleted"));
    } catch (error) {
      console.error(error);
      setToast(t("invalidCompanion"));
    }
  }

  async function handleBackgroundImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const generated = await createAdaptiveTheme(file);
      if (backgroundImportMode === "replace") {
        const replacement = structuredClone(draftTheme);
        replacement.variants = structuredClone(generated.theme.variants);
        replacement.scene.layers = structuredClone(
          generated.theme.scene.layers,
        );
        replacement.assets = structuredClone(generated.theme.assets);
        delete replacement.metadata.preview;
        const assetMap = await persistGeneratedTheme(
          replacement,
          generated.files,
        );
        const next = [
          replacement,
          ...localThemes.filter((theme) => theme.id !== replacement.id),
        ];
        setThemeAssetMaps((current) => ({
          ...current,
          [replacement.id]: assetMap,
        }));
        setLocalThemes(next);
        saveLocalThemes(next);
        setSelectedTheme(structuredClone(replacement));
        resetThemeDraft(replacement);
        setAdaptiveSchemes(generated.schemes);
        setActiveAdaptiveScheme(generated.selectedSchemeId);
        setToast(t("themeImageUpdated"));
        return;
      }
      const assetMap = await persistGeneratedTheme(
        generated.theme,
        generated.files,
      );
      const next = [
        generated.theme,
        ...localThemes.filter((theme) => theme.id !== generated.theme.id),
      ];
      setThemeAssetMaps((current) => ({
        ...current,
        [generated.theme.id]: assetMap,
      }));
      setLocalThemes(next);
      saveLocalThemes(next);
      setSelectedTheme(generated.theme);
      resetThemeDraft(generated.theme);
      setAdaptiveSchemes(generated.schemes);
      setActiveAdaptiveScheme(generated.selectedSchemeId);
      setThemeCollection("mine");
      setView("editor");
      setToast(t("adaptiveThemeCreated"));
    } catch (error) {
      console.error(error);
      setToast(t("imageImportFailed"));
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  function selectAdaptiveScheme(scheme: AdaptiveScheme) {
    setActiveAdaptiveScheme(scheme.id);
    commitThemeDraft((next) => {
      next.variants = structuredClone(scheme.variants);
      return next;
    });
  }

  async function handleExport() {
    try {
      await exportTheme(
        view === "editor" ? draftTheme : selectedTheme,
        resolveAsset,
      );
      setToast(t("exportReady"));
    } catch (error) {
      console.error(error);
      setToast(themePersistenceMessage(error));
    }
  }

  function handleCreateBlankTheme() {
    const theme = createBlankTheme();
    const next = [theme, ...localThemes];
    setLocalThemes(next);
    saveLocalThemes(next);
    setSelectedTheme(theme);
    resetThemeDraft(theme);
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setThemeCollection("mine");
    setNewThemeStep(null);
    setView("editor");
    setToast(t("blankThemeCreated"));
  }

  async function saveDraftTheme() {
    if (busy) return false;
    setBusy(true);
    const revision = ++applyRevisionRef.current;
    dispatchSession({ type: "operation/start", revision, phase: "saving" });
    try {
      const assetMap = draftTheme.assets.length
        ? await persistThemeCopy(draftTheme, resolveAsset)
        : {};
      const next = [
        structuredClone(draftTheme),
        ...localThemes.filter((theme) => theme.id !== draftTheme.id),
      ];
      setThemeAssetMaps((current) => ({
        ...current,
        [draftTheme.id]: assetMap,
      }));
      setLocalThemes(next);
      saveLocalThemes(next);
      setSelectedTheme(structuredClone(draftTheme));
      setToast(t("themeSaved"));
      breakThemeHistoryGroup();
      dispatchSession({ type: "operation/complete", revision });
      return true;
    } catch (error) {
      console.error(error);
      setToast(themePersistenceMessage(error));
      dispatchSession({
        type: "operation/error",
        revision,
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveAndApplyDraft() {
    if (session.draft.themeDirty && !(await saveDraftTheme())) return;
    requestApply(draftTheme);
  }

  function changeThemeCollection(collection: ThemeCollection) {
    setThemeCollection(collection);
  }

  async function handleDeleteTheme() {
    if (!pendingDelete) return;
    const themeId = pendingDelete.id;
    try {
      await deleteThemeArchive(themeId);
      const next = localThemes.filter((theme) => theme.id !== themeId);
      setLocalThemes(next);
      saveLocalThemes(next);
      setThemeAssetMaps((current) => {
        for (const url of Object.values(current[themeId] ?? {})) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        }
        const remaining = { ...current };
        delete remaining[themeId];
        return remaining;
      });
      if (selectedTheme.id === themeId) setSelectedTheme(builtinThemes[0]);
      setPendingDelete(null);
      setToast(t("themeDeleted"));
    } catch (error) {
      console.error(error);
      setToast(t("invalidTheme"));
    }
  }

  const navItems: Array<{ id: View; label: MessageKey; icon: ReactNode }> = [
    { id: "home", label: "home", icon: <Monitor size={17} /> },
    { id: "themes", label: "themes", icon: <Palette size={17} /> },
    { id: "companions", label: "companions", icon: <PawPrint size={17} /> },
    {
      id: "interactions",
      label: "interactions",
      icon: <Gamepad2 size={17} />,
    },
    { id: "settings", label: "settings", icon: <Settings size={17} /> },
  ];
  const activeNavigation =
    view === "editor"
      ? "themes"
      : view === "companion-editor"
        ? "companions"
        : view;
  const focusWorkspace =
    uiPreferences.focusMode &&
    (view === "editor" || view === "companion-editor");
  const showConfigurationDock =
    view !== "editor" && view !== "companion-editor";
  const selectedThemeCopy =
    selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedCompanionCopy = selectedCompanion
    ? (selectedCompanion.locales[locale] ?? selectedCompanion.locales.en)
    : null;
  const onboardingRecommendedCompanion =
    (selectedTheme.metadata.recommendedCompanionId
      ? allCompanions.find(
          (item) => item.id === selectedTheme.metadata.recommendedCompanionId,
        )
      : null) ??
    embeddedCompanionForTheme(selectedTheme) ??
    defaultCompanionForTheme(selectedTheme.id);
  return (
    <div
      className={"app" + (focusWorkspace ? " professional-focus" : "")}
      data-manager-theme={appTheme}
      data-focus-workspace={focusWorkspace ? "true" : "false"}
    >
      <aside className="app-sidebar">
        <div className="app-brand">
          <BrandMark />
          <div>
            <strong>Codex Styler</strong>
            <span>{t("unofficial")}</span>
          </div>
        </div>

        <nav className="app-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={
                activeNavigation === item.id
                  ? "app-nav__item app-nav__item--active"
                  : "app-nav__item"
              }
              onClick={() => navigateTo(item.id)}
            >
              {item.icon}
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar__spacer" />

        <div className="app-version">
          <ShieldCheck size={13} />
          <span>{t("version")}</span>
        </div>
      </aside>

      <main
        className="app-main"
        data-has-configuration-dock={showConfigurationDock ? "true" : "false"}
      >
        <header className="app-topbar">
          <div
            className="window-drag-region"
            data-tauri-drag-region
            onMouseDown={startWindowDrag}
            aria-hidden="true"
          />
          <div className="topbar-status" data-state={configuration.state}>
            <span className="topbar-status__dot" />
            {t(configuration.topbarKey)}
          </div>
          <div className="preview-variant-control">
            <span title={t("codexAppearanceDescription")}>
              {t("codexAppearance")}
            </span>
            <span id="codex-appearance-description" className="visually-hidden">
              {t("codexAppearanceDescription")}
            </span>
            <div
              className="variant-switch"
              aria-label={t("codexAppearance")}
              aria-describedby="codex-appearance-description"
            >
              <button
                className={variant === "light" ? "is-active" : ""}
                onClick={() => chooseVariant("light")}
                aria-label={t("light")}
              >
                <Sun size={14} />
              </button>
              <button
                className={variant === "dark" ? "is-active" : ""}
                onClick={() => chooseVariant("dark")}
                aria-label={t("dark")}
              >
                <Moon size={14} />
              </button>
            </div>
          </div>
        </header>

        <div
          ref={appMainRef}
          className="app-main__viewport"
          data-view={view}
          data-scroll-surface={
            view === "editor" || view === "companion-editor"
              ? undefined
              : "page"
          }
        >
          {view === "home" && (
            <HomeView
              locale={locale}
              theme={composeTheme(displayedTheme)}
              sourceTheme={displayedTheme}
              companion={companionForTheme(displayedTheme)}
              runtime={runtime}
              runtimeStrategy={settings.runtimeStrategy}
              variant={variant}
              reduceMotion={settings.reduceMotion}
              t={t}
              onEdit={() => openThemeEditor(displayedTheme)}
              onBrowse={() => setView("themes")}
              onCreateFromImage={() => {
                setBackgroundImportMode("create");
                setNewThemeStep(null);
                backgroundImportRef.current?.click();
              }}
              onCompanions={() => setView("companions")}
              resolveAsset={resolveAsset}
            />
          )}

          {view === "themes" && (
            <ThemesView
              locale={locale}
              selectedTheme={selectedTheme}
              previewThemeFor={(theme) => composeTheme(theme)}
              localThemes={localThemes}
              collection={themeCollection}
              variant={variant}
              reduceMotion={settings.reduceMotion}
              t={t}
              onSelect={chooseTheme}
              onEdit={openThemeEditor}
              onDelete={setPendingDelete}
              onCollectionChange={changeThemeCollection}
              onNew={() => setNewThemeStep("choose")}
              onImport={() => importRef.current?.click()}
              resolveAsset={resolveAsset}
              liveThemeId={isLive ? settings.appliedThemeId : null}
              busy={busy}
            />
          )}

          {view === "companions" && (
            <CompanionsView
              locale={locale}
              selected={selectedCompanion}
              previewThemeFor={(companion) =>
                composeTheme(selectedTheme, companion)
              }
              localCompanions={localCompanions}
              projects={companionProjects}
              collection={companionCollection}
              variant={variant}
              reduceMotion={settings.reduceMotion}
              t={t}
              onSelect={selectCompanion}
              onCollectionChange={setCompanionCollection}
              onCreate={() => {
                setActiveCompanionProject(null);
                setView("companion-editor");
              }}
              onEditProject={(project) => {
                setActiveCompanionProject(project);
                setView("companion-editor");
              }}
              onDeleteProject={setPendingCompanionProjectDelete}
              onImport={() => companionImportRef.current?.click()}
              onExport={(companion) => void handleExportCompanion(companion)}
              onDelete={setPendingCompanionDelete}
              selectedSize={
                selectedCompanion
                  ? (settings.companionSizes[selectedCompanion.id] ??
                    selectedCompanion.entity.size)
                  : null
              }
              placementCustomized={Boolean(
                selectedCompanion &&
                (Object.prototype.hasOwnProperty.call(
                  settings.companionAnchors,
                  selectedCompanion.id,
                ) ||
                  Object.prototype.hasOwnProperty.call(
                    settings.companionSizes,
                    selectedCompanion.id,
                  ) ||
                  Object.prototype.hasOwnProperty.call(
                    settings.companionAttachments,
                    selectedCompanion.id,
                  )),
              )}
              placementMode={
                selectedCompanion
                  ? resolveCompanionPlacementMode(
                      Object.prototype.hasOwnProperty.call(
                        settings.companionAttachments,
                        selectedCompanion.id,
                      )
                        ? settings.companionAttachments[selectedCompanion.id]
                        : selectedCompanion.entity.attachment,
                    )
                  : "free"
              }
              onSizeChange={updateEntitySize}
              onPlacementModeChange={setEntityPlacementMode}
              onResetPlacement={resetEntityPlacement}
              onAnchorChange={updateEntityAnchor}
              onAttachmentChange={updateEntityAttachment}
              resolveAsset={resolveAsset}
              resolveCompanionAsset={(companion, path) =>
                companionAssetMaps[companion.id]?.[path] ??
                themeAssetUrl(selectedTheme, path)
              }
              isLive={isLive}
              busy={busy}
            />
          )}

          {view === "interactions" && (
            <InteractionsView
              mode={settings.composerInteractionMode}
              t={t}
              onChange={(composerInteractionMode) =>
                handleSettingsChange({ composerInteractionMode })
              }
            />
          )}

          {view === "companion-editor" && (
            <Suspense
              fallback={
                <main className="page companion-creator">
                  <section className="empty-state" aria-live="polite">
                    <PawPrint aria-hidden="true" />
                    <h2>{t("loadingCompanionStudio")}</h2>
                  </section>
                </main>
              }
            >
              <CompanionCreator
                locale={locale}
                initialProject={activeCompanionProject}
                onBack={() => {
                  void listCompanionProjects()
                    .then(setCompanionProjects)
                    .finally(() => setView("companions"));
                }}
                onSaved={handleSavedCompanion}
              />
            </Suspense>
          )}

          {view === "editor" && (
            <ThemeEditorView
              theme={composeTheme(draftTheme)}
              savedTheme={composeTheme(selectedTheme)}
              variant={variant}
              locale={locale}
              reduceMotion={settings.reduceMotion}
              t={t}
              onUpdateVariant={updateVariant}
              onSetColorHarmony={setThemeColorHarmony}
              onAddSceneLayer={addSceneLayer}
              onUpdateSceneLayer={updateSceneLayer}
              onRemoveSceneLayer={removeSceneLayer}
              companions={allCompanions}
              recommendedCompanionId={
                draftTheme.metadata.recommendedCompanionId ?? null
              }
              onSetRecommendedCompanion={setRecommendedCompanion}
              onBack={() => {
                setThemeCollection("mine");
                navigateTo("themes");
              }}
              onReset={resetDraft}
              onUndo={handleUndoThemeDraft}
              onRedo={handleRedoThemeDraft}
              onSave={() => void saveDraftTheme()}
              onApply={() => void saveAndApplyDraft()}
              onExport={handleExport}
              onImportBackground={() => {
                setBackgroundImportMode("replace");
                backgroundImportRef.current?.click();
              }}
              adaptiveSchemes={adaptiveSchemes}
              activeAdaptiveScheme={activeAdaptiveScheme}
              onSelectAdaptiveScheme={selectAdaptiveScheme}
              resolveAsset={resolveAsset}
              busy={busy}
              dirty={session.draft.themeDirty}
              operationPhase={session.operation.phase}
              operationError={
                session.operation.phase === "error"
                  ? runtime.state === "error" && runtime.message
                    ? runtimeFailureMessage(runtime.message)
                    : t("themeSaveFailed")
                  : null
              }
              applied={isDraftApplied}
              canUndo={canUndoThemeDraft}
              canRedo={canRedoThemeDraft}
              uiPreferences={uiPreferences}
              onUiPreferencesChange={(patch) =>
                setUiPreferences((current) => ({ ...current, ...patch }))
              }
            />
          )}

          {view === "settings" && (
            <SettingsView
              locale={locale}
              settings={settings}
              detection={detection}
              currentVersion={currentVersion}
              updateStatus={updateStatus}
              t={t}
              onChange={handleSettingsChange}
              installPathBusy={installPathBusy}
              onChooseCodexInstall={handleChooseCodexInstall}
              onUseAutomaticCodexInstall={handleUseAutomaticCodexInstall}
              onCheckForUpdates={() => void handleCheckForUpdates(true)}
              diagnosticsBusy={diagnosticsBusy}
              onRunDiagnostics={() => void handleRunDiagnostics()}
              onOpenOnboarding={() => setShowOnboarding(true)}
              focusRequest={settingsFocusRequest}
            />
          )}
        </div>

        {showConfigurationDock && (
          <ConfigurationDock
            themeName={selectedThemeCopy.name}
            companionName={selectedCompanionCopy?.name ?? t("noCompanion")}
            statusLabel={t(configuration.statusKey)}
            statusDetail={t(configuration.detailKey)}
            actionLabel={t(configuration.actionLabelKey)}
            state={configuration.state}
            action={configuration.action}
            busy={configuration.state === "applying"}
            disabled={busy}
            t={t}
            onAction={() => {
              if (configuration.action === "pause") {
                void handlePause();
              } else if (configuration.action === "settings") {
                openSettingsTarget("codex");
              } else if (configuration.action === "diagnostics") {
                openSettingsTarget("diagnostics");
              } else {
                requestApply();
              }
            }}
            onRestore={() => void handleRestore()}
          />
        )}
      </main>

      <input
        ref={importRef}
        type="file"
        className="visually-hidden"
        accept=".codex-styler-theme"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleImport}
      />
      <input
        ref={backgroundImportRef}
        type="file"
        className="visually-hidden"
        accept="image/png,image/jpeg,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleBackgroundImport}
      />
      <input
        ref={companionImportRef}
        type="file"
        className="visually-hidden"
        accept=".codex-styler-companion"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleCompanionImport}
      />

      {showOnboarding && (
        <Onboarding
          isFirstRun={!settings.onboardingComplete}
          locale={locale}
          detection={detection}
          selectedTheme={selectedTheme}
          previewTheme={composeTheme(selectedTheme)}
          selectedCompanion={selectedCompanion}
          recommendedCompanion={onboardingRecommendedCompanion}
          variant={variant}
          reduceMotion={settings.reduceMotion}
          requiresRestart={needsManualRestart}
          onSelectTheme={setSelectedTheme}
          onSelectCompanion={selectCompanion}
          onSelectVariant={chooseVariant}
          onApply={() => {
            const next = updateSettings({ onboardingComplete: true });
            setShowOnboarding(false);
            requestApply(
              selectedTheme,
              companionForTheme(selectedTheme, next),
              next,
            );
          }}
          onOpenSettings={() => {
            setView("settings");
            setShowOnboarding(false);
          }}
          resolveAsset={resolveAsset}
          onClose={
            settings.onboardingComplete
              ? () => setShowOnboarding(false)
              : undefined
          }
          t={t}
        />
      )}

      {newThemeStep && (
        <NewThemeDialog
          step={newThemeStep}
          themes={[...builtinThemes, ...localThemes]}
          locale={locale}
          t={t}
          onClose={() => setNewThemeStep(null)}
          onChooseStep={setNewThemeStep}
          onBlank={handleCreateBlankTheme}
          onImage={() => {
            setBackgroundImportMode("create");
            setNewThemeStep(null);
            backgroundImportRef.current?.click();
          }}
          onExisting={(theme) => {
            setNewThemeStep(null);
            void duplicateTheme(theme);
          }}
          resolveAsset={resolveAsset}
        />
      )}

      {pendingDelete && (
        <DeleteThemeDialog
          theme={pendingDelete}
          locale={locale}
          t={t}
          onCancel={() => setPendingDelete(null)}
          onDelete={handleDeleteTheme}
        />
      )}

      {pendingNavigation && (
        <UnsavedThemeDialog
          theme={draftTheme}
          locale={locale}
          t={t}
          busy={busy}
          onCancel={cancelPendingNavigation}
          onDiscard={discardAndNavigate}
          onSave={() => void saveAndNavigate()}
        />
      )}

      {pendingCompanionDelete && (
        <DeleteCompanionDialog
          companion={pendingCompanionDelete}
          locale={locale}
          t={t}
          onCancel={() => setPendingCompanionDelete(null)}
          onDelete={() => void handleDeleteCompanion()}
        />
      )}

      {pendingCompanionProjectDelete && (
        <DeleteCompanionProjectDialog
          project={pendingCompanionProjectDelete}
          t={t}
          onCancel={() => setPendingCompanionProjectDelete(null)}
          onDelete={() => void handleDeleteCompanionProject()}
        />
      )}

      {pendingApplication && (
        <RestartCodexDialog
          t={t}
          busy={busy}
          error={restartError}
          onCancel={() => {
            setPendingApplication(null);
            setRestartError(null);
          }}
          onConfirm={handleQuitAndApply}
        />
      )}

      {diagnosticsReport && (
        <DiagnosticsDialog
          report={diagnosticsReport}
          t={t}
          onClose={() => setDiagnosticsReport(null)}
        />
      )}

      {availableUpdate && (
        <UpdateDialog
          update={availableUpdate}
          installStatus={updateInstallStatus}
          progress={updateProgress}
          t={t}
          onSkip={() => {
            updateSettings({
              skippedUpdateVersion: availableUpdate.version,
            });
            setAvailableUpdate(null);
          }}
          onLater={() => setAvailableUpdate(null)}
          onInstall={() => void handleDownloadAndInstallUpdate()}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
