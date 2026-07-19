import {
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  Image,
  Layers3,
  LoaderCircle,
  Monitor,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  PawPrint,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Undo2,
  X,
} from "lucide-react";
import {
  type CompanionDefinition,
  type SceneLayer,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import { SelectField } from "../../components/ui/SelectField";
import type { AppSessionState, ThemeVariantName } from "../../lib/app-session";
import type {
  AdaptiveScheme,
  AdaptiveSchemeId,
} from "../../lib/adaptive-theme";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { WorkspaceUiPreferences } from "../../lib/storage";
import {
  themeEditorSectionCoverage,
  type ThemeEditorControlId,
  type ThemeEditorSectionCoverage,
  type ThemeEditorSectionId,
} from "./control-mapping";

interface SharedViewProps {
  locale: Locale;
  t: (key: MessageKey) => string;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}

export function ThemeEditorView({
  theme,
  savedTheme,
  variant,
  locale,
  reduceMotion,
  t,
  onUpdateVariant,
  onAddSceneLayer,
  onUpdateSceneLayer,
  onRemoveSceneLayer,
  companions,
  recommendedCompanionId,
  onSetRecommendedCompanion,
  onBack,
  onReset,
  onUndo,
  onRedo,
  onSave,
  onApply,
  onExport,
  onImportBackground,
  adaptiveSchemes,
  activeAdaptiveScheme,
  onSelectAdaptiveScheme,
  resolveAsset,
  busy,
  dirty,
  operationPhase,
  operationError,
  applied,
  canUndo,
  canRedo,
  uiPreferences,
  onUiPreferencesChange,
}: SharedViewProps & {
  theme: ThemeDefinition;
  savedTheme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onUpdateVariant: (
    section: "background" | "appearance" | "motion",
    key: string,
    value: number | string,
    historyGroup?: string,
  ) => void;
  onAddSceneLayer: (type: SceneLayer["type"]) => void;
  onUpdateSceneLayer: (layerId: string, patch: Partial<SceneLayer>) => void;
  onRemoveSceneLayer: (layerId: string) => void;
  companions: CompanionDefinition[];
  recommendedCompanionId: string | null;
  onSetRecommendedCompanion: (companionId: string | null) => void;
  onBack: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onApply: () => void;
  onExport: () => void;
  onImportBackground: () => void;
  adaptiveSchemes: AdaptiveScheme[];
  activeAdaptiveScheme: AdaptiveSchemeId | null;
  onSelectAdaptiveScheme: (scheme: AdaptiveScheme) => void;
  busy: boolean;
  dirty: boolean;
  operationPhase: AppSessionState["operation"]["phase"];
  operationError: string | null;
  applied: boolean;
  canUndo: boolean;
  canRedo: boolean;
  uiPreferences: WorkspaceUiPreferences;
  onUiPreferencesChange: (patch: Partial<WorkspaceUiPreferences>) => void;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const inspectorToggleRef = useRef<HTMLButtonElement>(null);
  const [activeLayer, setActiveLayer] = useState<string>("background");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<"fit" | "actual">("fit");
  const [previewVersion, setPreviewVersion] = useState<"current" | "saved">(
    "current",
  );
  const visual = theme.variants[variant];
  const previewTheme = previewVersion === "saved" ? savedTheme : theme;
  const selectedSceneLayer = theme.scene.layers.find(
    (layer) => activeLayer === `scene:${layer.id}`,
  );
  const selectedSceneLayerIndex = selectedSceneLayer
    ? theme.scene.layers.findIndex(
        (layer) => layer.id === selectedSceneLayer.id,
      )
    : -1;
  const activeSection: ThemeEditorSectionId = selectedSceneLayer
    ? "scene"
    : activeLayer === "surfaces" ||
        activeLayer === "motion" ||
        activeLayer === "pairing"
      ? activeLayer
      : "background";
  const activeCoverage = themeEditorSectionCoverage(activeSection);
  const saving = operationPhase === "saving";
  const applying = operationPhase === "applying";
  const applyLabel = applying
    ? t("applying")
    : applied
      ? t("appliedToCodex")
      : dirty
        ? t("saveAndApply")
        : t("applyTheme");
  useEffect(() => {
    setPreviewVersion("current");
  }, [theme]);
  useEffect(() => {
    if (!dirty) setPreviewVersion("current");
  }, [dirty]);
  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (busy || event.altKey || (!event.metaKey && !event.ctrlKey)) return;
      const target = event.target;
      if (
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement &&
          !["range", "color"].includes(target.type)) ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const redoRequested =
        (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey);
      if (redoRequested && canRedo) {
        event.preventDefault();
        setPreviewVersion("current");
        onRedo();
      } else if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        setPreviewVersion("current");
        onUndo();
      }
    };
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [busy, canRedo, canUndo, onRedo, onUndo]);
  function selectActiveLayer(layer: string) {
    setPreviewVersion("current");
    setActiveLayer(layer);
    setInspectorOpen(true);
  }
  function closeInspector() {
    setInspectorOpen(false);
    inspectorToggleRef.current?.focus();
  }
  function resizePanel(panel: "layers" | "inspector", visualDelta: number) {
    const current =
      panel === "layers"
        ? uiPreferences.themeEditorLayersWidth
        : uiPreferences.themeEditorInspectorWidth;
    const next =
      panel === "layers" ? current + visualDelta : current - visualDelta;
    onUiPreferencesChange(
      panel === "layers"
        ? { themeEditorLayersWidth: Math.max(184, Math.min(320, next)) }
        : { themeEditorInspectorWidth: Math.max(264, Math.min(400, next)) },
    );
  }
  function handlePanelResizeKey(
    panel: "layers" | "inspector",
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    resizePanel(panel, event.key === "ArrowRight" ? 8 : -8);
  }
  function beginPanelResize(
    panel: "layers" | "inspector",
    event: ReactMouseEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth =
      panel === "layers"
        ? uiPreferences.themeEditorLayersWidth
        : uiPreferences.themeEditorInspectorWidth;
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth =
        panel === "layers" ? startWidth + delta : startWidth - delta;
      onUiPreferencesChange(
        panel === "layers"
          ? {
              themeEditorLayersWidth: Math.max(184, Math.min(320, nextWidth)),
            }
          : {
              themeEditorInspectorWidth: Math.max(
                264,
                Math.min(400, nextWidth),
              ),
            },
      );
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp, { once: true });
  }
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
          <span className="editor-save-state" data-dirty={dirty}>
            <i />
            {dirty ? t("unsavedChanges") : t("allChangesSaved")}
          </span>
          <div
            className="editor-history-actions"
            role="group"
            aria-label={t("editHistory")}
          >
            <button
              className="icon-button"
              onClick={() => {
                setPreviewVersion("current");
                onUndo();
              }}
              disabled={!canUndo || busy}
              aria-label={t("undoThemeChange")}
              aria-keyshortcuts="Meta+Z Control+Z"
              title={`${t("undoThemeChange")} · ⌘Z / Ctrl+Z`}
            >
              <Undo2 size={15} />
            </button>
            <button
              className="icon-button"
              onClick={() => {
                setPreviewVersion("current");
                onRedo();
              }}
              disabled={!canRedo || busy}
              aria-label={t("redoThemeChange")}
              aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
              title={`${t("redoThemeChange")} · ⇧⌘Z / Ctrl+Y`}
            >
              <Redo2 size={15} />
            </button>
          </div>
          <button
            className="secondary-button editor-focus-toggle"
            onClick={() =>
              onUiPreferencesChange({ focusMode: !uiPreferences.focusMode })
            }
            aria-pressed={uiPreferences.focusMode}
            aria-label={
              uiPreferences.focusMode ? t("exitFocusMode") : t("focusMode")
            }
          >
            {uiPreferences.focusMode ? (
              <PanelLeftOpen size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
            <span>
              {uiPreferences.focusMode ? t("exitFocusMode") : t("focusMode")}
            </span>
          </button>
          <button
            ref={inspectorToggleRef}
            className="secondary-button inspector-toggle"
            onClick={() => setInspectorOpen((open) => !open)}
            aria-label={t("appearance")}
            aria-controls="theme-editor-inspector"
            aria-expanded={inspectorOpen}
          >
            <PanelRightOpen size={14} />
            <span>{t("appearance")}</span>
          </button>
          <button
            className="secondary-button editor-save-button"
            data-dirty={dirty}
            onClick={onSave}
            disabled={busy || !dirty}
            title={dirty ? t("saveDraft") : t("allChangesSaved")}
          >
            {saving ? (
              <LoaderCircle size={14} className="is-spinning" />
            ) : dirty ? (
              <Save size={14} />
            ) : (
              <Check size={14} />
            )}
            {dirty && (
              <span className="editor-save-button__state" aria-hidden="true" />
            )}
            {saving ? t("saving") : t("saveDraft")}
          </button>
          <button
            className="primary-button editor-apply-button"
            data-state={applied ? "applied" : dirty ? "dirty" : "ready"}
            onClick={onApply}
            disabled={busy || applied}
            title={applied ? t("appliedToCodex") : applyLabel}
          >
            {applying ? (
              <LoaderCircle size={14} className="is-spinning" />
            ) : applied ? (
              <Check size={14} />
            ) : (
              <Play size={14} />
            )}
            {applyLabel}
          </button>
          <div className="editor-more-actions">
            <button
              className="icon-button"
              aria-label={t("moreActions")}
              aria-expanded={actionMenuOpen}
              onClick={() => setActionMenuOpen((open) => !open)}
            >
              <MoreHorizontal size={16} />
            </button>
            {actionMenuOpen && (
              <div className="editor-more-actions__menu" role="menu">
                <button
                  role="menuitem"
                  onClick={() => {
                    onExport();
                    setActionMenuOpen(false);
                  }}
                >
                  <Download size={14} /> {t("exportTheme")}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    onReset();
                    setActionMenuOpen(false);
                  }}
                >
                  <RotateCcw size={14} /> {t("revertToSaved")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {operationError && (
        <div className="editor-operation-feedback" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <div>
            <strong>{t("themeActionNeedsAttention")}</strong>
            <span>{operationError}</span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={onApply}
            disabled={busy}
          >
            {t("retryApply")}
          </button>
        </div>
      )}

      <div
        className={
          "editor-layout" +
          (inspectorOpen ? " editor-layout--inspector-open" : "")
        }
        style={
          {
            "--editor-layers-width": `${uiPreferences.themeEditorLayersWidth}px`,
            "--editor-inspector-width": `${uiPreferences.themeEditorInspectorWidth}px`,
          } as CSSProperties
        }
      >
        <aside className="layers-panel">
          <div className="panel-title">
            <span>{t("layers")}</span>
            <div className="layer-add">
              <button
                aria-label={t("addLayer")}
                data-theme-control="scene.add-layer"
                onClick={() => setAddMenuOpen((open) => !open)}
              >
                <Plus size={14} />
              </button>
              {addMenuOpen && (
                <div className="layer-add__menu" role="menu">
                  {(
                    [
                      ["image", t("imageLayer"), Image],
                      ["gradient", t("gradientLayer"), Sparkles],
                      ["vignette", t("vignetteLayer"), Layers3],
                    ] as const
                  ).map(([type, label, Icon]) => (
                    <button
                      key={type}
                      role="menuitem"
                      disabled={type === "image" && !visual.background.image}
                      onClick={() => {
                        onAddSceneLayer(type);
                        setAddMenuOpen(false);
                      }}
                    >
                      <Icon size={13} />
                      <span>{label}</span>
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
              onClick={() => selectActiveLayer("background")}
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
            {theme.scene.layers.length > 0 && (
              <div className="layer-stack__group-label">{t("sceneLayers")}</div>
            )}
            {theme.scene.layers.map((layer, index) => {
              const label = sceneLayerLabel(layer.type, index, t);
              return (
                <button
                  key={layer.id}
                  className={
                    "layer-item layer-item--scene" +
                    (activeLayer === `scene:${layer.id}`
                      ? " layer-item--active"
                      : "")
                  }
                  onClick={() => selectActiveLayer(`scene:${layer.id}`)}
                  aria-label={label}
                  title={`${label} · ${layer.id}`}
                >
                  <span className="layer-icon">
                    {layer.type === "image" ? (
                      <Image size={15} />
                    ) : layer.type === "gradient" ? (
                      <Sparkles size={15} />
                    ) : (
                      <Layers3 size={15} />
                    )}
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>
                      {Math.round(layer.opacity * 100)}% · {layer.blendMode}
                    </small>
                  </span>
                  <ChevronRight size={13} />
                </button>
              );
            })}
            <button
              className={
                "layer-item" +
                (activeLayer === "surfaces" ? " layer-item--active" : "")
              }
              onClick={() => selectActiveLayer("surfaces")}
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
              onClick={() => selectActiveLayer("motion")}
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
            <button
              className={
                "layer-item layer-item--pairing" +
                (activeLayer === "pairing" ? " layer-item--active" : "")
              }
              onClick={() => selectActiveLayer("pairing")}
              aria-label={t("recommendedPairing")}
            >
              <span className="layer-icon">
                <PawPrint size={15} />
              </span>
              <span>
                <strong>{t("recommendedPairing")}</strong>
                <small>
                  {recommendedCompanionId
                    ? (companions.find(
                        (item) => item.id === recommendedCompanionId,
                      )?.name ?? recommendedCompanionId)
                    : t("noRecommendation")}
                </small>
              </span>
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="layers-panel__note">
            <ShieldCheck size={14} />
            <p>{t("safePreview")}</p>
          </div>
        </aside>

        <div
          className="panel-resizer panel-resizer--layers"
          role="separator"
          aria-orientation="vertical"
          aria-label={t("layers")}
          aria-valuemin={184}
          aria-valuemax={320}
          aria-valuenow={uiPreferences.themeEditorLayersWidth}
          tabIndex={0}
          onMouseDown={(event) => beginPanelResize("layers", event)}
          onKeyDown={(event) => handlePanelResizeKey("layers", event)}
        />

        <section className="editor-canvas">
          <div className="canvas-toolbar">
            <span>
              <Monitor size={13} />
              {t("livePreview")}
              {previewVersion === "saved" && (
                <em className="canvas-preview-version">{t("viewingSaved")}</em>
              )}
            </span>
            <div className="canvas-toolbar__controls">
              <SelectField
                compact
                aria-label={t("previewScenario")}
                value={uiPreferences.themeEditorPreviewScenario}
                onChange={(event) =>
                  onUiPreferencesChange({
                    themeEditorPreviewScenario: event.target
                      .value as WorkspaceUiPreferences["themeEditorPreviewScenario"],
                  })
                }
              >
                <option value="home">{t("previewHome")}</option>
                <option value="task">{t("previewTask")}</option>
                <option value="settings">{t("previewSettings")}</option>
                <option value="dialog">{t("previewDialog")}</option>
                <option value="right-panel">{t("previewRightPanel")}</option>
              </SelectField>
              <div
                className="canvas-version-control"
                role="group"
                aria-label={t("previewVersion")}
              >
                <button
                  className={previewVersion === "current" ? "is-active" : ""}
                  aria-pressed={previewVersion === "current"}
                  onClick={() => setPreviewVersion("current")}
                >
                  {t("previewCurrent")}
                </button>
                <button
                  className={previewVersion === "saved" ? "is-active" : ""}
                  aria-pressed={previewVersion === "saved"}
                  disabled={!dirty}
                  title={!dirty ? t("noSavedDifference") : undefined}
                  onClick={() => setPreviewVersion("saved")}
                >
                  {t("previewSaved")}
                </button>
              </div>
              <div
                className="canvas-zoom-control"
                aria-label={t("livePreview")}
              >
                <button
                  className={previewZoom === "fit" ? "is-active" : ""}
                  onClick={() => setPreviewZoom("fit")}
                >
                  {t("fitPreview")}
                </button>
                <button
                  className={previewZoom === "actual" ? "is-active" : ""}
                  onClick={() => setPreviewZoom("actual")}
                >
                  {t("actualSize")}
                </button>
              </div>
            </div>
          </div>
          <div
            className="canvas-stage"
            data-preview-zoom={previewZoom}
            data-preview-version={previewVersion}
          >
            <PreviewWorkspace
              theme={previewTheme}
              variant={variant}
              locale={locale}
              reduceMotion={reduceMotion}
              resolveAsset={resolveAsset}
              scenario={uiPreferences.themeEditorPreviewScenario}
            />
          </div>
        </section>

        <div
          className="panel-resizer panel-resizer--inspector"
          role="separator"
          aria-orientation="vertical"
          aria-label={t("appearance")}
          aria-valuemin={264}
          aria-valuemax={400}
          aria-valuenow={uiPreferences.themeEditorInspectorWidth}
          tabIndex={0}
          onMouseDown={(event) => beginPanelResize("inspector", event)}
          onKeyDown={(event) => handlePanelResizeKey("inspector", event)}
        />

        <aside
          id="theme-editor-inspector"
          className={
            "inspector" +
            (inspectorOpen ? " inspector--open" : "") +
            (previewVersion === "saved" ? " inspector--preview-saved" : "")
          }
          aria-label={t("appearance")}
        >
          <div className="panel-title">
            <span>{t("appearance")}</span>
            <div className="inspector-heading-actions">
              <small>{variant.toUpperCase()}</small>
              <button
                className="inspector-close"
                onClick={closeInspector}
                aria-label={t("closeInspector")}
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {previewVersion === "saved" && (
            <div className="inspector-saved-notice" role="status">
              <span>
                <strong>{t("savedPreviewReadOnly")}</strong>
                <small>{t("savedPreviewReadOnlyDetail")}</small>
              </span>
              <button onClick={() => setPreviewVersion("current")}>
                {t("returnToCurrent")}
              </button>
            </div>
          )}
          <div
            className="inspector-content"
            inert={previewVersion === "saved" ? true : undefined}
          >
            <ThemeControlCoverage
              coverage={activeCoverage}
              locale={locale}
              t={t}
              currentScenario={uiPreferences.themeEditorPreviewScenario}
              onPreviewScenario={(scenario) =>
                onUiPreferencesChange({
                  themeEditorPreviewScenario: scenario,
                })
              }
            />
            {activeLayer === "background" && (
              <InspectorSection
                title={t("background")}
                icon={<Image size={14} />}
              >
                <button
                  className="adaptive-import-button"
                  onClick={onImportBackground}
                  disabled={busy}
                  data-theme-control="background.import-image"
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
                  <div
                    className="adaptive-schemes"
                    data-theme-control="background.adaptive-scheme"
                  >
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
                  controlId="background.overlay-color"
                  label={t("overlayColor")}
                  value={visual.background.overlay}
                  onChange={(value) =>
                    onUpdateVariant("background", "overlay", value)
                  }
                />
                <RangeControl
                  controlId="background.brightness"
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
                  controlId="background.blur"
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
                  controlId="background.overlay-opacity"
                  label={t("overlayStrength")}
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
            {selectedSceneLayer && (
              <InspectorSection
                title={sceneLayerLabel(
                  selectedSceneLayer.type,
                  selectedSceneLayerIndex,
                  t,
                )}
                icon={
                  selectedSceneLayer.type === "image" ? (
                    <Image size={14} />
                  ) : selectedSceneLayer.type === "gradient" ? (
                    <Sparkles size={14} />
                  ) : (
                    <Layers3 size={14} />
                  )
                }
              >
                <RangeControl
                  controlId="scene.opacity"
                  label={t("layerOpacity")}
                  value={selectedSceneLayer.opacity}
                  min={0}
                  max={1}
                  step={0.01}
                  display={`${Math.round(selectedSceneLayer.opacity * 100)}%`}
                  onChange={(opacity) =>
                    onUpdateSceneLayer(selectedSceneLayer.id, { opacity })
                  }
                />
                <SelectField
                  data-theme-control="scene.blend-mode"
                  label={t("blendMode")}
                  value={selectedSceneLayer.blendMode}
                  onChange={(event) =>
                    onUpdateSceneLayer(selectedSceneLayer.id, {
                      blendMode: event.target.value as SceneLayer["blendMode"],
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft light</option>
                </SelectField>
                <RangeControl
                  controlId="scene.parallax"
                  label={t("parallaxDepth")}
                  value={selectedSceneLayer.parallax}
                  min={-30}
                  max={30}
                  step={1}
                  display={`${selectedSceneLayer.parallax}px`}
                  onChange={(parallax) =>
                    onUpdateSceneLayer(selectedSceneLayer.id, { parallax })
                  }
                />
                <button
                  className="danger-text-button"
                  data-theme-control="scene.remove-layer"
                  onClick={() => {
                    onRemoveSceneLayer(selectedSceneLayer.id);
                    setActiveLayer("background");
                  }}
                >
                  <Trash2 size={13} />
                  {t("deleteLayer")}
                </button>
              </InspectorSection>
            )}
            {activeLayer === "surfaces" && (
              <InspectorSection
                title={t("surfaces")}
                icon={<Layers3 size={14} />}
              >
                <SelectField
                  compact
                  data-theme-control="surfaces.layout"
                  label={t("layoutTreatment")}
                  value={visual.appearance.layout ?? "native"}
                  onChange={(event) =>
                    onUpdateVariant("appearance", "layout", event.target.value)
                  }
                >
                  <option value="native">{t("layoutNative")}</option>
                  <option value="editorial">{t("layoutEditorial")}</option>
                  <option value="immersive">{t("layoutImmersive")}</option>
                </SelectField>
                <SelectField
                  compact
                  data-theme-control="surfaces.icon-style"
                  label={t("iconTreatment")}
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
                </SelectField>
                <SelectField
                  compact
                  data-theme-control="surfaces.decorations"
                  label={t("decorationTreatment")}
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
                </SelectField>
                <p className="inspector-mode-note">
                  {t("semanticControlsHint")}
                </p>
                <ColorControl
                  controlId="surfaces.accent"
                  label="Accent"
                  value={visual.appearance.accent}
                  onChange={(value) =>
                    onUpdateVariant("appearance", "accent", value)
                  }
                />
                <RangeControl
                  controlId="surfaces.opacity"
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
                  controlId="surfaces.radius"
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
              <InspectorSection
                title={t("motion")}
                icon={<Sparkles size={14} />}
              >
                <div
                  className="motion-recipes"
                  aria-label={t("motionStyle")}
                  data-theme-control="motion.recipe"
                >
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
                            "motion.recipe",
                          );
                          onUpdateVariant(
                            "motion",
                            "parallax",
                            recipe.parallax,
                            "motion.recipe",
                          );
                          onUpdateVariant(
                            "motion",
                            "targetFps",
                            recipe.fps,
                            "motion.recipe",
                          );
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
                  controlId="motion.intensity"
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
                  controlId="motion.parallax"
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
            {activeLayer === "pairing" && (
              <InspectorSection
                title={t("recommendedPairing")}
                icon={<PawPrint size={14} />}
              >
                <p className="inspector-mode-note">
                  {t("recommendedPairingDetail")}
                </p>
                <SelectField
                  data-theme-control="pairing.recommended-companion"
                  label={t("recommendedPairing")}
                  value={recommendedCompanionId ?? ""}
                  onChange={(event) =>
                    onSetRecommendedCompanion(event.target.value || null)
                  }
                >
                  <option value="">{t("noRecommendation")}</option>
                  {companions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.locales[locale]?.name ?? item.name}
                    </option>
                  ))}
                </SelectField>
              </InspectorSection>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ThemeControlCoverage({
  coverage,
  locale,
  t,
  currentScenario,
  onPreviewScenario,
}: {
  coverage: ThemeEditorSectionCoverage;
  locale: Locale;
  t: (key: MessageKey) => string;
  currentScenario: WorkspaceUiPreferences["themeEditorPreviewScenario"];
  onPreviewScenario: (
    scenario: WorkspaceUiPreferences["themeEditorPreviewScenario"],
  ) => void;
}) {
  const detailKey: MessageKey =
    coverage.section === "background"
      ? "backgroundEffectDetail"
      : coverage.section === "scene"
        ? "sceneEffectDetail"
        : coverage.section === "surfaces"
          ? "surfaceEffectDetail"
          : coverage.section === "motion"
            ? "motionEffectDetail"
            : "pairingEffectDetail";
  const titleKey: MessageKey =
    coverage.mode === "semantic"
      ? "enhancedModeEffect"
      : coverage.mode === "metadata"
        ? "recommendationOnly"
        : "liveEffectMapped";
  const recommendedScenario = coverage.recommendedScenario;
  const recommendedLabel = recommendedScenario
    ? previewScenarioLabel(recommendedScenario, t)
    : null;
  return (
    <section
      className="theme-control-coverage"
      data-mode={coverage.mode}
      aria-label={t(titleKey)}
    >
      <div className="theme-control-coverage__summary">
        <span className="theme-control-coverage__icon">
          <ShieldCheck size={14} />
        </span>
        <span>
          <strong>{t(titleKey)}</strong>
          <small>{t(detailKey)}</small>
        </span>
      </div>
      <div className="theme-control-coverage__meta">
        {coverage.scenarios.length > 0 && (
          <span>
            {coverage.scenarios.length} {t("previewViews")}
          </span>
        )}
        {recommendedScenario && recommendedLabel && (
          <button
            className={
              currentScenario === recommendedScenario ? "is-current" : ""
            }
            onClick={() => onPreviewScenario(recommendedScenario)}
            aria-pressed={currentScenario === recommendedScenario}
            aria-label={`${t("previewThisEffect")} ${recommendedLabel}`}
          >
            <Monitor size={12} />
            {currentScenario === recommendedScenario
              ? locale === "zh-CN"
                ? `正在预览${recommendedLabel}`
                : `Viewing ${recommendedLabel}`
              : `${t("previewThisEffect")} ${recommendedLabel}`}
          </button>
        )}
      </div>
    </section>
  );
}

function previewScenarioLabel(
  scenario: WorkspaceUiPreferences["themeEditorPreviewScenario"],
  t: (key: MessageKey) => string,
) {
  return t(
    scenario === "home"
      ? "previewHome"
      : scenario === "task"
        ? "previewTask"
        : scenario === "settings"
          ? "previewSettings"
          : scenario === "dialog"
            ? "previewDialog"
            : "previewRightPanel",
  );
}

function sceneLayerLabel(
  type: SceneLayer["type"],
  index: number,
  t: (key: MessageKey) => string,
) {
  const label =
    type === "image"
      ? t("imageLayer")
      : type === "gradient"
        ? t("gradientLayer")
        : t("vignetteLayer");
  return `${label} ${Math.max(0, index) + 1}`;
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
  controlId,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  controlId: ThemeEditorControlId;
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
        data-theme-control={controlId}
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
  controlId,
  label,
  value,
  onChange,
}: {
  controlId: ThemeEditorControlId;
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
          data-theme-control={controlId}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}
