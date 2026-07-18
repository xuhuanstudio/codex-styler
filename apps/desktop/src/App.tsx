import {
  Check,
  ChevronRight,
  Copy,
  Download,
  Film,
  FolderOpen,
  Image,
  Languages,
  Layers3,
  Leaf,
  LockKeyhole,
  Monitor,
  Moon,
  MousePointer2,
  PawPrint,
  Palette,
  PanelRightOpen,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
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
  type ThemeDefinition,
  type ThemeVariant,
} from "@codex-styler/theme-core";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BrandMark } from "./components/BrandMark";
import { Onboarding } from "./components/Onboarding";
import { PreviewWorkspace } from "./components/PreviewWorkspace";
import type { CompanionCreatorProject } from "./features/companion-creator/model";
import {
  deleteCompanionProject,
  listCompanionProjects,
} from "./features/companion-creator/project-files";
import {
  resolveLocale,
  translate,
  type Locale,
  type LocalePreference,
  type MessageKey,
} from "./lib/i18n";
import {
  loadLocalThemes,
  loadLocalCompanions,
  loadSettings,
  saveLocalCompanions,
  saveLocalThemes,
  saveSettings,
  type ManagerAppearance,
  type RuntimeStrategy,
  type UserSettings,
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

type View =
  "home" | "themes" | "companions" | "settings" | "editor" | "companion-editor";
type ThemeCollection = "builtIn" | "mine";
type CompanionCollection = "builtIn" | "mine";
type NewThemeStep = "choose" | "existing";
type ThemeVariantName = "light" | "dark";
type UpdateStatus = "idle" | "checking" | "current" | "error";
type UpdateInstallStatus = "idle" | "downloading" | "installing" | "restarting";
type ApplySuccessMessage =
  | "configurationApplied"
  | "themeApplied"
  | "companionApplied"
  | "companionPositionApplied";
type ConfigurationState =
  "pending" | "applying" | "applied" | "paused" | "fallback" | "error";

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

export function App() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const settingsRef = useRef(settings);
  const [view, setView] = useState<View>("home");
  const [selectedTheme, setSelectedTheme] = useState<ThemeDefinition>(
    builtinThemes[0],
  );
  const [draftTheme, setDraftTheme] = useState<ThemeDefinition>(() =>
    structuredClone(builtinThemes[0]),
  );
  const [variant, setVariant] = useState<ThemeVariantName>("dark");
  const [runtime, setRuntime] = useState<RuntimeStatus>(initialRuntime);
  const [detection, setDetection] = useState<CodexDetection | null>(null);
  const [localThemes, setLocalThemes] =
    useState<ThemeDefinition[]>(loadLocalThemes);
  const [localCompanions, setLocalCompanions] =
    useState<CompanionDefinition[]>(loadLocalCompanions);
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
  const [installPathBusy, setInstallPathBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState("0.2.0-beta.2");
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
  const [pendingApplication, setPendingApplication] = useState<{
    theme: ThemeDefinition;
    companion: CompanionDefinition | null;
    settings: UserSettings;
    preserveSelection: boolean;
    successMessage: ApplySuccessMessage;
  } | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
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
  const selectedCompanion = companionForTheme(selectedTheme);
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
  const configurationState: ConfigurationState =
    runtime.state === "error"
      ? "error"
      : runtime.state === "fallback"
        ? "fallback"
        : runtime.state === "paused"
          ? "paused"
          : runtime.state === "applying" || runtime.state === "launching"
            ? "applying"
            : runtime.state === "applied"
              ? "applied"
              : "pending";
  const configurationStateKey: MessageKey =
    configurationState === "applying"
      ? "statusApplying"
      : configurationState === "applied"
        ? "statusApplied"
        : configurationState === "paused"
          ? "statusPaused"
          : configurationState === "fallback"
            ? "statusFallback"
            : configurationState === "error"
              ? "statusError"
              : "statusPending";
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
    setDraftTheme(structuredClone(selectedTheme));
  }, [selectedTheme]);

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

  async function performApply(
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = companionForTheme(theme),
    settingsSnapshot: UserSettings = settingsRef.current,
    options: {
      preserveSelection?: boolean;
      successMessage?: ApplySuccessMessage;
    } = {},
  ) {
    const revision = ++applyRevisionRef.current;
    const preserveSelection = options.preserveSelection ?? false;
    const successMessage = options.successMessage ?? "configurationApplied";
    setBusy(true);
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
          variant,
          runtimeStrategy: settingsSnapshot.runtimeStrategy,
          revision,
        },
        resolveAsset,
      );
      if (revision !== applyRevisionRef.current) return;
      setRuntime(next);
      if (!preserveSelection) setSelectedTheme(theme);
      updateSettings({ appliedThemeId: theme.id });
      syncDetection(await detectCodex(settingsSnapshot.codexInstallPath));
      setToast(t(successMessage));
    } catch (error) {
      if (revision !== applyRevisionRef.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      setRuntime((current) => ({
        ...current,
        state: "error",
        message: detail,
      }));
      setToast(`${t("applyFailed")}: ${detail}`);
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
          variant,
          runtimeStrategy: settingsSnapshot.runtimeStrategy,
          revision,
        },
        resolveAsset,
      );
      if (revision !== applyRevisionRef.current) return;
      setRuntime(next);
      setToast(t(successMessage));
    } catch (error) {
      if (revision !== applyRevisionRef.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      setRuntime((current) => ({
        ...current,
        state: "error",
        message: detail,
      }));
      setToast(`${t("applyFailed")}: ${detail}`);
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
    } = {},
  ) {
    if (needsManualRestart) {
      setRestartError(null);
      setPendingApplication({
        theme,
        companion,
        settings: settingsSnapshot,
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
        },
      );
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : String(error);
      setRestartError(detail);
      setToast(t("codexQuitFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    setRuntime(await pauseTheme());
  }

  async function handleRestore() {
    setRuntime(await restoreOfficial());
    setToast(t("restore"));
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
        { successMessage: "themeApplied" },
      );
    } else {
      setToast(t("themePending"));
    }
  }

  function updateVariant(
    section: "background" | "appearance" | "motion",
    key: string,
    value: number | string,
  ) {
    setDraftTheme((current) => {
      const next = structuredClone(current);
      const target = next.variants[variant][section] as unknown as Record<
        string,
        number | string | object
      >;
      target[key] = value;
      return next;
    });
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
    scheduleLiveCompanionSync(next);
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
    scheduleLiveCompanionSync(next);
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
    scheduleLiveCompanionSync(next);
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
    if (isLive) {
      void performCompanionUpdate(
        appliedTheme,
        companion,
        next,
        "companionApplied",
      );
    } else {
      setToast(t("companionPending"));
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
    setDraftTheme(structuredClone(selectedTheme));
    setToast(t("resetTheme"));
  }

  function openLocalThemeEditor(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
    setDraftTheme(structuredClone(theme));
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
      setDraftTheme(duplicate);
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

  async function handleDeleteCompanionProject(projectId: string) {
    try {
      await deleteCompanionProject(projectId);
      setCompanionProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
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
        setDraftTheme(structuredClone(replacement));
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
      setDraftTheme(structuredClone(generated.theme));
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
    setDraftTheme((current) => ({
      ...structuredClone(current),
      variants: structuredClone(scheme.variants),
    }));
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
    setDraftTheme(structuredClone(theme));
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setThemeCollection("mine");
    setNewThemeStep(null);
    setView("editor");
    setToast(t("blankThemeCreated"));
  }

  async function saveDraftTheme() {
    setBusy(true);
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
      return true;
    } catch (error) {
      console.error(error);
      setToast(themePersistenceMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveAndApplyDraft() {
    if (await saveDraftTheme()) requestApply(draftTheme);
  }

  function changeThemeCollection(collection: ThemeCollection) {
    setThemeCollection(collection);
    const first = collection === "builtIn" ? builtinThemes[0] : localThemes[0];
    if (first) chooseTheme(first);
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

  return (
    <div className="app" data-manager-theme={appTheme}>
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
              onClick={() => setView(item.id)}
            >
              {item.icon}
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar__spacer" />

        <div className="connection-card">
          <div className="connection-card__top">
            <span
              className={
                "connection-indicator" +
                (runtime.connected ? " connection-indicator--online" : "")
              }
            />
            <strong>{t(configurationStateKey)}</strong>
            <small
              className="configuration-status-pill"
              data-state={configurationState}
            >
              {runtime.connected
                ? t("connected")
                : needsManualRestart
                  ? t("codexRunning")
                  : t("disconnected")}
            </small>
          </div>
          <span>
            {runtime.connected
              ? t("trustedRuntime")
              : needsManualRestart
                ? t("quitToContinue")
                : detection?.installed === false
                  ? t("disconnected")
                  : t("unknownCompatibility")}
          </span>
          <div className="connection-card__actions">
            {runtime.state === "applied" || runtime.state === "fallback" ? (
              <button onClick={handlePause}>
                <Pause size={13} />
                {t("pause")}
              </button>
            ) : needsManualRestart ? (
              <button onClick={() => requestApply()} disabled={busy}>
                <RefreshCw size={13} />
                {busy ? t("applying") : t("restartAndApply")}
              </button>
            ) : (
              <button onClick={() => requestApply()} disabled={busy}>
                <Play size={13} />
                {busy
                  ? t("applying")
                  : runtime.connected
                    ? t("applyChanges")
                    : t("startAndApply")}
              </button>
            )}
            <button
              className="icon-button"
              onClick={handleRestore}
              title={t("restore")}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="app-version">
          <ShieldCheck size={13} />
          <span>{t("version")}</span>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div
            className="window-drag-region"
            data-tauri-drag-region
            onMouseDown={startWindowDrag}
            aria-hidden="true"
          />
          <div className="topbar-status">
            <span className="topbar-status__dot" />
            {runtime.connected && runtime.compatibility === "supported"
              ? t("compatible")
              : runtime.state === "applied" || runtime.state === "fallback"
                ? t("compatibilityMode")
                : t("unknownCompatibility")}
          </div>
          <div className="preview-variant-control">
            <span>{t("codexPreview")}</span>
            <div className="variant-switch" aria-label={t("codexPreview")}>
              <button
                className={variant === "light" ? "is-active" : ""}
                onClick={() => setVariant("light")}
                aria-label={t("light")}
              >
                <Sun size={14} />
              </button>
              <button
                className={variant === "dark" ? "is-active" : ""}
                onClick={() => setVariant("dark")}
                aria-label={t("dark")}
              >
                <Moon size={14} />
              </button>
            </div>
          </div>
        </header>

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
            previewTheme={composeTheme(selectedTheme)}
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
            isLive={isLive}
            busy={busy}
          />
        )}

        {view === "companions" && (
          <CompanionsView
            locale={locale}
            selected={selectedCompanion}
            theme={composeTheme(selectedTheme)}
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
            onDeleteProject={(projectId) =>
              void handleDeleteCompanionProject(projectId)
            }
            onImport={() => companionImportRef.current?.click()}
            onExport={(companion) => void handleExportCompanion(companion)}
            onDelete={setPendingCompanionDelete}
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
          <CreateView
            theme={composeTheme(draftTheme)}
            variant={variant}
            locale={locale}
            reduceMotion={settings.reduceMotion}
            t={t}
            onUpdateVariant={updateVariant}
            onUpdateEntitySize={updateEntitySize}
            onUpdateEntityAnchor={updateEntityAnchor}
            onUpdateEntityAttachment={updateEntityAttachment}
            onSetCompanion={selectCompanion}
            companion={selectedCompanion}
            onBack={() => {
              setThemeCollection("mine");
              setView("themes");
            }}
            onReset={resetDraft}
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
          />
        )}

        {view === "settings" && (
          <SettingsView
            settings={settings}
            detection={detection}
            currentVersion={currentVersion}
            updateStatus={updateStatus}
            t={t}
            onChange={updateSettings}
            installPathBusy={installPathBusy}
            onChooseCodexInstall={handleChooseCodexInstall}
            onUseAutomaticCodexInstall={handleUseAutomaticCodexInstall}
            onCheckForUpdates={() => void handleCheckForUpdates(true)}
            diagnosticsBusy={diagnosticsBusy}
            onRunDiagnostics={() => void handleRunDiagnostics()}
            onOpenOnboarding={() => setShowOnboarding(true)}
          />
        )}
      </main>

      <input
        ref={importRef}
        type="file"
        className="visually-hidden"
        accept=".codex-styler-theme"
        onChange={handleImport}
      />
      <input
        ref={backgroundImportRef}
        type="file"
        className="visually-hidden"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleBackgroundImport}
      />
      <input
        ref={companionImportRef}
        type="file"
        className="visually-hidden"
        accept=".codex-styler-companion"
        onChange={handleCompanionImport}
      />

      {showOnboarding && (
        <Onboarding
          locale={locale}
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          onComplete={() => {
            updateSettings({ onboardingComplete: true });
            setShowOnboarding(false);
          }}
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
              <pre>{diagnosticsSummary(diagnosticsReport)}</pre>
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
              <div className="update-dialog__notes">
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
              <div className="update-dialog__notes">
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

function HomeView({
  locale,
  theme,
  sourceTheme,
  companion,
  runtime,
  runtimeStrategy,
  variant,
  reduceMotion,
  t,
  onEdit,
  onBrowse,
  onCreateFromImage,
  onCompanions,
  resolveAsset,
}: SharedViewProps & {
  theme: ThemeDefinition;
  sourceTheme: ThemeDefinition;
  companion: CompanionDefinition | null;
  runtime: RuntimeStatus;
  runtimeStrategy: RuntimeStrategy;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onEdit: () => void;
  onBrowse: () => void;
  onCreateFromImage: () => void;
  onCompanions: () => void;
}) {
  const copy = sourceTheme.locales[locale] ?? sourceTheme.locales.en;
  const companionCopy = companion
    ? (companion.locales[locale] ?? companion.locales.en)
    : null;
  const setupIsLive =
    runtime.connected &&
    (runtime.state === "applied" || runtime.state === "fallback");
  return (
    <div className="page home-page">
      <section className="page-heading home-heading">
        <div>
          <span className="page-kicker">WORKSPACE CONTROL</span>
          <h1>{t("homeTitle")}</h1>
          <p>{t("homeDescription")}</p>
        </div>
        <div className="home-heading__status">
          <span className={setupIsLive ? "is-live" : ""} />
          <div>
            <small>{t("codexAppearance")}</small>
            <strong>
              {runtime.state === "fallback"
                ? t("statusFallback")
                : setupIsLive
                  ? t("themeActive")
                  : runtime.state === "error"
                    ? t("statusError")
                    : runtime.state === "paused"
                      ? t("statusPaused")
                      : t("ready")}
            </strong>
          </div>
        </div>
      </section>

      <section className="home-current">
        <div className="home-current__preview">
          <span className="home-current__label">
            {setupIsLive ? t("liveSetup") : t("selectedSetup")}
          </span>
          <PreviewWorkspace
            theme={theme}
            variant={variant}
            locale={locale}
            reduceMotion={reduceMotion}
            resolveAsset={resolveAsset}
          />
        </div>
        <div className="home-current__content">
          <span className="home-current__eyebrow">
            {setupIsLive ? t("liveInCodex") : t("readyToApply")}
          </span>
          <h2>{copy.name}</h2>
          <p>{copy.description}</p>
          <dl className="home-current__facts">
            <div>
              <dt>{t("companion")}</dt>
              <dd>{companionCopy?.name ?? t("noCompanion")}</dd>
            </div>
            <div>
              <dt>{t("runtimeStrategy")}</dt>
              <dd>
                {runtimeStrategy === "enhanced"
                  ? t("automaticMode")
                  : t("compatibilityMode")}
              </dd>
            </div>
          </dl>
          <div className="button-row">
            <button className="secondary-button" onClick={onEdit}>
              {t("editTheme")}
              <ChevronRight size={15} />
            </button>
          </div>
          <div
            className={
              "configuration-state" +
              (setupIsLive ? " configuration-state--live" : "")
            }
          >
            <span />
            {setupIsLive
              ? t("changesApplyInstantly")
              : t("changesReadyToApply")}
          </div>
        </div>
      </section>

      <section className="home-actions" aria-label={t("quickActions")}>
        <button onClick={onBrowse}>
          <span>
            <Palette size={18} />
          </span>
          <strong>{t("browseThemes")}</strong>
          <small>{t("browseThemesDetail")}</small>
          <ChevronRight size={15} />
        </button>
        <button onClick={onCreateFromImage}>
          <span>
            <Image size={18} />
          </span>
          <strong>{t("createFromImage")}</strong>
          <small>{t("createFromImageDetail")}</small>
          <ChevronRight size={15} />
        </button>
        <button onClick={onCompanions}>
          <span>
            <PawPrint size={18} />
          </span>
          <strong>{t("chooseCompanion")}</strong>
          <small>{t("chooseCompanionDetail")}</small>
          <ChevronRight size={15} />
        </button>
      </section>
    </div>
  );
}

function ThemesView({
  locale,
  selectedTheme,
  previewTheme,
  localThemes,
  collection,
  variant,
  reduceMotion,
  t,
  onSelect,
  onEdit,
  onDelete,
  onCollectionChange,
  onNew,
  onImport,
  resolveAsset,
  liveThemeId,
  isLive,
  busy,
}: SharedViewProps & {
  selectedTheme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  localThemes: ThemeDefinition[];
  collection: ThemeCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (theme: ThemeDefinition) => void;
  onEdit: (theme: ThemeDefinition) => void;
  onDelete: (theme: ThemeDefinition) => void;
  onCollectionChange: (collection: ThemeCollection) => void;
  onNew: () => void;
  onImport: () => void;
  liveThemeId: string | null;
  isLive: boolean;
  busy: boolean;
}) {
  const themes = collection === "builtIn" ? builtinThemes : localThemes;
  const localized = selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedIndex =
    themes.findIndex((theme) => theme.id === selectedTheme.id) + 1;
  const performance =
    previewTheme.scene.entities.length > 0 ||
    Object.values(previewTheme.variants).some((item) =>
      Boolean(item.background.image),
    ) ||
    previewTheme.scene.layers.some((layer) => Math.abs(layer.parallax) > 0)
      ? t("medium")
      : t("low");
  const selectedThemeIsLive = liveThemeId === selectedTheme.id;
  return (
    <div className="page page--themes">
      <section className="page-heading">
        <div>
          <span className="page-kicker">VISUAL SYSTEM LIBRARY</span>
          <h1>{t("themeLibrary")}</h1>
          <p>{t("themeLibraryDetail")}</p>
        </div>
        <div className="page-heading__actions">
          <button className="secondary-button" onClick={onImport}>
            <Upload size={14} />
            {t("importTheme")}
          </button>
          <button className="primary-button" onClick={onNew}>
            <Plus size={14} />
            {t("newTheme")}
          </button>
        </div>
      </section>

      <div
        className="theme-collection-tabs"
        role="tablist"
        aria-label={t("themes")}
      >
        <button
          role="tab"
          aria-selected={collection === "builtIn"}
          className={collection === "builtIn" ? "is-active" : ""}
          onClick={() => onCollectionChange("builtIn")}
        >
          {t("builtInThemes")}
          <small>{builtinThemes.length}</small>
        </button>
        <button
          role="tab"
          aria-selected={collection === "mine"}
          className={collection === "mine" ? "is-active" : ""}
          onClick={() => onCollectionChange("mine")}
        >
          {t("myThemes")}
          <small>{localThemes.length}</small>
        </button>
      </div>

      {themes.length === 0 ? (
        <section className="empty-state theme-empty-state">
          <span className="empty-state__icon">
            <FolderOpen size={25} />
          </span>
          <h2>{t("noLocalThemesTitle")}</h2>
          <p>{t("noLocalThemes")}</p>
          <div className="button-row">
            <button className="primary-button" onClick={onNew}>
              <Plus size={14} /> {t("newTheme")}
            </button>
            <button className="secondary-button" onClick={onImport}>
              <Upload size={14} /> {t("importTheme")}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="featured-theme theme-detail-card">
            <div className="featured-theme__preview">
              <div className="featured-theme__label">
                {busy
                  ? t("applying")
                  : selectedThemeIsLive
                    ? t("liveInCodex")
                    : t("previewOnly")}
              </div>
              <PreviewWorkspace
                theme={previewTheme}
                variant={variant}
                locale={locale}
                reduceMotion={reduceMotion}
                resolveAsset={resolveAsset}
              />
            </div>
            <div className="featured-theme__copy">
              <span>
                THEME {String(Math.max(1, selectedIndex)).padStart(2, "0")} /{" "}
                {localized.name.toUpperCase()}
              </span>
              <h2>{localized.name}</h2>
              <p>{localized.description}</p>
              <div className="theme-facts">
                <div>
                  <small>{t("performance")}</small>
                  <strong>{performance}</strong>
                </div>
                <div>
                  <small>{t("interactive")}</small>
                  <strong>
                    {previewTheme.scene.entities.length ? "Pointer" : "—"}
                  </strong>
                </div>
              </div>
              <div
                className={
                  "configuration-state" +
                  (selectedThemeIsLive ? " configuration-state--live" : "")
                }
              >
                <span />
                {busy
                  ? t("applying")
                  : selectedThemeIsLive
                    ? t("liveInCodex")
                    : isLive
                      ? t("changesApplyInstantly")
                      : t("changesReadyToApply")}
              </div>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => onEdit(selectedTheme)}
                >
                  {collection === "builtIn"
                    ? t("customizeCopy")
                    : t("editTheme")}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>

          <section className="theme-index">
            <div className="section-heading">
              <div>
                <span>THEME INDEX</span>
                <h2>
                  {collection === "builtIn"
                    ? t("builtInThemes")
                    : t("myThemes")}
                </h2>
              </div>
              <span className="section-count">
                {themes.length} {t("themesCount")}
              </span>
            </div>
            <div className="theme-list">
              {themes.map((theme, index) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  index={index + 1}
                  locale={locale}
                  active={selectedTheme.id === theme.id}
                  live={liveThemeId === theme.id}
                  resolveAsset={resolveAsset}
                  onSelect={() => onSelect(theme)}
                  local={collection === "mine"}
                  onEdit={() => onEdit(theme)}
                  onDelete={() => onDelete(theme)}
                  t={t}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ThemeRow({
  theme,
  index,
  locale,
  active,
  live,
  resolveAsset,
  onSelect,
  local,
  onEdit,
  onDelete,
  t,
}: {
  theme: ThemeDefinition;
  index: number;
  locale: Locale;
  active: boolean;
  live: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onSelect: () => void;
  local: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: MessageKey) => string;
}) {
  const localized = theme.locales[locale] ?? theme.locales.en;
  const preview = theme.metadata.preview
    ? resolveAsset(theme, theme.metadata.preview)
    : undefined;
  return (
    <article className={"theme-row" + (active ? " theme-row--active" : "")}>
      <button
        className="theme-row__select"
        onClick={onSelect}
        aria-label={`${t("preview")}: ${localized.name}`}
        aria-pressed={active}
      />
      <div className="theme-row__preview" aria-hidden="true">
        <span
          style={{
            backgroundColor: theme.variants.dark.background.color,
            backgroundImage: preview ? "url(" + preview + ")" : undefined,
          }}
        />
        <small>{String(index).padStart(2, "0")}</small>
      </div>
      <div className="theme-row__copy">
        <span>{theme.metadata.tags.slice(0, 3).join(" · ").toUpperCase()}</span>
        <h3>{localized.name}</h3>
        <p>{localized.description}</p>
      </div>
      <div className="theme-row__badges">
        {live && (
          <span className="theme-row__live">
            <Check size={12} />
            {t("liveInCodex")}
          </span>
        )}
        {defaultCompanionForTheme(theme.id) && (
          <span>
            <MousePointer2 size={12} />
            {t("interactive")}
          </span>
        )}
        <span>
          {theme.compatibility.codex.mode === "safe" ? "SAFE" : "SEMANTIC"}
        </span>
      </div>
      <div className="theme-row__actions">
        <button className="theme-row__action" onClick={onEdit}>
          {local ? t("editTheme") : t("customizeCopy")}
          <ChevronRight size={14} />
        </button>
        {local && (
          <button
            className="theme-row__delete"
            onClick={onDelete}
            title={t("deleteTheme")}
            aria-label={`${t("deleteTheme")}: ${localized.name}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

function CompanionsView({
  locale,
  selected,
  theme,
  localCompanions,
  projects,
  collection,
  variant,
  reduceMotion,
  t,
  onSelect,
  onCollectionChange,
  onCreate,
  onEditProject,
  onDeleteProject,
  onImport,
  onExport,
  onDelete,
  onAnchorChange,
  onAttachmentChange,
  resolveAsset,
  resolveCompanionAsset,
  isLive,
  busy,
}: SharedViewProps & {
  selected: CompanionDefinition | null;
  theme: ThemeDefinition;
  localCompanions: CompanionDefinition[];
  projects: CompanionCreatorProject[];
  collection: CompanionCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (companion: CompanionDefinition | null) => void;
  onCollectionChange: (collection: CompanionCollection) => void;
  onCreate: () => void;
  onEditProject: (project: CompanionCreatorProject) => void;
  onDeleteProject: (projectId: string) => void;
  onImport: () => void;
  onExport: (companion: CompanionDefinition) => void;
  onDelete: (companion: CompanionDefinition) => void;
  onAnchorChange: (anchor: { x: number; y: number }) => void;
  onAttachmentChange: (attachment: EntityAttachment | null) => void;
  resolveCompanionAsset: (
    companion: CompanionDefinition,
    path: string,
  ) => string;
  isLive: boolean;
  busy: boolean;
}) {
  const companions =
    collection === "builtIn" ? builtinCompanions : localCompanions;
  return (
    <div className="page companions-page">
      <section className="page-heading">
        <div>
          <span className="page-kicker">INDEPENDENT SCENE ENTITIES</span>
          <h1>{t("companions")}</h1>
          <p>
            {t("dragCompanion")}. {t("companionIndependence")}
          </p>
        </div>
        <div className="page-heading__actions">
          <button className="secondary-button" onClick={onImport}>
            <Upload size={14} />
            {t("importCompanion")}
          </button>
          <button className="primary-button" onClick={onCreate}>
            <Plus size={14} />
            {t("newCompanion")}
          </button>
        </div>
      </section>
      <div className="companions-toolbar">
        <div
          className="theme-collection-tabs"
          role="tablist"
          aria-label={t("companions")}
        >
          <button
            role="tab"
            aria-selected={collection === "builtIn"}
            className={collection === "builtIn" ? "is-active" : ""}
            onClick={() => onCollectionChange("builtIn")}
          >
            {t("builtInCompanions")}
            <small>{builtinCompanions.length}</small>
          </button>
          <button
            role="tab"
            aria-selected={collection === "mine"}
            className={collection === "mine" ? "is-active" : ""}
            onClick={() => onCollectionChange("mine")}
          >
            {t("myCompanions")}
            <small>{localCompanions.length}</small>
          </button>
        </div>
        <div
          className={
            "configuration-state" + (isLive ? " configuration-state--live" : "")
          }
          aria-live="polite"
        >
          <span />
          {busy
            ? t("applying")
            : isLive
              ? t("changesApplyInstantly")
              : t("changesReadyToApply")}
        </div>
      </div>
      {collection === "mine" && projects.length > 0 && (
        <section className="companion-projects">
          <div className="companion-projects__heading">
            <div>
              <span className="page-kicker">AUTOSAVED CREATOR PROJECTS</span>
              <strong>{t("companionDrafts")}</strong>
            </div>
            <small>{projects.length}</small>
          </div>
          <div className="companion-projects__list">
            {projects.map((project) => (
              <div key={project.id} className="companion-project-card">
                <button onClick={() => onEditProject(project)}>
                  <span>
                    <Film size={15} />
                  </span>
                  <strong>{project.name}</strong>
                  <small>
                    {project.source?.files.length ?? 0} {t("sourceFiles")} ·{" "}
                    {project.frames.length} {t("frames")}
                  </small>
                  <ChevronRight size={14} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => onDeleteProject(project.id)}
                  aria-label={`${t("deleteDraft")}: ${project.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="companions-layout">
        <section className="companion-preview-panel">
          <PreviewWorkspace
            theme={theme}
            variant={variant}
            locale={locale}
            reduceMotion={reduceMotion}
            resolveAsset={resolveAsset}
            onEntityAnchorChange={onAnchorChange}
            onEntityAttachmentChange={onAttachmentChange}
          />
          {selected && (
            <span className="drag-hint">
              <MousePointer2 size={13} />
              {t("dragCompanion")}
            </span>
          )}
        </section>
        <section className="companion-list" aria-label={t("companions")}>
          <button
            className={
              "companion-option" +
              (!selected ? " companion-option--active" : "")
            }
            onClick={() => onSelect(null)}
            aria-pressed={!selected}
          >
            <span className="companion-option__visual companion-option__visual--empty">
              <X size={20} />
            </span>
            <span>
              <strong>{t("noCompanion")}</strong>
              <small>{t("themeOnly")}</small>
            </span>
            {!selected && <Check size={15} />}
          </button>
          {companions.length === 0 && (
            <div className="companion-empty">
              <FolderOpen size={22} />
              <strong>{t("noLocalCompanions")}</strong>
              <span>{t("noLocalCompanionsDetail")}</span>
              <button className="primary-button" onClick={onCreate}>
                <Plus size={14} /> {t("newCompanion")}
              </button>
            </div>
          )}
          {companions.map((item) => {
            const copy = item.locales[locale] ??
              item.locales.en ?? {
                name: item.name,
                description: item.description,
              };
            const active = selected?.id === item.id;
            const renderer = item.entity.renderer;
            const previewSize = 64;
            const hasDedicatedPortrait = Boolean(item.metadata.preview);
            const fallbackFrame =
              renderer.type === "sprite-atlas"
                ? Math.max(
                    0,
                    Math.min(
                      (renderer.frameCount ?? renderer.directions) - 1,
                      renderer.neutralFrame ?? renderer.reducedMotionFrame ?? 0,
                    ),
                  )
                : 0;
            const framesPerPage =
              renderer.type === "sprite-atlas"
                ? (renderer.framesPerPage ?? renderer.columns * renderer.rows)
                : 1;
            const pageIndex = Math.floor(fallbackFrame / framesPerPage);
            const frameOnPage = fallbackFrame % framesPerPage;
            const frameScale =
              renderer.type === "sprite-atlas" && !hasDedicatedPortrait
                ? Math.min(
                    previewSize / renderer.frameWidth,
                    previewSize / renderer.frameHeight,
                  )
                : 1;
            const backgroundSize =
              renderer.type === "sprite-atlas"
                ? `${renderer.columns * renderer.frameWidth * frameScale}px ${renderer.rows * renderer.frameHeight * frameScale}px`
                : "contain";
            const frameWidth =
              renderer.type === "sprite-atlas" && !hasDedicatedPortrait
                ? renderer.frameWidth * frameScale
                : previewSize;
            const frameHeight =
              renderer.type === "sprite-atlas" && !hasDedicatedPortrait
                ? renderer.frameHeight * frameScale
                : previewSize;
            const previewPath =
              item.metadata.preview ??
              (renderer.type === "sprite-atlas"
                ? (renderer.pages?.[pageIndex] ?? renderer.asset)
                : renderer.asset);
            const backgroundPosition =
              renderer.type === "sprite-atlas" && !hasDedicatedPortrait
                ? `${-(frameOnPage % renderer.columns) * renderer.frameWidth * frameScale}px ${-Math.floor(frameOnPage / renderer.columns) * renderer.frameHeight * frameScale}px`
                : "center";
            return (
              <div
                key={item.id}
                className={
                  "companion-option-wrap" +
                  (active ? " companion-option-wrap--active" : "")
                }
              >
                <button
                  className={
                    "companion-option" +
                    (active ? " companion-option--active" : "")
                  }
                  onClick={() => onSelect(item)}
                  aria-pressed={active}
                >
                  <span className="companion-option__visual companion-option__visual--sprite">
                    <span
                      className="companion-option__frame"
                      data-preview-source={
                        hasDedicatedPortrait
                          ? "portrait"
                          : renderer.type === "sprite-atlas"
                            ? "neutral-frame"
                            : "image"
                      }
                      style={{
                        width: `${frameWidth}px`,
                        height: `${frameHeight}px`,
                        backgroundImage: `url(${resolveCompanionAsset(item, previewPath)})`,
                        backgroundSize:
                          item.metadata.preview || renderer.type === "image"
                            ? "contain"
                            : backgroundSize,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition,
                      }}
                    />
                  </span>
                  <span>
                    <strong>{copy.name}</strong>
                    <small>{copy.description}</small>
                  </span>
                  {active ? <Check size={15} /> : <ChevronRight size={15} />}
                </button>
                {collection === "mine" && (
                  <div className="companion-option-actions">
                    <button
                      className="icon-button"
                      onClick={() => onExport(item)}
                      aria-label={t("exportCompanion")}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => onDelete(item)}
                      aria-label={t("deleteCompanion")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function CreateView({
  theme,
  variant,
  locale,
  reduceMotion,
  t,
  onUpdateVariant,
  onUpdateEntitySize,
  onUpdateEntityAnchor,
  onUpdateEntityAttachment,
  onSetCompanion,
  companion,
  onBack,
  onReset,
  onSave,
  onApply,
  onExport,
  onImportBackground,
  adaptiveSchemes,
  activeAdaptiveScheme,
  onSelectAdaptiveScheme,
  resolveAsset,
  busy,
}: SharedViewProps & {
  theme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onUpdateVariant: (
    section: "background" | "appearance" | "motion",
    key: string,
    value: number | string,
  ) => void;
  onUpdateEntitySize: (size: number) => void;
  onUpdateEntityAnchor: (anchor: { x: number; y: number }) => void;
  onUpdateEntityAttachment: (attachment: EntityAttachment | null) => void;
  onSetCompanion: (companion: CompanionDefinition | null) => void;
  companion: CompanionDefinition | null;
  onBack: () => void;
  onReset: () => void;
  onSave: () => void;
  onApply: () => void;
  onExport: () => void;
  onImportBackground: () => void;
  adaptiveSchemes: AdaptiveScheme[];
  activeAdaptiveScheme: AdaptiveSchemeId | null;
  onSelectAdaptiveScheme: (scheme: AdaptiveScheme) => void;
  busy: boolean;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<
    "background" | "surfaces" | "motion" | "companion"
  >("background");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const visual = theme.variants[variant];
  const entity = theme.scene.entities[0];
  return (
    <div className="editor-page">
      <header className="editor-header">
        <div className="editor-header__identity">
          <button
            className="editor-back"
            onClick={onBack}
            aria-label={t("backToThemes")}
          >
            <ChevronRight size={16} />
          </button>
          <div>
            <span>
              {t("themes")} / {t("editTheme")}
            </span>
            <h1>{theme.locales[locale]?.name ?? theme.metadata.name}</h1>
          </div>
        </div>
        <div className="editor-header__actions">
          <button className="secondary-button" onClick={onReset}>
            <RotateCcw size={14} />
            {t("reset")}
          </button>
          <button
            className="secondary-button inspector-toggle"
            onClick={() => setInspectorOpen(true)}
          >
            <PanelRightOpen size={14} />
            {t("appearance")}
          </button>
          <button className="secondary-button" onClick={onExport}>
            <Download size={14} />
            {t("exportTheme")}
          </button>
          <button className="secondary-button" onClick={onSave} disabled={busy}>
            <Check size={14} />
            {busy ? t("saving") : t("save")}
          </button>
          <button className="primary-button" onClick={onApply} disabled={busy}>
            <Play size={14} />
            {busy ? t("applying") : t("apply")}
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <aside className="layers-panel">
          <div className="panel-title">
            <span>{t("layers")}</span>
            <div className="layer-add">
              <button
                aria-label={t("addLayer")}
                onClick={() => setAddMenuOpen((open) => !open)}
              >
                <Plus size={14} />
              </button>
              {addMenuOpen && (
                <div className="layer-add__menu" role="menu">
                  {builtinCompanions.map((item) => (
                    <button
                      key={item.id}
                      role="menuitem"
                      onClick={() => {
                        onSetCompanion(item);
                        setActiveLayer("companion");
                        setAddMenuOpen(false);
                      }}
                    >
                      <PawPrint size={13} />
                      <span>{item.locales[locale]?.name ?? item.name}</span>
                      {companion?.id === item.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="layer-stack">
            <button
              className={
                "layer-item" +
                (activeLayer === "background" ? " layer-item--active" : "")
              }
              onClick={() => setActiveLayer("background")}
              aria-label={t("background")}
            >
              <span className="layer-icon">
                <Image size={15} />
              </span>
              <span>
                <strong>{t("background")}</strong>
                <small>{t("backgroundLayer")}</small>
              </span>
              <Layers3 size={13} />
            </button>
            <button
              className={
                "layer-item" +
                (activeLayer === "surfaces" ? " layer-item--active" : "")
              }
              onClick={() => setActiveLayer("surfaces")}
              aria-label={t("surfaces")}
            >
              <span className="layer-icon">
                <Sparkles size={15} />
              </span>
              <span>
                <strong>{t("surfaces")}</strong>
                <small>{t("surfaceLayer")}</small>
              </span>
              <Layers3 size={13} />
            </button>
            <button
              className={
                "layer-item" +
                (activeLayer === "motion" ? " layer-item--active" : "")
              }
              onClick={() => setActiveLayer("motion")}
              aria-label={t("motion")}
            >
              <span className="layer-icon">
                <Sparkles size={15} />
              </span>
              <span>
                <strong>{t("motion")}</strong>
                <small>{t("motionLayer")}</small>
              </span>
              <Layers3 size={13} />
            </button>
            {entity && (
              <button
                className={
                  "layer-item" +
                  (activeLayer === "companion" ? " layer-item--active" : "")
                }
                onClick={() => setActiveLayer("companion")}
                aria-label={t("companion")}
              >
                <span className="layer-icon layer-icon--green">
                  <Leaf size={15} />
                </span>
                <span>
                  <strong>{entity.name}</strong>
                  <small>Sprite · pointer</small>
                </span>
                <Layers3 size={13} />
              </button>
            )}
          </div>
          <button
            className="layers-save-button"
            onClick={onSave}
            disabled={busy}
          >
            <Check size={14} />
            {busy ? t("saving") : t("saveTheme")}
          </button>
          <div className="layers-panel__note">
            <ShieldCheck size={14} />
            <p>{t("safePreview")}</p>
          </div>
        </aside>

        <section className="editor-canvas">
          <div className="canvas-toolbar">
            <span>
              <Monitor size={13} />
              {t("livePreview")}
            </span>
            <span>1280 × 760</span>
          </div>
          <div className="canvas-stage">
            <PreviewWorkspace
              theme={theme}
              variant={variant}
              locale={locale}
              reduceMotion={reduceMotion}
              resolveAsset={resolveAsset}
              onEntityAnchorChange={onUpdateEntityAnchor}
              onEntityAttachmentChange={onUpdateEntityAttachment}
            />
          </div>
        </section>

        <aside
          className={"inspector" + (inspectorOpen ? " inspector--open" : "")}
          aria-label={t("appearance")}
        >
          <div className="panel-title">
            <span>{t("appearance")}</span>
            <div className="inspector-heading-actions">
              <small>{variant.toUpperCase()}</small>
              <button
                className="inspector-close"
                onClick={() => setInspectorOpen(false)}
                aria-label="Close inspector"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {activeLayer === "background" && (
            <InspectorSection
              title={t("background")}
              icon={<Image size={14} />}
            >
              <button
                className="adaptive-import-button"
                onClick={onImportBackground}
                disabled={busy}
              >
                <Upload size={15} />
                <span>
                  <strong>{t("importBackground")}</strong>
                  <small>PNG, JPEG, WebP · 20 MiB</small>
                </span>
              </button>
              <div className="adaptive-intro">
                <strong>{t("imageAdaptiveTitle")}</strong>
                <p>{t("imageAdaptiveBody")}</p>
              </div>
              {adaptiveSchemes.length > 0 && (
                <div className="adaptive-schemes">
                  {adaptiveSchemes.map((scheme) => {
                    const labelKey =
                      scheme.id === "cinematic"
                        ? "adaptiveCinematic"
                        : scheme.id === "soft"
                          ? "adaptiveSoft"
                          : scheme.id === "vivid"
                            ? "adaptiveVivid"
                            : "adaptiveBalanced";
                    const active = activeAdaptiveScheme === scheme.id;
                    return (
                      <button
                        key={scheme.id}
                        className={
                          "adaptive-scheme" +
                          (active ? " adaptive-scheme--active" : "")
                        }
                        onClick={() => onSelectAdaptiveScheme(scheme)}
                      >
                        <span className="adaptive-scheme__swatches">
                          {scheme.swatches.map((color) => (
                            <i key={color} style={{ background: color }} />
                          ))}
                        </span>
                        <span>{t(labelKey)}</span>
                        {active && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
              )}
              <ColorControl
                label={t("overlay")}
                value={visual.background.overlay}
                onChange={(value) =>
                  onUpdateVariant("background", "overlay", value)
                }
              />
              <RangeControl
                label={t("brightness")}
                value={visual.background.brightness}
                min={0.2}
                max={2}
                step={0.01}
                display={Math.round(visual.background.brightness * 100) + "%"}
                onChange={(value) =>
                  onUpdateVariant("background", "brightness", value)
                }
              />
              <RangeControl
                label={t("blur")}
                value={visual.background.blur}
                min={0}
                max={40}
                step={1}
                display={visual.background.blur + "px"}
                onChange={(value) =>
                  onUpdateVariant("background", "blur", value)
                }
              />
              <RangeControl
                label={t("overlay")}
                value={visual.background.overlayOpacity}
                min={0}
                max={1}
                step={0.01}
                display={
                  Math.round(visual.background.overlayOpacity * 100) + "%"
                }
                onChange={(value) =>
                  onUpdateVariant("background", "overlayOpacity", value)
                }
              />
            </InspectorSection>
          )}
          {activeLayer === "surfaces" && (
            <InspectorSection
              title={t("surfaces")}
              icon={<Layers3 size={14} />}
            >
              <label className="inspector-select-control">
                <span>{t("layoutTreatment")}</span>
                <select
                  value={visual.appearance.layout ?? "native"}
                  onChange={(event) =>
                    onUpdateVariant("appearance", "layout", event.target.value)
                  }
                >
                  <option value="native">{t("layoutNative")}</option>
                  <option value="editorial">{t("layoutEditorial")}</option>
                  <option value="immersive">{t("layoutImmersive")}</option>
                </select>
              </label>
              <label className="inspector-select-control">
                <span>{t("iconTreatment")}</span>
                <select
                  value={visual.appearance.iconStyle ?? "native"}
                  onChange={(event) =>
                    onUpdateVariant(
                      "appearance",
                      "iconStyle",
                      event.target.value,
                    )
                  }
                >
                  <option value="native">{t("iconNative")}</option>
                  <option value="contained">{t("iconContained")}</option>
                  <option value="themed">{t("iconThemed")}</option>
                </select>
              </label>
              <label className="inspector-select-control">
                <span>{t("decorationTreatment")}</span>
                <select
                  value={visual.appearance.decorations ?? "none"}
                  onChange={(event) =>
                    onUpdateVariant(
                      "appearance",
                      "decorations",
                      event.target.value,
                    )
                  }
                >
                  <option value="none">{t("decorationNone")}</option>
                  <option value="subtle">{t("decorationSubtle")}</option>
                  <option value="expressive">
                    {t("decorationExpressive")}
                  </option>
                </select>
              </label>
              <p className="inspector-mode-note">{t("semanticControlsHint")}</p>
              <ColorControl
                label="Accent"
                value={visual.appearance.accent}
                onChange={(value) =>
                  onUpdateVariant("appearance", "accent", value)
                }
              />
              <RangeControl
                label={t("surfaceOpacity")}
                value={visual.appearance.surfaceOpacity}
                min={0}
                max={1}
                step={0.01}
                display={
                  Math.round(visual.appearance.surfaceOpacity * 100) + "%"
                }
                onChange={(value) =>
                  onUpdateVariant("appearance", "surfaceOpacity", value)
                }
              />
              <RangeControl
                label={t("radius")}
                value={visual.appearance.radius}
                min={0}
                max={32}
                step={1}
                display={visual.appearance.radius + "px"}
                onChange={(value) =>
                  onUpdateVariant("appearance", "radius", value)
                }
              />
              <div className="contrast-note">
                <ShieldCheck size={14} />
                <span>
                  <strong>{t("contrastProtected")}</strong>
                  <small>{t("contrastProtectedBody")}</small>
                </span>
              </div>
            </InspectorSection>
          )}
          {activeLayer === "motion" && (
            <InspectorSection title={t("motion")} icon={<Sparkles size={14} />}>
              <div className="motion-recipes" aria-label={t("motionStyle")}>
                {[
                  { id: "none", intensity: 0, parallax: 0, fps: 30 },
                  { id: "calm", intensity: 0.25, parallax: 4, fps: 30 },
                  { id: "fluid", intensity: 0.5, parallax: 8, fps: 30 },
                  { id: "expressive", intensity: 0.8, parallax: 14, fps: 60 },
                ].map((recipe) => {
                  const active =
                    Math.abs(visual.motion.intensity - recipe.intensity) <
                      0.01 && visual.motion.parallax === recipe.parallax;
                  const label =
                    recipe.id === "none"
                      ? t("motionNone")
                      : recipe.id === "calm"
                        ? t("motionCalm")
                        : recipe.id === "expressive"
                          ? t("motionExpressive")
                          : t("motionFluid");
                  return (
                    <button
                      key={recipe.id}
                      className={active ? "is-active" : ""}
                      onClick={() => {
                        onUpdateVariant(
                          "motion",
                          "intensity",
                          recipe.intensity,
                        );
                        onUpdateVariant("motion", "parallax", recipe.parallax);
                        onUpdateVariant("motion", "targetFps", recipe.fps);
                      }}
                    >
                      <span />
                      {label}
                      {active && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
              <p className="inspector-mode-note">{t("motionDescription")}</p>
              <RangeControl
                label={t("motionIntensity")}
                value={visual.motion.intensity}
                min={0}
                max={1}
                step={0.01}
                display={Math.round(visual.motion.intensity * 100) + "%"}
                onChange={(value) =>
                  onUpdateVariant("motion", "intensity", value)
                }
              />
              <RangeControl
                label={t("parallaxDepth")}
                value={visual.motion.parallax}
                min={0}
                max={20}
                step={1}
                display={visual.motion.parallax + "px"}
                onChange={(value) =>
                  onUpdateVariant("motion", "parallax", value)
                }
              />
            </InspectorSection>
          )}
          {activeLayer === "companion" && (
            <InspectorSection
              title={t("companion")}
              icon={<PawPrint size={14} />}
            >
              {entity && (
                <>
                  <label className="inspector-select-control">
                    <span>{t("attachTo")}</span>
                    <select
                      value={entity.attachment?.target ?? "free"}
                      onChange={(event) => {
                        const target = event.target.value;
                        if (target === "free") {
                          onUpdateEntityAttachment(null);
                          return;
                        }
                        onUpdateEntityAttachment({
                          target: target as EntityAttachment["target"],
                          edge: "top",
                          align: 0.82,
                          offset: { x: 0, y: 3 },
                        });
                      }}
                    >
                      <option value="composer">{t("composerEdge")}</option>
                      <option value="main-surface">{t("workspaceEdge")}</option>
                      <option value="free">{t("freePosition")}</option>
                    </select>
                  </label>
                  <RangeControl
                    label={t("companionSize")}
                    value={entity.size}
                    min={48}
                    max={240}
                    step={1}
                    display={entity.size + "px"}
                    onChange={onUpdateEntitySize}
                  />
                  <p className="inspector-help">
                    <MousePointer2 size={13} />
                    {t("dragCompanion")}
                  </p>
                  <button
                    className="danger-text-button"
                    onClick={() => onSetCompanion(null)}
                  >
                    <Trash2 size={13} />
                    {t("removeCompanion")}
                  </button>
                </>
              )}
            </InspectorSection>
          )}
        </aside>
      </div>
    </div>
  );
}

function InspectorSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="inspector-section">
      <h3>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <label className="range-control">
      <span>
        <strong>{label}</strong>
        <small>{display}</small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--range-progress": percentage + "%" } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-control">
      <span>
        <strong>{label}</strong>
        <small>{value.toUpperCase()}</small>
      </span>
      <span className="color-control__field">
        <i style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
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
          <div className="new-theme-options">
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
          <div className="new-theme-existing-list">
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

function SettingsView({
  settings,
  detection,
  currentVersion,
  updateStatus,
  t,
  onChange,
  installPathBusy,
  onChooseCodexInstall,
  onUseAutomaticCodexInstall,
  onCheckForUpdates,
  diagnosticsBusy,
  onRunDiagnostics,
  onOpenOnboarding,
}: {
  settings: UserSettings;
  detection: CodexDetection | null;
  currentVersion: string;
  updateStatus: UpdateStatus;
  t: (key: MessageKey) => string;
  onChange: (patch: Partial<UserSettings>) => void;
  installPathBusy: boolean;
  onChooseCodexInstall: () => void;
  onUseAutomaticCodexInstall: () => void;
  onCheckForUpdates: () => void;
  diagnosticsBusy: boolean;
  onRunDiagnostics: () => void;
  onOpenOnboarding: () => void;
}) {
  const lastChecked = (() => {
    if (!settings.lastUpdateCheckAt) return t("neverChecked");
    const date = new Date(settings.lastUpdateCheckAt);
    if (Number.isNaN(date.getTime())) return t("neverChecked");
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  })();
  return (
    <div className="page settings-page">
      <section className="page-heading">
        <div>
          <span className="page-kicker">LOCAL PREFERENCES</span>
          <h1>{t("settings")}</h1>
          <p>{t("privacyBody")}</p>
        </div>
      </section>
      <div className="settings-layout">
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <Languages size={17} />
            <div>
              <h2>{t("language")}</h2>
              <p>{t("languageDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <label className="select-control">
              <select
                value={settings.locale}
                onChange={(event) =>
                  onChange({ locale: event.target.value as LocalePreference })
                }
              >
                <option value="system">{t("systemLanguage")}</option>
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
              <ChevronRight size={14} aria-hidden="true" />
            </label>
          </div>
        </section>
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <Palette size={17} />
            <div>
              <h2>{t("managerAppearance")}</h2>
              <p>{t("managerAppearanceDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <SegmentedControl
              value={settings.appearance}
              options={[
                {
                  value: "system",
                  label: t("system"),
                  icon: <Monitor size={13} />,
                },
                {
                  value: "light",
                  label: t("light"),
                  icon: <Sun size={13} />,
                },
                {
                  value: "dark",
                  label: t("dark"),
                  icon: <Moon size={13} />,
                },
              ]}
              onChange={(value) =>
                onChange({ appearance: value as ManagerAppearance })
              }
            />
          </div>
        </section>
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <ShieldCheck size={17} />
            <div>
              <h2>{t("runtimeStrategy")}</h2>
              <p>{t("runtimeStrategyDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <label className="select-control">
              <select
                value={settings.runtimeStrategy}
                onChange={(event) =>
                  onChange({
                    runtimeStrategy: event.target.value as RuntimeStrategy,
                  })
                }
              >
                <option value="enhanced">{t("automaticMode")}</option>
                <option value="conservative">{t("compatibilityMode")}</option>
              </select>
              <ChevronRight size={14} aria-hidden="true" />
            </label>
            <p className="settings-mode-note">
              {settings.runtimeStrategy === "enhanced"
                ? t("automaticModeDescription")
                : t("compatibilityModeDescription")}
            </p>
          </div>
        </section>
        <section className="settings-group codex-location-setting">
          <div className="settings-group__title">
            <FolderOpen size={17} />
            <div>
              <h2>{t("codexLocation")}</h2>
              <p>{t("codexLocationDescription")}</p>
            </div>
          </div>
          <div className="codex-location-control">
            <div className="codex-location-path">
              <small>
                {settings.codexInstallPath
                  ? t("customLocation")
                  : t("detectedAutomatically")}
              </small>
              <strong title={detection?.path ?? undefined}>
                {detection?.path ?? t("codexNotDetected")}
              </strong>
            </div>
            <div className="button-row">
              {settings.codexInstallPath && (
                <button
                  className="text-button"
                  onClick={onUseAutomaticCodexInstall}
                  disabled={installPathBusy}
                >
                  {t("useAutomaticDetection")}
                </button>
              )}
              <button
                className="secondary-button"
                onClick={onChooseCodexInstall}
                disabled={installPathBusy}
              >
                <FolderOpen size={14} />
                {installPathBusy ? t("checking") : t("chooseApplication")}
              </button>
            </div>
          </div>
        </section>
        <SettingToggle
          icon={<Sparkles size={17} />}
          title={t("reduceMotion")}
          description={t("reduceMotionDescription")}
          checked={settings.reduceMotion}
          onChange={(checked) => onChange({ reduceMotion: checked })}
        />
        <SettingToggle
          icon={<RefreshCw size={17} />}
          title={t("automaticUpdateChecks")}
          description={t("automaticUpdateChecksDescription")}
          checked={settings.automaticUpdateChecks}
          onChange={(checked) => onChange({ automaticUpdateChecks: checked })}
        />
        <section className="settings-group settings-group--row update-settings-row">
          <div className="update-settings-row__version">
            <small>{t("currentVersion")}</small>
            <strong>Codex Styler {currentVersion}</strong>
            <span>
              {t("lastChecked")}: {lastChecked}
            </span>
          </div>
          <button
            className="secondary-button"
            onClick={onCheckForUpdates}
            disabled={updateStatus === "checking"}
          >
            <RefreshCw
              size={14}
              className={updateStatus === "checking" ? "is-spinning" : ""}
            />
            {updateStatus === "checking"
              ? t("checkingForUpdates")
              : t("checkForUpdates")}
          </button>
        </section>
        <section className="settings-group settings-group--row diagnostics-settings-row">
          <div className="settings-group__title">
            <ShieldCheck size={17} />
            <div>
              <h2>{t("diagnosticsTitle")}</h2>
              <p>{t("diagnosticsDescription")}</p>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={onRunDiagnostics}
            disabled={diagnosticsBusy}
          >
            <RefreshCw
              size={14}
              className={diagnosticsBusy ? "is-spinning" : ""}
            />
            {diagnosticsBusy ? t("runningDiagnostics") : t("runDiagnostics")}
          </button>
        </section>
        <section className="trust-grid">
          <article>
            <LockKeyhole size={20} />
            <h3>{t("privacyTitle")}</h3>
            <p>{t("privacyBody")}</p>
          </article>
          <article>
            <ShieldCheck size={20} />
            <h3>{t("compatibilityTitle")}</h3>
            <p>{t("compatibilityBody")}</p>
          </article>
        </section>
        <button className="text-button" onClick={onOpenOnboarding}>
          {t("openOnboarding")}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <section className="settings-group settings-group--row">
      <div className="settings-group__title">
        {icon}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <button
        className={"toggle" + (checked ? " toggle--on" : "")}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span />
      </button>
    </section>
  );
}
