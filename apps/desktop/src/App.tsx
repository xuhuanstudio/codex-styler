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
  Library,
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
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  WifiOff,
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
  detectCodex,
  getRuntimeStatus,
  launchCodex,
  pauseTheme,
  quitCodex,
  restoreOfficial,
  type CodexDetection,
  type RuntimeStatus,
} from "./lib/runtime";
import {
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

type View = "themes" | "companions" | "create" | "library" | "settings";
type ThemeVariantName = "light" | "dark";

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
  const [view, setView] = useState<View>("themes");
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
  const [themeAssetMaps, setThemeAssetMaps] = useState<
    Record<string, ThemeAssetMap>
  >({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
  const [adaptiveSchemes, setAdaptiveSchemes] = useState<AdaptiveScheme[]>([]);
  const [activeAdaptiveScheme, setActiveAdaptiveScheme] =
    useState<AdaptiveSchemeId | null>(null);

  const locale = resolveLocale(settings.locale);
  const t = (key: MessageKey) => translate(locale, key);
  const resolveAsset = (theme: ThemeDefinition, path: string) =>
    themeAssetMaps[theme.id]?.[path] ?? themeAssetUrl(theme, path);
  const selectedCompanion =
    builtinCompanions.find((item) => item.id === settings.companionId) ?? null;
  const composeTheme = (
    theme: ThemeDefinition,
    companion = selectedCompanion,
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

  const appTheme = useMemo(() => {
    if (settings.appearance === "system") return "system";
    return settings.appearance;
  }, [settings.appearance]);

  const needsManualRestart = detection?.running === true && !runtime.connected;

  async function performApply(
    theme: ThemeDefinition,
    companion: CompanionDefinition | null = selectedCompanion,
  ) {
    const composed = composeTheme(theme, companion);
    setBusy(true);
    try {
      let next = runtime;
      if (!next.connected) next = await launchCodex();
      next = await applyTheme(
        composed,
        variant,
        settings.runtimeStrategy,
        resolveAsset,
      );
      setRuntime(next);
      setDetection(await detectCodex());
      setToast(t("connected"));
    } catch (error) {
      setRuntime({
        ...runtime,
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      setToast(t("connectionError"));
    } finally {
      setBusy(false);
    }
  }

  function requestApply(
    theme: ThemeDefinition = view === "create" ? draftTheme : selectedTheme,
    companion: CompanionDefinition | null = selectedCompanion,
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

  function updateSettings(patch: Partial<UserSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function startWindowDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !("__TAURI_INTERNALS__" in window)) return;
    void getCurrentWindow().startDragging();
  }

  function chooseTheme(theme: ThemeDefinition, openEditor = false) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    setSelectedTheme(theme);
    const pairing = defaultCompanionForTheme(theme.id);
    updateSettings({ companionId: pairing?.id ?? null });
    if (openEditor) setView("create");
  }

  function chooseAndApplyTheme(theme: ThemeDefinition) {
    setAdaptiveSchemes([]);
    setActiveAdaptiveScheme(null);
    const pairing = defaultCompanionForTheme(theme.id);
    setSelectedTheme(theme);
    updateSettings({ companionId: pairing?.id ?? null });
    requestApply(theme, pairing);
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
    updateSettings({ companionId: companion?.id ?? null });
    setToast(t("companionUpdated"));
  }

  function resetDraft() {
    setDraftTheme(structuredClone(selectedTheme));
    const pairing = defaultCompanionForTheme(selectedTheme.id);
    const nextAnchors = { ...settings.companionAnchors };
    const nextSizes = { ...settings.companionSizes };
    const nextAttachments = { ...settings.companionAttachments };
    if (pairing) {
      delete nextAnchors[pairing.id];
      delete nextSizes[pairing.id];
      delete nextAttachments[pairing.id];
    }
    updateSettings({
      companionId: pairing?.id ?? null,
      companionAnchors: nextAnchors,
      companionSizes: nextSizes,
      companionAttachments: nextAttachments,
    });
    setToast(t("resetTheme"));
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
      setView("create");
    } catch (error) {
      console.error(error);
      setToast(t("invalidTheme"));
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
      setView("library");
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
      setView("create");
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
        view === "create" ? draftTheme : selectedTheme,
        resolveAsset,
      );
      setToast(t("exportReady"));
    } catch (error) {
      console.error(error);
      setToast(t("invalidTheme"));
    }
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
    { id: "themes", label: "themes", icon: <Palette size={17} /> },
    { id: "companions", label: "companions", icon: <PawPrint size={17} /> },
    { id: "create", label: "create", icon: <SlidersHorizontal size={17} /> },
    { id: "library", label: "library", icon: <Library size={17} /> },
    { id: "settings", label: "settings", icon: <Settings size={17} /> },
  ];

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
                view === item.id
                  ? "app-nav__item app-nav__item--active"
                  : "app-nav__item"
              }
              onClick={() => setView(item.id)}
            >
              {item.icon}
              <span>{t(item.label)}</span>
              {item.id === "library" && localThemes.length > 0 && (
                <small>{localThemes.length}</small>
              )}
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

        {view === "themes" && (
          <ThemesView
            locale={locale}
            selectedTheme={selectedTheme}
            previewTheme={composeTheme(selectedTheme)}
            variant={variant}
            reduceMotion={settings.reduceMotion}
            t={t}
            onSelect={chooseTheme}
            onApply={chooseAndApplyTheme}
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

        {view === "create" && (
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
            onReset={resetDraft}
            onApply={() => requestApply(draftTheme)}
            onExport={handleExport}
            onDuplicate={() => duplicateTheme(draftTheme)}
            onImportBackground={() => backgroundImportRef.current?.click()}
            adaptiveSchemes={adaptiveSchemes}
            activeAdaptiveScheme={activeAdaptiveScheme}
            onSelectAdaptiveScheme={selectAdaptiveScheme}
            resolveAsset={resolveAsset}
            busy={busy}
          />
        )}

        {view === "library" && (
          <LibraryView
            themes={localThemes}
            locale={locale}
            t={t}
            onImport={() => importRef.current?.click()}
            onOpen={(theme) => chooseTheme(theme, true)}
            onDelete={setPendingDelete}
            resolveAsset={resolveAsset}
          />
        )}

        {view === "settings" && (
          <SettingsView
            settings={settings}
            t={t}
            onChange={updateSettings}
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

function ThemesView({
  locale,
  selectedTheme,
  previewTheme,
  variant,
  reduceMotion,
  t,
  onSelect,
  onApply,
  resolveAsset,
}: SharedViewProps & {
  selectedTheme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (theme: ThemeDefinition, openEditor?: boolean) => void;
  onApply: (theme: ThemeDefinition) => void;
}) {
  const localized = selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedIndex =
    builtinThemes.findIndex((theme) => theme.id === selectedTheme.id) + 1;
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
          <span className="page-kicker">CURATED WORKSPACES / 001—003</span>
          <h1>{t("overview")}</h1>
          <p>{t("overviewDetail")}</p>
        </div>
        <div className="page-heading__meta">
          <span>
            <LockKeyhole size={13} /> Local-first
          </span>
          <span>
            <RotateCcw size={13} /> Reversible
          </span>
        </div>
      </section>

      <section className="featured-theme">
        <div className="featured-theme__preview">
          <div className="featured-theme__label">{t("featured")}</div>
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
              onClick={() => onSelect(selectedTheme, true)}
            >
              {t("customize")}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section className="theme-index">
        <div className="section-heading">
          <div>
            <span>THEME INDEX</span>
            <h2>{t("allThemes")}</h2>
          </div>
          <span className="section-count">03 ORIGINAL THEMES</span>
        </div>
        <div className="theme-list">
          {builtinThemes.map((theme, index) => (
            <ThemeRow
              key={theme.id}
              theme={theme}
              index={index + 1}
              locale={locale}
              active={selectedTheme.id === theme.id}
              resolveAsset={resolveAsset}
              onSelect={() => onSelect(theme)}
              onApply={() => onApply(theme)}
              onCustomize={() => onSelect(theme, true)}
              t={t}
            />
          ))}
        </div>
      </section>
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
  onCustomize,
  onApply,
  t,
}: {
  theme: ThemeDefinition;
  index: number;
  locale: Locale;
  active: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onSelect: () => void;
  onCustomize: () => void;
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
        <button className="theme-row__action" onClick={onCustomize}>
          {t("customize")}
          <ChevronRight size={14} />
        </button>
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
            return (
              <button
                key={item.id}
                className={
                  "companion-option" +
                  (active ? " companion-option--active" : "")
                }
                onClick={() => onSelect(item)}
              >
                <span
                  className="companion-option__visual companion-option__visual--moss"
                  style={{
                    backgroundImage: `url(${resolveAsset(theme, item.entity.renderer.asset)})`,
                  }}
                />
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
  onReset,
  onApply,
  onExport,
  onDuplicate,
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
  onReset: () => void;
  onApply: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  onImportBackground: () => void;
  adaptiveSchemes: AdaptiveScheme[];
  activeAdaptiveScheme: AdaptiveSchemeId | null;
  onSelectAdaptiveScheme: (scheme: AdaptiveScheme) => void;
  busy: boolean;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<
    "background" | "surfaces" | "companion"
  >("background");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const visual = theme.variants[variant];
  const entity = theme.scene.entities[0];
  return (
    <div className="editor-page">
      <header className="editor-header">
        <div>
          <span>CREATE / {theme.metadata.name.toUpperCase()}</span>
          <h1>{theme.locales[locale]?.name ?? theme.metadata.name}</h1>
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
            onClick={onDuplicate}
            disabled={busy}
          >
            <Copy size={14} />
            {t("duplicate")}
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
          {activeLayer === "companion" && (
            <InspectorSection
              title={t("companion")}
              icon={<PawPrint size={14} />}
            >
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

function LibraryView({
  themes,
  locale,
  t,
  onImport,
  onOpen,
  onDelete,
  resolveAsset,
}: SharedViewProps & {
  themes: ThemeDefinition[];
  onImport: () => void;
  onOpen: (theme: ThemeDefinition) => void;
  onDelete: (theme: ThemeDefinition) => void;
}) {
  return (
    <div className="page library-page">
      <section className="page-heading">
        <div>
          <span className="page-kicker">LOCAL THEME LIBRARY</span>
          <h1>{t("library")}</h1>
          <p>{t("localOnly")}</p>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={onImport}>
            <Upload size={14} />
            {t("importTheme")}
          </button>
        </div>
      </section>
      {themes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <FolderOpen size={26} />
          </span>
          <h2>{t("noLocalThemes")}</h2>
          <p>.codex-styler-theme · JSON + local raster assets · no scripts</p>
          <button className="primary-button" onClick={onImport}>
            <Upload size={14} />
            {t("importTheme")}
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {themes.map((theme) => {
            const localized = theme.locales[locale] ?? theme.locales.en;
            const preview = theme.metadata.preview
              ? resolveAsset(theme, theme.metadata.preview)
              : undefined;
            return (
              <article key={theme.id} className="library-theme">
                <button
                  className="library-theme__open"
                  onClick={() => onOpen(theme)}
                  aria-label={`${t("customize")}: ${localized.name}`}
                />
                <span
                  className="library-theme__visual"
                  style={{
                    backgroundColor: theme.variants.dark.background.color,
                    backgroundImage: preview
                      ? "url(" + preview + ")"
                      : undefined,
                  }}
                />
                <span className="library-theme__copy">
                  <small>{theme.version}</small>
                  <strong>{localized.name}</strong>
                  <span>{localized.description}</span>
                </span>
                <button
                  className="library-theme__delete"
                  onClick={() => onDelete(theme)}
                  aria-label={`${t("deleteTheme")}: ${localized.name}`}
                  title={t("deleteTheme")}
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight className="library-theme__chevron" size={16} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsView({
  settings,
  t,
  onChange,
  onOpenOnboarding,
}: {
  settings: UserSettings;
  t: (key: MessageKey) => string;
  onChange: (patch: Partial<UserSettings>) => void;
  onOpenOnboarding: () => void;
}) {
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
          icon={<WifiOff size={17} />}
          title={t("updateChecks")}
          description={t("updateChecksDescription")}
          checked={settings.manualUpdateChecks}
          onChange={(checked) => onChange({ manualUpdateChecks: checked })}
        />
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
