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
  Palette,
  PanelRightOpen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import {
  builtinThemes,
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
  type ReactNode,
} from "react";
import { BrandMark } from "./components/BrandMark";
import { Onboarding } from "./components/Onboarding";
import { PreviewWorkspace } from "./components/PreviewWorkspace";
import { detectLocale, translate, type Locale, type MessageKey } from "./lib/i18n";
import {
  loadLocalThemes,
  loadSettings,
  saveLocalThemes,
  saveSettings,
  type ManagerAppearance,
  type UserSettings,
} from "./lib/storage";
import {
  applyTheme,
  detectCodex,
  getRuntimeStatus,
  launchCodex,
  pauseTheme,
  restoreOfficial,
  type CodexDetection,
  type RuntimeStatus,
} from "./lib/runtime";
import {
  exportTheme,
  hydrateThemeAssetMaps,
  importTheme,
  persistThemeCopy,
  type ThemeAssetMap,
} from "./lib/theme-files";
import { themeAssetUrl } from "./lib/assets";

type View = "themes" | "create" | "library" | "settings";
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
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadSettings(detectLocale()),
  );
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
  const [localThemes, setLocalThemes] = useState<ThemeDefinition[]>(loadLocalThemes);
  const [themeAssetMaps, setThemeAssetMaps] = useState<
    Record<string, ThemeAssetMap>
  >({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(!settings.onboardingComplete);
  const importRef = useRef<HTMLInputElement>(null);

  const t = (key: MessageKey) => translate(settings.locale, key);
  const resolveAsset = (theme: ThemeDefinition, path: string) =>
    themeAssetMaps[theme.id]?.[path] ?? themeAssetUrl(theme, path);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.dataset.appearance = settings.appearance;
    document.documentElement.lang = settings.locale;
    document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [settings]);

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

  async function handleApply() {
    setBusy(true);
    try {
      let next = runtime;
      if (!next.connected) next = await launchCodex();
      next = await applyTheme(
        view === "create" ? draftTheme : selectedTheme,
        variant,
        resolveAsset,
      );
      setRuntime(next);
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

  function chooseTheme(theme: ThemeDefinition, openEditor = false) {
    setSelectedTheme(theme);
    if (openEditor) setView("create");
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
    setDraftTheme((current) => {
      const next = structuredClone(current);
      if (next.scene.entities[0]) next.scene.entities[0].size = size;
      return next;
    });
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
      setThemeAssetMaps((current) => ({ ...current, [duplicate.id]: assetMap }));
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

  const navItems: Array<{ id: View; label: MessageKey; icon: ReactNode }> = [
    { id: "themes", label: "themes", icon: <Palette size={17} /> },
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
              className={view === item.id ? "app-nav__item app-nav__item--active" : "app-nav__item"}
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
            <strong>{runtime.connected ? t("connected") : t("ready")}</strong>
          </div>
          <span>
            {runtime.connected
              ? t("trustedRuntime")
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
            ) : (
              <button onClick={handleApply} disabled={busy}>
                <Play size={13} />
                {busy ? t("applying") : t("apply")}
              </button>
            )}
            <button className="icon-button" onClick={handleRestore} title={t("restore")}>
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
          <div className="window-drag-region" data-tauri-drag-region />
          <div className="topbar-status">
            <span className="topbar-status__dot" />
            {t("unknownCompatibility")}
          </div>
          <div className="variant-switch" aria-label="Theme variant">
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
        </header>

        {view === "themes" && (
          <ThemesView
            locale={settings.locale}
            selectedTheme={selectedTheme}
            variant={variant}
            reduceMotion={settings.reduceMotion}
            t={t}
            onSelect={chooseTheme}
            resolveAsset={resolveAsset}
          />
        )}

        {view === "create" && (
          <CreateView
            theme={draftTheme}
            variant={variant}
            locale={settings.locale}
            reduceMotion={settings.reduceMotion}
            t={t}
            onUpdateVariant={updateVariant}
            onUpdateEntitySize={updateEntitySize}
            onApply={handleApply}
            onExport={handleExport}
            onDuplicate={() => duplicateTheme(draftTheme)}
            resolveAsset={resolveAsset}
            busy={busy}
          />
        )}

        {view === "library" && (
          <LibraryView
            themes={localThemes}
            locale={settings.locale}
            t={t}
            onImport={() => importRef.current?.click()}
            onOpen={(theme) => chooseTheme(theme, true)}
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

      {showOnboarding && (
        <Onboarding
          locale={settings.locale}
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          onComplete={() => {
            updateSettings({ onboardingComplete: true });
            setShowOnboarding(false);
          }}
          onClose={
            settings.onboardingComplete ? () => setShowOnboarding(false) : undefined
          }
          t={t}
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

interface SharedViewProps {
  locale: Locale;
  t: (key: MessageKey) => string;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}

function ThemesView({
  locale,
  selectedTheme,
  variant,
  reduceMotion,
  t,
  onSelect,
  resolveAsset,
}: SharedViewProps & {
  selectedTheme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onSelect: (theme: ThemeDefinition, openEditor?: boolean) => void;
}) {
  const localized =
    selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedIndex =
    builtinThemes.findIndex((theme) => theme.id === selectedTheme.id) + 1;
  const performance =
    selectedTheme.scene.entities.length > 0 ||
    Object.values(selectedTheme.variants).some(
      (item) => Boolean(item.background.image),
    ) ||
    selectedTheme.scene.layers.some((layer) => Math.abs(layer.parallax) > 0)
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
          <span><LockKeyhole size={13} /> Local-first</span>
          <span><RotateCcw size={13} /> Reversible</span>
        </div>
      </section>

      <section className="featured-theme">
        <div className="featured-theme__preview">
          <div className="featured-theme__label">{t("featured")}</div>
          <PreviewWorkspace
            theme={selectedTheme}
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
              <strong>{selectedTheme.scene.entities.length ? "Pointer" : "—"}</strong>
            </div>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={() => onSelect(selectedTheme, true)}>
              {t("customize")}
              <ChevronRight size={15} />
            </button>
            <button className="secondary-button" onClick={() => onSelect(selectedTheme)}>
              <Check size={14} />
              {t("selected")}
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
  t,
}: {
  theme: ThemeDefinition;
  index: number;
  locale: Locale;
  active: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onSelect: () => void;
  onCustomize: () => void;
  t: (key: MessageKey) => string;
}) {
  const localized = theme.locales[locale] ?? theme.locales.en;
  const preview = theme.metadata.preview
    ? resolveAsset(theme, theme.metadata.preview)
    : undefined;
  return (
    <article className={"theme-row" + (active ? " theme-row--active" : "")}>
      <button className="theme-row__preview" onClick={onSelect}>
        <span
          style={{
            backgroundColor: theme.variants.dark.background.color,
            backgroundImage: preview ? "url(" + preview + ")" : undefined,
          }}
        />
        <small>{String(index).padStart(2, "0")}</small>
      </button>
      <div className="theme-row__copy">
        <span>{theme.metadata.tags.slice(0, 3).join(" · ").toUpperCase()}</span>
        <h3>{localized.name}</h3>
        <p>{localized.description}</p>
      </div>
      <div className="theme-row__badges">
        {theme.scene.entities.length > 0 && (
          <span><MousePointer2 size={12} />{t("interactive")}</span>
        )}
        <span>{theme.compatibility.codex.mode === "safe" ? "SAFE" : "SEMANTIC"}</span>
      </div>
      <button className="theme-row__action" onClick={onCustomize}>
        {t("customize")}
        <ChevronRight size={14} />
      </button>
    </article>
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
  onApply,
  onExport,
  onDuplicate,
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
  onApply: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  busy: boolean;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
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
            <button aria-label={t("addLayer")}><Plus size={14} /></button>
          </div>
          <div className="layer-stack">
            <button className="layer-item layer-item--active">
              <span className="layer-icon"><Image size={15} /></span>
              <span><strong>{t("background")}</strong><small>Image + overlay</small></span>
              <Layers3 size={13} />
            </button>
            <button className="layer-item">
              <span className="layer-icon"><Sparkles size={15} /></span>
              <span><strong>{t("surfaces")}</strong><small>Semantic material</small></span>
              <Layers3 size={13} />
            </button>
            {entity && (
              <button className="layer-item">
                <span className="layer-icon layer-icon--green"><Leaf size={15} /></span>
                <span><strong>{entity.name}</strong><small>Sprite · pointer</small></span>
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
            <span><Monitor size={13} />{t("livePreview")}</span>
            <span>1280 × 760</span>
          </div>
          <div className="canvas-stage">
            <PreviewWorkspace
              theme={theme}
              variant={variant}
              locale={locale}
              reduceMotion={reduceMotion}
              resolveAsset={resolveAsset}
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
          <InspectorSection title={t("background")} icon={<Image size={14} />}>
            <ColorControl
              label={t("overlay")}
              value={visual.background.overlay}
              onChange={(value) => onUpdateVariant("background", "overlay", value)}
            />
            <RangeControl
              label={t("brightness")}
              value={visual.background.brightness}
              min={0.2}
              max={2}
              step={0.01}
              display={Math.round(visual.background.brightness * 100) + "%"}
              onChange={(value) => onUpdateVariant("background", "brightness", value)}
            />
            <RangeControl
              label={t("blur")}
              value={visual.background.blur}
              min={0}
              max={40}
              step={1}
              display={visual.background.blur + "px"}
              onChange={(value) => onUpdateVariant("background", "blur", value)}
            />
            <RangeControl
              label={t("overlay")}
              value={visual.background.overlayOpacity}
              min={0}
              max={1}
              step={0.01}
              display={Math.round(visual.background.overlayOpacity * 100) + "%"}
              onChange={(value) =>
                onUpdateVariant("background", "overlayOpacity", value)
              }
            />
          </InspectorSection>
          <InspectorSection title={t("surfaces")} icon={<Layers3 size={14} />}>
            <ColorControl
              label="Accent"
              value={visual.appearance.accent}
              onChange={(value) => onUpdateVariant("appearance", "accent", value)}
            />
            <RangeControl
              label={t("surfaceOpacity")}
              value={visual.appearance.surfaceOpacity}
              min={0}
              max={1}
              step={0.01}
              display={Math.round(visual.appearance.surfaceOpacity * 100) + "%"}
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
              onChange={(value) => onUpdateVariant("appearance", "radius", value)}
            />
          </InspectorSection>
          <InspectorSection title={t("motion")} icon={<Sparkles size={14} />}>
            <RangeControl
              label={t("motionIntensity")}
              value={visual.motion.intensity}
              min={0}
              max={1}
              step={0.01}
              display={Math.round(visual.motion.intensity * 100) + "%"}
              onChange={(value) => onUpdateVariant("motion", "intensity", value)}
            />
            {entity && (
              <RangeControl
                label={t("companionSize")}
                value={entity.size}
                min={48}
                max={240}
                step={1}
                display={entity.size + "px"}
                onChange={onUpdateEntitySize}
              />
            )}
          </InspectorSection>
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
      <h3>{icon}{title}</h3>
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
      <span><strong>{label}</strong><small>{display}</small></span>
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
      <span><strong>{label}</strong><small>{value.toUpperCase()}</small></span>
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
  resolveAsset,
}: SharedViewProps & {
  themes: ThemeDefinition[];
  onImport: () => void;
  onOpen: (theme: ThemeDefinition) => void;
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
            <Upload size={14} />{t("importTheme")}
          </button>
        </div>
      </section>
      {themes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon"><FolderOpen size={26} /></span>
          <h2>{t("noLocalThemes")}</h2>
          <p>.codex-styler-theme · JSON + local raster assets · no scripts</p>
          <button className="primary-button" onClick={onImport}>
            <Upload size={14} />{t("importTheme")}
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
              <button
                key={theme.id}
                className="library-theme"
                onClick={() => onOpen(theme)}
              >
                <span
                  className="library-theme__visual"
                  style={{
                    backgroundColor: theme.variants.dark.background.color,
                    backgroundImage: preview ? "url(" + preview + ")" : undefined,
                  }}
                />
                <span className="library-theme__copy">
                  <small>{theme.version}</small>
                  <strong>{localized.name}</strong>
                  <span>{localized.description}</span>
                </span>
                <ChevronRight size={16} />
              </button>
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
            <div><h2>{t("language")}</h2><p>Interface and local theme metadata</p></div>
          </div>
          <SegmentedControl
            value={settings.locale}
            options={[
              { value: "en", label: "English" },
              { value: "zh-CN", label: "简体中文" },
            ]}
            onChange={(value) => onChange({ locale: value as Locale })}
          />
        </section>
        <section className="settings-group">
          <div className="settings-group__title">
            <Palette size={17} />
            <div><h2>{t("managerAppearance")}</h2><p>Independent from the applied Codex theme</p></div>
          </div>
          <SegmentedControl
            value={settings.appearance}
            options={[
              { value: "system", label: t("system"), icon: <Monitor size={13} /> },
              { value: "light", label: t("light"), icon: <Sun size={13} /> },
              { value: "dark", label: t("dark"), icon: <Moon size={13} /> },
            ]}
            onChange={(value) =>
              onChange({ appearance: value as ManagerAppearance })
            }
          />
        </section>
        <SettingToggle
          icon={<Sparkles size={17} />}
          title={t("reduceMotion")}
          description="Freezes pointer tracking and non-essential parallax."
          checked={settings.reduceMotion}
          onChange={(checked) => onChange({ reduceMotion: checked })}
        />
        <SettingToggle
          icon={<WifiOff size={17} />}
          title={t("updateChecks")}
          description="Never runs automatically in the background."
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
          {t("openOnboarding")}<ChevronRight size={14} />
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
          {option.icon}{option.label}
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
        <div><h2>{title}</h2><p>{description}</p></div>
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
