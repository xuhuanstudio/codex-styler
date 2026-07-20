import {
  Check,
  ChevronRight,
  Copy,
  Download,
  Film,
  FolderOpen,
  Image,
  Layers3,
  Leaf,
  LockKeyhole,
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
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
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
import {
  collectDiagnostics,
  diagnosticsSummary,
  exportDiagnostics,
  openWindowsCompatibilityIssue,
  type DiagnosticsReport,
} from "./lib/diagnostics";
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
  CompanionsView,
  type CompanionCollection,
} from "./features/companions/CompanionsView";
import { ThemeEditorView } from "./features/theme-editor/ThemeEditorView";
import {
  themeDraftsEqual,
  useThemeDraftHistory,
} from "./features/theme-editor/use-theme-draft-history";

type View =
  "home" | "themes" | "companions" | "settings" | "editor" | "companion-editor";
type NewThemeStep = "choose" | "existing";
type UpdateStatus = "idle" | "checking" | "current" | "error";
type UpdateInstallStatus = "idle" | "downloading" | "installing" | "restarting";
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
  const [currentVersion, setCurrentVersion] = useState("0.2.0-beta.7");
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
          composerMomentsEnabled: settingsSnapshot.composerMomentsEnabled,
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
          composerMomentsEnabled: settingsSnapshot.composerMomentsEnabled,
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
      Object.prototype.hasOwnProperty.call(patch, "reduceMotion") ||
      Object.prototype.hasOwnProperty.call(patch, "composerMomentsEnabled");
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
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-theme-title"
          >
            <span className="confirm-dialog__icon">
              <Trash2 size={18} />
            </span>
            <h2 id="delete-theme-title">{t("deleteThemeTitle")}</h2>
            <p>{t("deleteThemeBody")}</p>
            <strong>
              {pendingDelete.locales[locale]?.name ??
                pendingDelete.metadata.name}
            </strong>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setPendingDelete(null)}
              >
                {t("cancel")}
              </button>
              <button className="danger-button" onClick={handleDeleteTheme}>
                <Trash2 size={14} />
                {t("deleteTheme")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingNavigation && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog confirm-dialog--unsaved"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-theme-title"
            aria-describedby="unsaved-theme-description"
          >
            <span className="confirm-dialog__icon confirm-dialog__icon--draft">
              <Save size={18} />
            </span>
            <h2 id="unsaved-theme-title">{t("unsavedThemeTitle")}</h2>
            <p id="unsaved-theme-description">{t("unsavedThemeBody")}</p>
            <strong>
              {draftTheme.locales[locale]?.name ?? draftTheme.metadata.name}
            </strong>
            <div className="button-row button-row--unsaved">
              <button
                className="secondary-button"
                onClick={cancelPendingNavigation}
                disabled={busy}
                autoFocus
              >
                {t("keepEditing")}
              </button>
              <button
                className="danger-button danger-button--quiet"
                onClick={discardAndNavigate}
                disabled={busy}
              >
                {t("discardChanges")}
              </button>
              <button
                className="primary-button"
                onClick={() => void saveAndNavigate()}
                disabled={busy}
              >
                <Save size={14} />
                {busy ? t("saving") : t("saveAndLeave")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingCompanionDelete && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-companion-title"
          >
            <span className="confirm-dialog__icon">
              <Trash2 size={18} />
            </span>
            <h2 id="delete-companion-title">{t("deleteCompanionTitle")}</h2>
            <p>{t("deleteCompanionBody")}</p>
            <strong>
              {pendingCompanionDelete.locales[locale]?.name ??
                pendingCompanionDelete.name}
            </strong>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setPendingCompanionDelete(null)}
              >
                {t("cancel")}
              </button>
              <button
                className="danger-button"
                onClick={() => void handleDeleteCompanion()}
              >
                <Trash2 size={14} />
                {t("deleteCompanion")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingCompanionProjectDelete && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-companion-project-title"
          >
            <span className="confirm-dialog__icon">
              <Trash2 size={18} />
            </span>
            <h2 id="delete-companion-project-title">{t("deleteDraftTitle")}</h2>
            <p>{t("deleteDraftBody")}</p>
            <strong>{pendingCompanionProjectDelete.name}</strong>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setPendingCompanionProjectDelete(null)}
              >
                {t("cancel")}
              </button>
              <button
                className="danger-button"
                onClick={() => void handleDeleteCompanionProject()}
              >
                <Trash2 size={14} />
                {t("deleteDraft")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingApplication && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog confirm-dialog--restart"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restart-codex-title"
          >
            <span className="confirm-dialog__icon">
              <RefreshCw size={18} />
            </span>
            <h2 id="restart-codex-title">{t("quitCodexTitle")}</h2>
            <p>{t("quitCodexBody")}</p>
            {restartError && (
              <p className="confirm-dialog__error" role="alert">
                {t("restartFailedDetail")}: {restartError}
              </p>
            )}
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => {
                  setPendingApplication(null);
                  setRestartError(null);
                }}
                disabled={busy}
              >
                {t("cancel")}
              </button>
              <button
                className="primary-button"
                onClick={handleQuitAndApply}
                disabled={busy}
              >
                <RefreshCw size={14} className={busy ? "is-spinning" : ""} />
                {busy
                  ? t("restartingCodex")
                  : restartError
                    ? t("retryRestart")
                    : t("quitAndContinue")}
              </button>
            </div>
          </section>
        </div>
      )}

      {diagnosticsReport && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="diagnostics-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnostics-title"
            data-scroll-surface="panel"
          >
            <header>
              <span className="confirm-dialog__icon">
                <ShieldCheck size={18} />
              </span>
              <div>
                <span className="page-kicker">LOCAL REDACTED REPORT</span>
                <h2 id="diagnostics-title">{t("diagnosticsTitle")}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setDiagnosticsReport(null)}
                aria-label={t("cancel")}
              >
                <X size={15} />
              </button>
            </header>
            <p>{t("diagnosticsPrivacy")}</p>
            <div className="diagnostics-checks">
              {diagnosticsReport.checks.map((check) => (
                <div key={check.id} data-status={check.status}>
                  <span>{check.status}</span>
                  <strong>{check.id}</strong>
                  <small>{check.detail}</small>
                </div>
              ))}
            </div>
            <details>
              <summary>{t("previewDiagnosticText")}</summary>
              <pre data-scroll-surface="canvas">
                {diagnosticsSummary(diagnosticsReport)}
              </pre>
            </details>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={openWindowsCompatibilityIssue}
              >
                <ChevronRight size={14} />
                {t("openCompatibilityIssue")}
              </button>
              <button
                className="primary-button"
                onClick={() => void exportDiagnostics(diagnosticsReport)}
              >
                <Download size={14} />
                {t("exportDiagnostics")}
              </button>
            </div>
          </section>
        </div>
      )}

      {availableUpdate && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog update-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-dialog-title"
          >
            <span className="confirm-dialog__icon update-dialog__icon">
              <Download size={18} />
            </span>
            <div className="update-dialog__heading">
              <span>{t("updateAvailable")}</span>
              <h2 id="update-dialog-title">
                Codex Styler {availableUpdate.version}
              </h2>
              {availableUpdate.prerelease && <small>{t("prerelease")}</small>}
            </div>
            <p>{t("updateAvailableBody")}</p>
            {availableUpdate.releaseNotes ? (
              <div className="update-dialog__notes" data-scroll-surface="panel">
                <strong>{t("releaseNotes")}</strong>
                <p className="update-dialog__summary">
                  {availableUpdate.releaseNotes.summary}
                </p>
                {availableUpdate.releaseNotes.highlights.length > 0 && (
                  <section>
                    <h3>{t("releaseHighlights")}</h3>
                    <ul>
                      {availableUpdate.releaseNotes.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {availableUpdate.releaseNotes.fixes.length > 0 && (
                  <section>
                    <h3>{t("releaseFixes")}</h3>
                    <ul>
                      {availableUpdate.releaseNotes.fixes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ) : availableUpdate.notes ? (
              <div className="update-dialog__notes" data-scroll-surface="panel">
                <strong>{t("releaseNotes")}</strong>
                <p>{availableUpdate.notes}</p>
              </div>
            ) : null}
            {updateInstallStatus !== "idle" && (
              <div className="update-dialog__progress" aria-live="polite">
                <div>
                  <span>
                    {updateInstallStatus === "downloading"
                      ? t("downloadingUpdate")
                      : updateInstallStatus === "installing"
                        ? t("installingUpdate")
                        : t("restartingAfterUpdate")}
                  </span>
                  {updateProgress !== null &&
                    updateInstallStatus === "downloading" && (
                      <strong>{updateProgress}%</strong>
                    )}
                </div>
                <span className="update-dialog__progress-track">
                  <span
                    style={{
                      width:
                        updateProgress === null ? "34%" : `${updateProgress}%`,
                    }}
                  />
                </span>
              </div>
            )}
            <div className="update-dialog__secondary-actions">
              <button
                className="text-button"
                disabled={updateInstallStatus !== "idle"}
                onClick={() => {
                  updateSettings({
                    skippedUpdateVersion: availableUpdate.version,
                  });
                  setAvailableUpdate(null);
                }}
              >
                {t("skipThisVersion")}
              </button>
              <button
                className="secondary-button"
                disabled={updateInstallStatus !== "idle"}
                onClick={() => setAvailableUpdate(null)}
              >
                {t("remindMeLater")}
              </button>
              <button
                className="primary-button"
                disabled={updateInstallStatus !== "idle"}
                onClick={() => void handleDownloadAndInstallUpdate()}
              >
                <Download size={14} />
                {t("downloadAndInstall")}
              </button>
            </div>
          </section>
        </div>
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

interface SharedViewProps {
  locale: Locale;
  t: (key: MessageKey) => string;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}

function NewThemeDialog({
  step,
  themes,
  locale,
  t,
  onClose,
  onChooseStep,
  onBlank,
  onImage,
  onExisting,
  resolveAsset,
}: SharedViewProps & {
  step: NewThemeStep;
  themes: ThemeDefinition[];
  onClose: () => void;
  onChooseStep: (step: NewThemeStep) => void;
  onBlank: () => void;
  onImage: () => void;
  onExisting: (theme: ThemeDefinition) => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="new-theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-theme-title"
      >
        <header className="new-theme-dialog__header">
          <div>
            {step === "existing" && (
              <button
                className="new-theme-dialog__back"
                onClick={() => onChooseStep("choose")}
                aria-label={t("back")}
              >
                <ChevronRight size={15} />
              </button>
            )}
            <span>{t("createTheme")}</span>
            <h2 id="new-theme-title">
              {step === "existing"
                ? t("chooseStartingTheme")
                : t("startYourTheme")}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t("cancel")}
          >
            <X size={16} />
          </button>
        </header>

        {step === "choose" ? (
          <div className="new-theme-options" data-scroll-surface="panel">
            <button
              className="new-theme-option new-theme-option--image"
              onClick={onImage}
            >
              <span className="new-theme-option__icon">
                <Image size={21} />
              </span>
              <span>
                <small>{t("recommended")}</small>
                <strong>{t("createFromImage")}</strong>
                <p>{t("createFromImageLong")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
            <button className="new-theme-option" onClick={onBlank}>
              <span className="new-theme-option__icon">
                <Plus size={21} />
              </span>
              <span>
                <small>{t("cleanStart")}</small>
                <strong>{t("startBlank")}</strong>
                <p>{t("startBlankDetail")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
            <button
              className="new-theme-option"
              onClick={() => onChooseStep("existing")}
            >
              <span className="new-theme-option__icon">
                <Copy size={21} />
              </span>
              <span>
                <small>{t("optionalStartingPoint")}</small>
                <strong>{t("useExistingTheme")}</strong>
                <p>{t("useExistingThemeDetail")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="new-theme-existing-list" data-scroll-surface="panel">
            {themes.map((theme) => {
              const copy = theme.locales[locale] ?? theme.locales.en;
              const preview = theme.metadata.preview
                ? resolveAsset(theme, theme.metadata.preview)
                : undefined;
              return (
                <button key={theme.id} onClick={() => onExisting(theme)}>
                  <span
                    className="new-theme-existing-list__preview"
                    style={{
                      backgroundColor: theme.variants.dark.background.color,
                      backgroundImage: preview ? `url(${preview})` : undefined,
                    }}
                  />
                  <span>
                    <strong>{copy.name}</strong>
                    <small>{copy.description}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
        )}
        <footer className="new-theme-dialog__footer">
          <LockKeyhole size={13} />
          {t("newThemePrivacy")}
        </footer>
      </section>
    </div>
  );
}
