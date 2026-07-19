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

const surfaceTreatments = [
  {
    id: "refined",
    label: "treatmentRefined",
    detail: "treatmentRefinedDescription",
    layout: "native",
    iconStyle: "contained",
    decorations: "subtle",
  },
  {
    id: "editorial",
    label: "treatmentEditorial",
    detail: "treatmentEditorialDescription",
    layout: "editorial",
    iconStyle: "themed",
    decorations: "subtle",
  },
  {
    id: "immersive",
    label: "treatmentImmersive",
    detail: "treatmentImmersiveDescription",
    layout: "immersive",
    iconStyle: "themed",
    decorations: "expressive",
  },
] as const satisfies readonly {
  id: string;
  label: MessageKey;
  detail: MessageKey;
  layout: NonNullable<
    ThemeDefinition["variants"]["light"]["appearance"]["layout"]
  >;
  iconStyle: NonNullable<
    ThemeDefinition["variants"]["light"]["appearance"]["iconStyle"]
  >;
  decorations: NonNullable<
    ThemeDefinition["variants"]["light"]["appearance"]["decorations"]
  >;
}[];

const surfaceMaterials = [
  {
    id: "solid",
    label: "materialSolid",
    detail: "materialSolidDescription",
    surfaceOpacity: 0.96,
    focusOpacity: 0.98,
    focusBlur: 0,
  },
  {
    id: "layered",
    label: "materialLayered",
    detail: "materialLayeredDescription",
    surfaceOpacity: 0.88,
    focusOpacity: 0.95,
    focusBlur: 10,
  },
  {
    id: "frosted",
    label: "materialFrosted",
    detail: "materialFrostedDescription",
    surfaceOpacity: 0.78,
    focusOpacity: 0.92,
    focusBlur: 20,
  },
] as const satisfies readonly {
  id: string;
  label: MessageKey;
  detail: MessageKey;
  surfaceOpacity: number;
  focusOpacity: number;
  focusBlur: number;
}[];

type PreviewVersion = "current" | "saved" | "official";

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
  const recipeHistoryRevision = useRef(0);
  const motionPreviewTimerRef = useRef<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>("background");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<"fit" | "actual">("fit");
  const [previewVersion, setPreviewVersion] =
    useState<PreviewVersion>("current");
  const [motionPreviewRevision, setMotionPreviewRevision] = useState(0);
  const [motionPreviewing, setMotionPreviewing] = useState(false);
  const visual = theme.variants[variant];
  const previewTheme = previewVersion === "saved" ? savedTheme : theme;
  const previewReadOnly = previewVersion !== "current";
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
    if (!dirty) setPreviewVersion("current");
  }, [dirty]);
  useEffect(
    () => () => {
      if (motionPreviewTimerRef.current !== null) {
        window.clearTimeout(motionPreviewTimerRef.current);
      }
    },
    [],
  );
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
  function previewMotion() {
    if (
      reduceMotion ||
      previewVersion === "official" ||
      visual.motion.intensity <= 0 ||
      (visual.motion.parallax ?? 0) <= 0
    ) {
      return;
    }
    setPreviewVersion("current");
    onUiPreferencesChange({ themeEditorPreviewScenario: "task" });
    setMotionPreviewing(true);
    setMotionPreviewRevision((revision) => revision + 1);
    if (motionPreviewTimerRef.current !== null) {
      window.clearTimeout(motionPreviewTimerRef.current);
    }
    motionPreviewTimerRef.current = window.setTimeout(() => {
      setMotionPreviewing(false);
      motionPreviewTimerRef.current = null;
    }, 1_500);
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
          <div className="layer-stack" data-scroll-surface="panel">
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
              {previewVersion === "official" && (
                <em className="canvas-preview-version">
                  {t("viewingOfficial")}
                </em>
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
                <option value="changes">{t("previewChanges")}</option>
                <option value="terminal">{t("previewTerminal")}</option>
                <option value="settings">{t("previewSettings")}</option>
                <option value="components">{t("previewComponents")}</option>
                <option value="dialog">{t("previewDialog")}</option>
                <option value="right-panel">{t("previewRightPanel")}</option>
              </SelectField>
              <div
                className="canvas-version-control"
                role="group"
                aria-label={t("previewVersion")}
              >
                <button
                  type="button"
                  className={previewVersion === "current" ? "is-active" : ""}
                  aria-pressed={previewVersion === "current"}
                  onClick={() => setPreviewVersion("current")}
                >
                  {t("previewCurrent")}
                </button>
                <button
                  type="button"
                  className={previewVersion === "saved" ? "is-active" : ""}
                  aria-pressed={previewVersion === "saved"}
                  disabled={!dirty}
                  title={!dirty ? t("noSavedDifference") : undefined}
                  onClick={() => setPreviewVersion("saved")}
                >
                  {t("previewSaved")}
                </button>
                <button
                  type="button"
                  className={previewVersion === "official" ? "is-active" : ""}
                  aria-pressed={previewVersion === "official"}
                  onClick={() => setPreviewVersion("official")}
                >
                  {t("previewOfficial")}
                </button>
              </div>
              <div
                className="canvas-zoom-control"
                aria-label={t("livePreview")}
              >
                <button
                  type="button"
                  className={previewZoom === "fit" ? "is-active" : ""}
                  onClick={() => setPreviewZoom("fit")}
                >
                  {t("fitPreview")}
                </button>
                <button
                  type="button"
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
            data-scroll-surface={
              previewZoom === "actual" ? "canvas" : undefined
            }
          >
            <PreviewWorkspace
              theme={previewTheme}
              variant={variant}
              locale={locale}
              reduceMotion={reduceMotion}
              resolveAsset={resolveAsset}
              scenario={uiPreferences.themeEditorPreviewScenario}
              onScenarioChange={(scenario) =>
                onUiPreferencesChange({
                  themeEditorPreviewScenario: scenario,
                })
              }
              presentation={
                previewVersion === "official" ? "official" : "styled"
              }
              motionPreviewRevision={motionPreviewRevision}
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
            (previewReadOnly ? " inspector--preview-saved" : "")
          }
          aria-label={t("appearance")}
          data-scroll-surface="panel"
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
          {previewReadOnly && (
            <div className="inspector-saved-notice" role="status">
              <span>
                <strong>
                  {t(
                    previewVersion === "official"
                      ? "officialPreviewReadOnly"
                      : "savedPreviewReadOnly",
                  )}
                </strong>
                <small>
                  {t(
                    previewVersion === "official"
                      ? "officialPreviewReadOnlyDetail"
                      : "savedPreviewReadOnlyDetail",
                  )}
                </small>
              </span>
              <button onClick={() => setPreviewVersion("current")}>
                {t("returnToCurrent")}
              </button>
            </div>
          )}
          <div
            className="inspector-content"
            inert={previewReadOnly ? true : undefined}
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
                <div className="inspector-subsection-heading">
                  <strong>{t("surfaceTreatment")}</strong>
                  <span>{t("surfaceTreatmentDescription")}</span>
                </div>
                <div
                  className="surface-treatments"
                  data-theme-control="surfaces.treatment"
                >
                  {surfaceTreatments.map((treatment) => {
                    const active =
                      (visual.appearance.layout ?? "native") ===
                        treatment.layout &&
                      (visual.appearance.iconStyle ?? "native") ===
                        treatment.iconStyle &&
                      (visual.appearance.decorations ?? "none") ===
                        treatment.decorations;
                    return (
                      <button
                        key={treatment.id}
                        type="button"
                        className={active ? "is-active" : ""}
                        aria-pressed={active}
                        aria-label={t(treatment.label)}
                        onClick={() => {
                          const historyGroup = `surfaces.treatment.${++recipeHistoryRevision.current}`;
                          onUpdateVariant(
                            "appearance",
                            "layout",
                            treatment.layout,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "appearance",
                            "iconStyle",
                            treatment.iconStyle,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "appearance",
                            "decorations",
                            treatment.decorations,
                            historyGroup,
                          );
                        }}
                      >
                        <span>
                          <strong>{t(treatment.label)}</strong>
                          <small>{t(treatment.detail)}</small>
                        </span>
                        {active && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
                <div className="inspector-subsection-heading">
                  <strong>{t("surfaceMaterial")}</strong>
                  <span>{t("surfaceMaterialDescription")}</span>
                </div>
                <div
                  className="surface-materials"
                  data-theme-control="surfaces.material"
                >
                  {surfaceMaterials.map((material) => {
                    const active =
                      Math.abs(
                        visual.appearance.surfaceOpacity -
                          material.surfaceOpacity,
                      ) < 0.01 &&
                      Math.abs(
                        visual.appearance.focusOpacity - material.focusOpacity,
                      ) < 0.01 &&
                      visual.appearance.focusBlur === material.focusBlur;
                    return (
                      <button
                        key={material.id}
                        type="button"
                        className={active ? "is-active" : ""}
                        aria-pressed={active}
                        aria-label={t(material.label)}
                        onClick={() => {
                          const historyGroup = `surfaces.material.${++recipeHistoryRevision.current}`;
                          onUpdateVariant(
                            "appearance",
                            "surfaceOpacity",
                            material.surfaceOpacity,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "appearance",
                            "focusOpacity",
                            material.focusOpacity,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "appearance",
                            "focusBlur",
                            material.focusBlur,
                            historyGroup,
                          );
                        }}
                      >
                        <span>
                          <strong>{t(material.label)}</strong>
                          <small>{t(material.detail)}</small>
                        </span>
                        {active && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
                <p className="inspector-mode-note">
                  {t("semanticControlsHint")}
                </p>
                <div className="interface-system-status">
                  <Sparkles size={14} />
                  <span>
                    <strong>{t("adaptiveInteractionChrome")}</strong>
                    <small>{t("adaptiveInteractionChromeDetail")}</small>
                  </span>
                </div>
                <details className="inspector-disclosure">
                  <summary>
                    <span>
                      <strong>{t("fineTune")}</strong>
                      <small>{t("fineTuneDescription")}</small>
                    </span>
                    <ChevronRight size={14} />
                  </summary>
                  <div className="inspector-disclosure__content">
                    <SelectField
                      compact
                      data-theme-control="surfaces.layout"
                      label={t("layoutTreatment")}
                      value={visual.appearance.layout ?? "native"}
                      onChange={(event) =>
                        onUpdateVariant(
                          "appearance",
                          "layout",
                          event.target.value,
                        )
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
                    <ColorControl
                      controlId="surfaces.accent"
                      label="Accent"
                      value={visual.appearance.accent}
                      onChange={(value) =>
                        onUpdateVariant("appearance", "accent", value)
                      }
                    />
                    <ColorControl
                      controlId="surfaces.surface-color"
                      label={t("surfaceColor")}
                      value={visual.appearance.surface}
                      onChange={(value) =>
                        onUpdateVariant("appearance", "surface", value)
                      }
                    />
                    <ColorControl
                      controlId="surfaces.border-color"
                      label={t("borderColor")}
                      value={visual.appearance.border}
                      onChange={(value) =>
                        onUpdateVariant("appearance", "border", value)
                      }
                    />
                    <div
                      className="semantic-harmony-status"
                      data-theme-control="surfaces.color-harmony"
                      data-authored={
                        visual.appearance.palette ? "true" : "false"
                      }
                    >
                      <Sparkles size={14} />
                      <span>
                        <strong>
                          {t(
                            visual.appearance.palette
                              ? "authoredColorHarmony"
                              : "automaticColorHarmony",
                          )}
                        </strong>
                        <small>
                          {t(
                            visual.appearance.palette
                              ? "authoredColorHarmonyDetail"
                              : "automaticColorHarmonyDetail",
                          )}
                        </small>
                      </span>
                      {visual.appearance.palette && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateVariant(
                              "appearance",
                              "accent",
                              visual.appearance.accent,
                            )
                          }
                        >
                          {t("matchBaseColors")}
                        </button>
                      )}
                    </div>
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
                      controlId="surfaces.focus-opacity"
                      label={t("focusSurfaceOpacity")}
                      value={visual.appearance.focusOpacity}
                      min={0}
                      max={1}
                      step={0.01}
                      display={
                        Math.round(visual.appearance.focusOpacity * 100) + "%"
                      }
                      onChange={(value) =>
                        onUpdateVariant("appearance", "focusOpacity", value)
                      }
                    />
                    <RangeControl
                      controlId="surfaces.focus-blur"
                      label={t("surfaceBlur")}
                      value={visual.appearance.focusBlur}
                      min={0}
                      max={32}
                      step={1}
                      display={visual.appearance.focusBlur + "px"}
                      onChange={(value) =>
                        onUpdateVariant("appearance", "focusBlur", value)
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
                  </div>
                </details>
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
                          const historyGroup = `motion.recipe.${++recipeHistoryRevision.current}`;
                          onUpdateVariant(
                            "motion",
                            "intensity",
                            recipe.intensity,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "motion",
                            "parallax",
                            recipe.parallax,
                            historyGroup,
                          );
                          onUpdateVariant(
                            "motion",
                            "targetFps",
                            recipe.fps,
                            historyGroup,
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
                <div className="motion-preview-action">
                  <button
                    type="button"
                    onClick={previewMotion}
                    disabled={
                      motionPreviewing ||
                      reduceMotion ||
                      previewVersion === "official" ||
                      visual.motion.intensity <= 0 ||
                      (visual.motion.parallax ?? 0) <= 0
                    }
                    aria-describedby="motion-preview-help"
                  >
                    <Play size={13} />
                    {motionPreviewing
                      ? t("previewMotionPlaying")
                      : t("previewMotion")}
                  </button>
                  <small id="motion-preview-help" aria-live="polite">
                    {reduceMotion
                      ? t("motionPreviewReduced")
                      : previewVersion === "official"
                        ? t("motionPreviewOfficial")
                        : visual.motion.intensity <= 0 ||
                            (visual.motion.parallax ?? 0) <= 0
                          ? t("motionPreviewDisabled")
                          : t("motionPreviewDescription")}
                  </small>
                </div>
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
        : scenario === "changes"
          ? "previewChanges"
          : scenario === "terminal"
            ? "previewTerminal"
            : scenario === "settings"
              ? "previewSettings"
              : scenario === "components"
                ? "previewComponents"
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
