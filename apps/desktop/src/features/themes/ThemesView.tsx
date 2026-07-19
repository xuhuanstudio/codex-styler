import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type { ThemeVariantName } from "../../lib/app-session";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { PreviewScenario } from "../../lib/storage";
import { useGuidedMotionPreview } from "../../lib/use-guided-motion-preview";
import {
  resolveThemeEffectCoverage,
  resolveThemeVisualPersonality,
  type ThemeEffectId,
} from "../../lib/theme-effects";
import { ThemeRow } from "./ThemeRow";
import { ThemePreviewControls } from "./ThemePreviewControls";

export type ThemeCollection = "builtIn" | "mine";

export interface ThemesViewProps {
  locale: Locale;
  selectedTheme: ThemeDefinition;
  previewThemeFor: (theme: ThemeDefinition) => ThemeDefinition;
  localThemes: ThemeDefinition[];
  collection: ThemeCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  t: (key: MessageKey) => string;
  onSelect: (theme: ThemeDefinition) => void;
  onEdit: (theme: ThemeDefinition) => void;
  onDelete: (theme: ThemeDefinition) => void;
  onCollectionChange: (collection: ThemeCollection) => void;
  onNew: () => void;
  onImport: () => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  liveThemeId: string | null;
  busy: boolean;
}

export function ThemesView({
  locale,
  selectedTheme,
  previewThemeFor,
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
}: ThemesViewProps) {
  const [compactDetailOpen, setCompactDetailOpen] = useState(false);
  const [browsedThemeId, setBrowsedThemeId] = useState(selectedTheme.id);
  const [previewPresentation, setPreviewPresentation] = useState<
    "styled" | "official"
  >("styled");
  const [previewScenario, setPreviewScenario] =
    useState<PreviewScenario>("task");
  const [inspectedEffect, setInspectedEffect] = useState<ThemeEffectId | null>(
    null,
  );
  const {
    revision: motionPreviewRevision,
    playing: motionPreviewing,
    play: playMotionPreview,
    stop: stopMotionPreview,
  } = useGuidedMotionPreview();
  const workspaceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!compactDetailOpen) return;
    const element = workspaceRef.current?.closest<HTMLElement>(
      ".app-main__viewport",
    );
    if (!element) return;
    if (typeof element.scrollTo === "function") {
      element.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      element.scrollTop = 0;
    }
  }, [compactDetailOpen, reduceMotion]);
  const themes = collection === "builtIn" ? builtinThemes : localThemes;
  const selectedThemeInCollection = themes.find(
    (theme) => theme.id === selectedTheme.id,
  );
  const browsedTheme =
    themes.find((theme) => theme.id === browsedThemeId) ??
    selectedThemeInCollection ??
    themes[0] ??
    selectedTheme;
  useEffect(() => {
    setBrowsedThemeId((current) => {
      if (themes.some((theme) => theme.id === current)) return current;
      return selectedThemeInCollection?.id ?? themes[0]?.id ?? selectedTheme.id;
    });
  }, [selectedTheme.id, selectedThemeInCollection?.id, themes]);
  const localized = browsedTheme.locales[locale] ?? browsedTheme.locales.en;
  const selectedIndex =
    themes.findIndex((theme) => theme.id === browsedTheme.id) + 1;
  const effectLabels: Record<ThemeEffectId, MessageKey> = {
    background: "effectBackground",
    surfaces: "effectSurfaces",
    controls: "effectControls",
    icons: "effectIcons",
    motion: "effectMotion",
    readability: "effectReadability",
  };
  const effectCoverage = resolveThemeEffectCoverage(browsedTheme, variant);
  const motionEffectActive =
    effectCoverage.find((effect) => effect.id === "motion")?.active ?? false;
  const effectPreviewScenarios = {
    background: "task",
    surfaces: "dialog",
    controls: "components",
    icons: "right-panel",
    motion: "task",
    readability: "settings",
  } satisfies Record<ThemeEffectId, PreviewScenario>;
  const personality = resolveThemeVisualPersonality(browsedTheme, variant);
  const layoutLabels = {
    native: "layoutNative",
    editorial: "layoutEditorial",
    immersive: "layoutImmersive",
  } satisfies Record<typeof personality.layout, MessageKey>;
  const geometryLabels = {
    precise: "geometryPrecise",
    balanced: "geometryBalanced",
    soft: "geometrySoft",
  } satisfies Record<typeof personality.geometry, MessageKey>;
  const iconLabels = {
    native: "iconNative",
    contained: "iconContained",
    themed: "iconThemed",
  } satisfies Record<typeof personality.iconStyle, MessageKey>;
  const decorationLabels = {
    none: "decorationNone",
    subtle: "decorationSubtle",
    expressive: "decorationExpressive",
  } satisfies Record<typeof personality.decorations, MessageKey>;
  const motionLabels = {
    still: "motionNone",
    calm: "motionCalm",
    fluid: "motionFluid",
    expressive: "motionExpressive",
  } satisfies Record<typeof personality.motion, MessageKey>;
  const isSemanticTheme = browsedTheme.compatibility.codex.mode === "semantic";
  const motionPreviewDisabled =
    reduceMotion || previewPresentation === "official" || !motionEffectActive;
  const motionPreviewHelp = reduceMotion
    ? t("motionPreviewReduced")
    : previewPresentation === "official"
      ? t("motionPreviewOfficialLibrary")
      : !motionEffectActive
        ? t("motionPreviewDisabled")
        : t("motionPreviewDescription");
  useEffect(() => stopMotionPreview, [browsedTheme.id, stopMotionPreview]);

  function previewMotion() {
    if (motionPreviewDisabled) return;
    setPreviewScenario("task");
    setInspectedEffect("motion");
    playMotionPreview();
  }
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
          onClick={() => {
            setCompactDetailOpen(false);
            onCollectionChange("builtIn");
          }}
        >
          {t("builtInThemes")}
          <small>{builtinThemes.length}</small>
        </button>
        <button
          role="tab"
          aria-selected={collection === "mine"}
          className={collection === "mine" ? "is-active" : ""}
          onClick={() => {
            setCompactDetailOpen(false);
            onCollectionChange("mine");
          }}
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
        <section
          ref={workspaceRef}
          className={
            "theme-library-workspace" +
            (compactDetailOpen ? " theme-library-workspace--detail" : "")
          }
        >
          <div className="theme-library-master">
            <div className="section-heading section-heading--compact">
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
            <div
              className="theme-list"
              aria-label={t("allThemes")}
              data-scroll-surface="panel"
            >
              {themes.map((theme, index) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  index={index + 1}
                  locale={locale}
                  active={selectedTheme.id === theme.id}
                  live={liveThemeId === theme.id}
                  resolveAsset={resolveAsset}
                  onSelect={() => {
                    setBrowsedThemeId(theme.id);
                    onSelect(theme);
                    setCompactDetailOpen(true);
                  }}
                  local={collection === "mine"}
                  onEdit={() => onEdit(theme)}
                  onDelete={() => onDelete(theme)}
                  t={t}
                />
              ))}
            </div>
          </div>
          <section className="featured-theme theme-detail-card">
            <button
              className="compact-detail-back"
              onClick={() => setCompactDetailOpen(false)}
            >
              <ArrowLeft size={14} />
              {t("backToThemes")}
            </button>
            <div className="featured-theme__preview">
              <ThemePreviewControls
                scenario={previewScenario}
                presentation={previewPresentation}
                t={t}
                motionPreviewing={motionPreviewing}
                motionPreviewDisabled={motionPreviewDisabled}
                motionPreviewHelp={motionPreviewHelp}
                onScenarioChange={(nextScenario) => {
                  setInspectedEffect(null);
                  setPreviewScenario(nextScenario);
                }}
                onPresentationChange={(presentation) => {
                  stopMotionPreview();
                  setPreviewPresentation(presentation);
                }}
                onPreviewMotion={previewMotion}
              />
              <PreviewWorkspace
                theme={previewThemeFor(browsedTheme)}
                variant={variant}
                locale={locale}
                reduceMotion={reduceMotion}
                resolveAsset={resolveAsset}
                presentation={previewPresentation}
                scenario={previewScenario}
                motionPreviewRevision={motionPreviewRevision}
              />
            </div>
            <div className="featured-theme__copy">
              <span>
                THEME {String(Math.max(1, selectedIndex)).padStart(2, "0")} /{" "}
                {localized.name.toUpperCase()}
              </span>
              <h2>{localized.name}</h2>
              <p>{localized.description}</p>
              <div className="theme-facts theme-personality">
                <div>
                  <small>{t("visualComposition")}</small>
                  <strong>
                    {t(layoutLabels[personality.layout])} ·{" "}
                    {t(geometryLabels[personality.geometry])}
                  </strong>
                </div>
                <div>
                  <small>{t("iconTreatment")}</small>
                  <strong>{t(iconLabels[personality.iconStyle])}</strong>
                </div>
                <div>
                  <small>{t("decorationTreatment")}</small>
                  <strong>
                    {t(decorationLabels[personality.decorations])}
                  </strong>
                </div>
                <div>
                  <small>{t("motionStyle")}</small>
                  <strong>{t(motionLabels[personality.motion])}</strong>
                </div>
              </div>
              <div className="theme-effect-summary">
                <div className="theme-effect-summary__copy">
                  <Sparkles size={14} />
                  <span>
                    <strong>{t("visualCoverage")}</strong>
                    <small>
                      {t(
                        isSemanticTheme
                          ? "visualCoverageSemanticDetail"
                          : "visualCoverageSafeDetail",
                      )}
                    </small>
                  </span>
                </div>
                <div
                  className="theme-effect-summary__list"
                  aria-label={t("visualCoverage")}
                >
                  {effectCoverage.map((effect) => (
                    <button
                      type="button"
                      key={effect.id}
                      data-active={effect.active || undefined}
                      data-current={
                        effect.active && inspectedEffect === effect.id
                          ? "true"
                          : undefined
                      }
                      disabled={!effect.active}
                      aria-pressed={
                        effect.active && inspectedEffect === effect.id
                      }
                      aria-label={`${t("inspectEffect")}: ${t(
                        effectLabels[effect.id],
                      )}`}
                      title={
                        effect.active
                          ? t("inspectEffect")
                          : t("effectUnavailable")
                      }
                      onClick={() => {
                        setInspectedEffect(effect.id);
                        setPreviewScenario(effectPreviewScenarios[effect.id]);
                        if (effect.id === "motion") {
                          setPreviewPresentation("styled");
                          if (!reduceMotion) playMotionPreview();
                        } else {
                          stopMotionPreview();
                        }
                      }}
                    >
                      <i aria-hidden="true" />
                      {t(effectLabels[effect.id])}
                    </button>
                  ))}
                </div>
              </div>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => onEdit(browsedTheme)}
                >
                  {collection === "builtIn"
                    ? t("customizeCopy")
                    : t("editTheme")}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
