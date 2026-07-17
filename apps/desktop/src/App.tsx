import {
  Check,
  ChevronRight,
  Copy,
  Download,
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
  type CompanionDefinition,
  type EntityAttachment,
  type ThemeDefinition,
  type ThemeVariant,
} from "@codex-styler/theme-core";
import {
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
import {
  resolveLocale,
  translate,
  type Locale,
  type LocalePreference,
  type MessageKey,
} from "./lib/i18n";
import {
  loadLocalThemes,
  loadSettings,
  saveLocalThemes,
  saveSettings,
  type ManagerAppearance,
  type RuntimeStrategy,
  type UserSettings,
} from "./lib/storage";
import {
  applyTheme,
  checkForUpdates,
  detectCodex,
  downloadAndInstallUpdate,
  getRuntimeStatus,
  launchCodex,
  pauseTheme,
  quitCodex,
  restartApp,
  restoreOfficial,
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
import { themeAssetUrl } from "./lib/assets";

type View = "home" | "themes" | "companions" | "settings" | "editor";
type ThemeCollection = "builtIn" | "mine";
type NewThemeStep = "choose" | "existing";
type ThemeVariantName = "light" | "dark";
type UpdateStatus = "idle" | "checking" | "current" | "error";
type UpdateInstallStatus = "idle" | "downloading" | "installing" | "restarting";

const initialRuntime: RuntimeStatus = {
  state: "idle",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
};

export function App() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
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
  const [themeCollection, setThemeCollection] =
    useState<ThemeCollection>("builtIn");
  const [newThemeStep, setNewThemeStep] = useState<NewThemeStep | null>(null);
  const [themeAssetMaps, setThemeAssetMaps] = useState<
    Record<string, ThemeAssetMap>
  >({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState("0.1.0-alpha.5");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [availableUpdate, setAvailableUpdate] =
    useState<AvailableUpdate | null>(null);
  const [updateInstallStatus, setUpdateInstallStatus] =
    useState<UpdateInstallStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    !settings.onboardingComplete,
  );
  const [pendingDelete, setPendingDelete] = useState<ThemeDefinition | null>(
    null,
  );
  const [pendingApplication, setPendingApplication] = useState<{
    theme: ThemeDefinition;
    companion: CompanionDefinition | null;
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const backgroundImportRef = useRef<HTMLInputElement>(null);
  const [backgroundImportMode, setBackgroundImportMode] = useState<
    "create" | "replace"
  >("create");
  const [adaptiveSchemes, setAdaptiveSchemes] = useState<AdaptiveScheme[]>([]);
  const [activeAdaptiveScheme, setActiveAdaptiveScheme] =
    useState<AdaptiveSchemeId | null>(null);
  const startupUpdateCheckRef = useRef(false);

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
  const resolveAsset = (theme: ThemeDefinition, path: string) =>
    themeAssetMaps[theme.id]?.[path] ?? themeAssetUrl(theme, path);
  const explicitCompanion =
    builtinCompanions.find((item) => item.id === settings.companionId) ?? null;
  const companionForTheme = (theme: ThemeDefinition) => {
    if (settings.companionMode === "disabled") return null;
    if (settings.companionMode === "custom") return explicitCompanion;
    return defaultCompanionForTheme(theme.id);
  };
  const selectedCompanion = companionForTheme(selectedTheme);
  const appliedTheme =
    [...builtinThemes, ...localThemes].find(
      (theme) => theme.id === settings.appliedThemeId,
    ) ?? selectedTheme;
  const composeTheme = (
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = companionForTheme(theme),
  ) => {
    if (!companion) return composeThemeWithCompanion(theme, null);
    const overrides: {
      anchor?: { x: number; y: number };
      attachment?: EntityAttachment | null;
      size?: number;
    } = {
      anchor: settings.companionAnchors[companion.id],
      size: settings.companionSizes[companion.id],
    };
    if (
      Object.prototype.hasOwnProperty.call(
        settings.companionAttachments,
        companion.id,
      )
    ) {
      overrides.attachment = settings.companionAttachments[companion.id];
    }
    return composeThemeWithCompanion(theme, companion, overrides);
  };

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.dataset.appearance = settings.appearance;
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle(
      "reduce-motion",
      settings.reduceMotion,
    );
  }, [locale, settings]);

  useEffect(() => {
    void Promise.all([detectCodex(), getRuntimeStatus()]).then(
      ([detected, status]) => {
        setDetection(detected);
        setRuntime(status);
      },
    );
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
  }, [settings.automaticUpdateChecks, settings.onboardingComplete]);

  const appTheme = useMemo(() => {
    if (settings.appearance === "system") return "system";
    return settings.appearance;
  }, [settings.appearance]);

  const needsManualRestart = detection?.running === true && !runtime.connected;

  async function performApply(
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = companionForTheme(theme),
  ) {
    const composed = composeTheme(theme, companion);
    setBusy(true);
    try {
      let next = await getRuntimeStatus();
      setRuntime(next);
      if (!next.connected) {
        const currentDetection = await detectCodex();
        setDetection(currentDetection);
        if (currentDetection.running) {
          setPendingApplication({ theme, companion });
          return;
        }
      }
      if (!next.connected) next = await launchCodex();
      next = await applyTheme(
        composed,
        variant,
        settings.runtimeStrategy,
        resolveAsset,
      );
      setRuntime(next);
      setSelectedTheme(theme);
      updateSettings({ appliedThemeId: theme.id });
      setDetection(await detectCodex());
      setToast(t("connected"));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setRuntime({
        ...runtime,
        state: "error",
        message: detail,
      });
      setToast(`${t("applyFailed")}: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  function requestApply(
    theme: ThemeDefinition = view === "editor" ? draftTheme : selectedTheme,
    companion: CompanionDefinition | null = companionForTheme(theme),
  ) {
    if (needsManualRestart) {
      setPendingApplication({ theme, companion });
      return;
    }
    void performApply(theme, companion);
  }

  async function handleQuitAndApply() {
    if (!pendingApplication) return;
    const application = pendingApplication;
    setBusy(true);
    try {
      const detected = await quitCodex();
      setDetection(detected);
      setPendingApplication(null);
      await performApply(application.theme, application.companion);
    } catch (error) {
      console.error(error);
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
      const result = await checkForUpdates();
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

  function updateSettings(patch: Partial<UserSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function startWindowDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !("__TAURI_INTERNALS__" in window)) return;
    void getCurrentWindow().startDragging();
  }

  function chooseTheme(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
  }

  function chooseAndApplyTheme(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
    requestApply(theme, companionForTheme(theme));
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
    updateSettings({
      companionSizes: {
        ...settings.companionSizes,
        [selectedCompanion.id]: size,
      },
    });
  }

  function updateEntityAnchor(anchor: { x: number; y: number }) {
    if (!selectedCompanion) return;
    updateSettings({
      companionAnchors: {
        ...settings.companionAnchors,
        [selectedCompanion.id]: anchor,
      },
    });
  }

  function updateEntityAttachment(attachment: EntityAttachment | null) {
    if (!selectedCompanion) return;
    updateSettings({
      companionAttachments: {
        ...settings.companionAttachments,
        [selectedCompanion.id]: attachment,
      },
    });
  }

  function selectCompanion(companion: CompanionDefinition | null) {
    updateSettings({
      companionMode: companion ? "custom" : "disabled",
      companionId: companion?.id ?? null,
    });
    setToast(t("companionUpdated"));
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
  const activeNavigation = view === "editor" ? "themes" : view;

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
            <strong>
              {runtime.connected
                ? t("connected")
                : needsManualRestart
                  ? t("codexRunning")
                  : t("ready")}
            </strong>
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
            {runtime.state === "applied" ? (
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
                {busy ? t("applying") : t("apply")}
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
              : runtime.state === "applied"
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
            theme={composeTheme(appliedTheme)}
            sourceTheme={appliedTheme}
            companion={companionForTheme(appliedTheme)}
            runtime={runtime}
            runtimeStrategy={settings.runtimeStrategy}
            variant={variant}
            reduceMotion={settings.reduceMotion}
            t={t}
            onApply={() => requestApply(appliedTheme)}
            onEdit={() => openThemeEditor(appliedTheme)}
            onBrowse={() => setView("themes")}
            onCreateFromImage={() => {
              setBackgroundImportMode("create");
              setNewThemeStep(null);
              backgroundImportRef.current?.click();
            }}
            onCompanions={() => setView("companions")}
            onRestore={handleRestore}
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
            onApply={chooseAndApplyTheme}
            onEdit={openThemeEditor}
            onDelete={setPendingDelete}
            onCollectionChange={changeThemeCollection}
            onNew={() => setNewThemeStep("choose")}
            onImport={() => importRef.current?.click()}
            resolveAsset={resolveAsset}
          />
        )}

        {view === "companions" && (
          <CompanionsView
            locale={locale}
            selected={selectedCompanion}
            theme={composeTheme(selectedTheme)}
            variant={variant}
            reduceMotion={settings.reduceMotion}
            t={t}
            onSelect={selectCompanion}
            onAnchorChange={updateEntityAnchor}
            onAttachmentChange={updateEntityAttachment}
            resolveAsset={resolveAsset}
          />
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
            currentVersion={currentVersion}
            updateStatus={updateStatus}
            t={t}
            onChange={updateSettings}
            onCheckForUpdates={() => void handleCheckForUpdates(true)}
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
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setPendingApplication(null)}
                disabled={busy}
              >
                {t("cancel")}
              </button>
              <button
                className="primary-button"
                onClick={handleQuitAndApply}
                disabled={busy}
              >
                <RefreshCw size={14} />
                {busy ? t("applying") : t("quitAndContinue")}
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
            {availableUpdate.notes && (
              <div className="update-dialog__notes">
                <strong>{t("releaseNotes")}</strong>
                <p>{availableUpdate.notes}</p>
              </div>
            )}
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
  onApply,
  onEdit,
  onBrowse,
  onCreateFromImage,
  onCompanions,
  onRestore,
  resolveAsset,
}: SharedViewProps & {
  theme: ThemeDefinition;
  sourceTheme: ThemeDefinition;
  companion: CompanionDefinition | null;
  runtime: RuntimeStatus;
  runtimeStrategy: RuntimeStrategy;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onApply: () => void;
  onEdit: () => void;
  onBrowse: () => void;
  onCreateFromImage: () => void;
  onCompanions: () => void;
  onRestore: () => void;
}) {
  const copy = sourceTheme.locales[locale] ?? sourceTheme.locales.en;
  const companionCopy = companion
    ? (companion.locales[locale] ?? companion.locales.en)
    : null;
  return (
    <div className="page home-page">
      <section className="page-heading home-heading">
        <div>
          <span className="page-kicker">WORKSPACE CONTROL</span>
          <h1>{t("homeTitle")}</h1>
          <p>{t("homeDescription")}</p>
        </div>
        <div className="home-heading__status">
          <span className={runtime.state === "applied" ? "is-live" : ""} />
          <div>
            <small>{t("codexAppearance")}</small>
            <strong>
              {runtime.state === "applied" ? t("themeActive") : t("ready")}
            </strong>
          </div>
        </div>
      </section>

      <section className="home-current">
        <div className="home-current__preview">
          <span className="home-current__label">{t("currentSetup")}</span>
          <PreviewWorkspace
            theme={theme}
            variant={variant}
            locale={locale}
            reduceMotion={reduceMotion}
            resolveAsset={resolveAsset}
          />
        </div>
        <div className="home-current__content">
          <span className="home-current__eyebrow">{t("appliedTheme")}</span>
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
            <button className="primary-button" onClick={onApply}>
              <Play size={14} />
              {t("apply")}
            </button>
            <button className="secondary-button" onClick={onEdit}>
              {t("editTheme")}
              <ChevronRight size={15} />
            </button>
          </div>
          <button className="home-restore" onClick={onRestore}>
            <RotateCcw size={13} />
            {t("restore")}
          </button>
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
  onApply,
  onEdit,
  onDelete,
  onCollectionChange,
  onNew,
  onImport,
  resolveAsset,
}: SharedViewProps & {
  selectedTheme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  localThemes: ThemeDefinition[];
  collection: ThemeCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (theme: ThemeDefinition) => void;
  onApply: (theme: ThemeDefinition) => void;
  onEdit: (theme: ThemeDefinition) => void;
  onDelete: (theme: ThemeDefinition) => void;
  onCollectionChange: (collection: ThemeCollection) => void;
  onNew: () => void;
  onImport: () => void;
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
              <div className="featured-theme__label">{t("selectedTheme")}</div>
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
              <div className="button-row">
                <button
                  className="primary-button"
                  onClick={() => onApply(selectedTheme)}
                >
                  <Play size={14} />
                  {t("apply")}
                </button>
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
                  resolveAsset={resolveAsset}
                  onSelect={() => onSelect(theme)}
                  onApply={() => onApply(theme)}
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
  resolveAsset,
  onSelect,
  local,
  onEdit,
  onDelete,
  onApply,
  t,
}: {
  theme: ThemeDefinition;
  index: number;
  locale: Locale;
  active: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onSelect: () => void;
  local: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onApply: () => void;
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
        aria-label={`${t("selected")}: ${localized.name}`}
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
        <button className="theme-row__apply" onClick={onApply}>
          <Play size={13} />
          {t("apply")}
        </button>
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
  variant,
  reduceMotion,
  t,
  onSelect,
  onAnchorChange,
  onAttachmentChange,
  resolveAsset,
}: SharedViewProps & {
  selected: CompanionDefinition | null;
  theme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (companion: CompanionDefinition | null) => void;
  onAnchorChange: (anchor: { x: number; y: number }) => void;
  onAttachmentChange: (attachment: EntityAttachment | null) => void;
}) {
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
      </section>
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
          {builtinCompanions.map((item) => {
            const copy = item.locales[locale] ?? item.locales.en;
            const active = selected?.id === item.id;
            const renderer = item.entity.renderer;
            const previewSize = 64;
            const frameScale =
              renderer.type === "sprite-atlas"
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
              renderer.type === "sprite-atlas"
                ? renderer.frameWidth * frameScale
                : previewSize;
            const frameHeight =
              renderer.type === "sprite-atlas"
                ? renderer.frameHeight * frameScale
                : previewSize;
            return (
              <button
                key={item.id}
                className={
                  "companion-option" +
                  (active ? " companion-option--active" : "")
                }
                onClick={() => onSelect(item)}
              >
                <span className="companion-option__visual companion-option__visual--sprite">
                  <span
                    className="companion-option__frame"
                    style={{
                      width: `${frameWidth}px`,
                      height: `${frameHeight}px`,
                      backgroundImage: `url(${resolveAsset(theme, renderer.asset)})`,
                      backgroundSize,
                    }}
                  />
                </span>
                <span>
                  <strong>{copy.name}</strong>
                  <small>{copy.description}</small>
                </span>
                {active ? <Check size={15} /> : <ChevronRight size={15} />}
              </button>
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
  currentVersion,
  updateStatus,
  t,
  onChange,
  onCheckForUpdates,
  onOpenOnboarding,
}: {
  settings: UserSettings;
  currentVersion: string;
  updateStatus: UpdateStatus;
  t: (key: MessageKey) => string;
  onChange: (patch: Partial<UserSettings>) => void;
  onCheckForUpdates: () => void;
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
        <section className="settings-group">
          <div className="settings-group__title">
            <Languages size={17} />
            <div>
              <h2>{t("language")}</h2>
              <p>{t("languageDescription")}</p>
            </div>
          </div>
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
        </section>
        <section className="settings-group">
          <div className="settings-group__title">
            <Palette size={17} />
            <div>
              <h2>{t("managerAppearance")}</h2>
              <p>{t("managerAppearanceDescription")}</p>
            </div>
          </div>
          <SegmentedControl
            value={settings.appearance}
            options={[
              {
                value: "system",
                label: t("system"),
                icon: <Monitor size={13} />,
              },
              { value: "light", label: t("light"), icon: <Sun size={13} /> },
              { value: "dark", label: t("dark"), icon: <Moon size={13} /> },
            ]}
            onChange={(value) =>
              onChange({ appearance: value as ManagerAppearance })
            }
          />
        </section>
        <section className="settings-group">
          <div className="settings-group__title">
            <ShieldCheck size={17} />
            <div>
              <h2>{t("runtimeStrategy")}</h2>
              <p>{t("runtimeStrategyDescription")}</p>
            </div>
          </div>
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
