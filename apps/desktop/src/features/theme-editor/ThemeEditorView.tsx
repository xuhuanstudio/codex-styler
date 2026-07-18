import {
  Check,
  ChevronRight,
  Download,
  Image,
  Layers3,
  Monitor,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  PawPrint,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type CompanionDefinition,
  type SceneLayer,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import {
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import { SelectField } from "../../components/ui/SelectField";
import type { ThemeVariantName } from "../../lib/app-session";
import type {
  AdaptiveScheme,
  AdaptiveSchemeId,
} from "../../lib/adaptive-theme";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { WorkspaceUiPreferences } from "../../lib/storage";

interface SharedViewProps {
  locale: Locale;
  t: (key: MessageKey) => string;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}

export function ThemeEditorView({
  theme,
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
  uiPreferences,
  onUiPreferencesChange,
}: SharedViewProps & {
  theme: ThemeDefinition;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  onUpdateVariant: (
    section: "background" | "appearance" | "motion",
    key: string,
    value: number | string,
  ) => void;
  onAddSceneLayer: (type: SceneLayer["type"]) => void;
  onUpdateSceneLayer: (layerId: string, patch: Partial<SceneLayer>) => void;
  onRemoveSceneLayer: (layerId: string) => void;
  companions: CompanionDefinition[];
  recommendedCompanionId: string | null;
  onSetRecommendedCompanion: (companionId: string | null) => void;
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
  dirty: boolean;
  uiPreferences: WorkspaceUiPreferences;
  onUiPreferencesChange: (patch: Partial<WorkspaceUiPreferences>) => void;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<string>("background");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<"fit" | "actual">("fit");
  const visual = theme.variants[variant];
  const selectedSceneLayer = theme.scene.layers.find(
    (layer) => activeLayer === `scene:${layer.id}`,
  );
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
          <button
            className="secondary-button editor-focus-toggle"
            onClick={() =>
              onUiPreferencesChange({ focusMode: !uiPreferences.focusMode })
            }
            aria-pressed={uiPreferences.focusMode}
          >
            {uiPreferences.focusMode ? (
              <PanelLeftOpen size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
            {uiPreferences.focusMode ? t("exitFocusMode") : t("focusMode")}
          </button>
          <button
            className="secondary-button inspector-toggle"
            onClick={() => setInspectorOpen(true)}
          >
            <PanelRightOpen size={14} />
            {t("appearance")}
          </button>
          <button className="secondary-button" onClick={onSave} disabled={busy}>
            <Check size={14} />
            {busy ? t("saving") : t("saveDraft")}
          </button>
          <button className="primary-button" onClick={onApply} disabled={busy}>
            <Play size={14} />
            {busy ? t("applying") : t("applyDraft")}
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
                  <RotateCcw size={14} /> {t("reset")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className="editor-layout"
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
            {theme.scene.layers.length > 0 && (
              <div className="layer-stack__group-label">{t("sceneLayers")}</div>
            )}
            {theme.scene.layers.map((layer) => (
              <button
                key={layer.id}
                className={
                  "layer-item layer-item--scene" +
                  (activeLayer === `scene:${layer.id}`
                    ? " layer-item--active"
                    : "")
                }
                onClick={() => setActiveLayer(`scene:${layer.id}`)}
                aria-label={layer.id}
                title={layer.id}
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
                  <strong>{layer.id}</strong>
                  <small>
                    {layer.type} · {Math.round(layer.opacity * 100)}%
                  </small>
                </span>
                <ChevronRight size={13} />
              </button>
            ))}
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
            <button
              className={
                "layer-item layer-item--pairing" +
                (activeLayer === "pairing" ? " layer-item--active" : "")
              }
              onClick={() => setActiveLayer("pairing")}
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
          <div className="canvas-stage" data-preview-zoom={previewZoom}>
            <PreviewWorkspace
              theme={theme}
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
                aria-label={t("closeInspector")}
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
          {selectedSceneLayer && (
            <InspectorSection
              title={selectedSceneLayer.id}
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
                label={t("iconTreatment")}
                value={visual.appearance.iconStyle ?? "native"}
                onChange={(event) =>
                  onUpdateVariant("appearance", "iconStyle", event.target.value)
                }
              >
                <option value="native">{t("iconNative")}</option>
                <option value="contained">{t("iconContained")}</option>
                <option value="themed">{t("iconThemed")}</option>
              </SelectField>
              <SelectField
                compact
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
                <option value="expressive">{t("decorationExpressive")}</option>
              </SelectField>
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
          {activeLayer === "pairing" && (
            <InspectorSection
              title={t("recommendedPairing")}
              icon={<PawPrint size={14} />}
            >
              <p className="inspector-mode-note">
                {t("recommendedPairingDetail")}
              </p>
              <SelectField
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
