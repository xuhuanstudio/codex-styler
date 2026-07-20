import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import type { ThemeDefinition } from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type { ThemeVariantName } from "../../lib/app-session";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { PreviewScenario } from "../../lib/storage";
import {
  resolveThemeEffectCoverage,
  resolveThemeVisualPersonality,
  type ThemeEffectId,
} from "../../lib/theme-effects";
import { useGuidedMotionPreview } from "../../lib/use-guided-motion-preview";
import { ThemePreviewControls } from "./ThemePreviewControls";

const effectLabels: Record<ThemeEffectId, MessageKey> = {
  background: "effectBackground",
  surfaces: "effectSurfaces",
  controls: "effectControls",
  icons: "effectIcons",
  typography: "effectTypography",
  motion: "effectMotion",
  readability: "effectReadability",
};

const effectPreviewScenarios = {
  background: "task",
  surfaces: "dialog",
  controls: "components",
  icons: "right-panel",
  typography: "task",
  motion: "task",
  readability: "settings",
} satisfies Record<ThemeEffectId, PreviewScenario>;

const layoutLabels = {
  native: "layoutNative",
  editorial: "layoutEditorial",
  immersive: "layoutImmersive",
} as const;

const geometryLabels = {
  precise: "geometryPrecise",
  balanced: "geometryBalanced",
  soft: "geometrySoft",
} as const;

const iconLabels = {
  native: "iconNative",
  contained: "iconContained",
  themed: "iconThemed",
} as const;

const decorationLabels = {
  none: "decorationNone",
  subtle: "decorationSubtle",
  expressive: "decorationExpressive",
} as const;

const materialLabels = {
  solid: "materialSolid",
  layered: "materialLayered",
  frosted: "materialFrosted",
} as const;

const motionLabels = {
  still: "motionNone",
  calm: "motionCalm",
  fluid: "motionFluid",
  expressive: "motionExpressive",
} as const;

interface ThemeDetailCardProps {
  theme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  themeIndex: number;
  collectionLabel: string;
  editLabel: string;
  locale: Locale;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  t: (key: MessageKey) => string;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onBack: () => void;
  onEdit: () => void;
}

export function ThemeDetailCard({
  theme,
  previewTheme,
  themeIndex,
  collectionLabel,
  editLabel,
  locale,
  variant,
  reduceMotion,
  t,
  resolveAsset,
  onBack,
  onEdit,
}: ThemeDetailCardProps) {
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

  const localized = theme.locales[locale] ?? theme.locales.en;
  const personality = resolveThemeVisualPersonality(theme, variant);
  const effectCoverage = resolveThemeEffectCoverage(theme, variant);
  const motionEffectActive =
    effectCoverage.find((effect) => effect.id === "motion")?.active ?? false;
  const isSemanticTheme = theme.compatibility.codex.mode === "semantic";
  const motionPreviewDisabled =
    reduceMotion || previewPresentation === "official" || !motionEffectActive;
  const motionPreviewHelp = reduceMotion
    ? t("motionPreviewReduced")
    : previewPresentation === "official"
      ? t("motionPreviewOfficialLibrary")
      : !motionEffectActive
        ? t("motionPreviewDisabled")
        : t("motionPreviewDescription");

  useEffect(() => stopMotionPreview, [theme.id, stopMotionPreview]);

  function previewMotion() {
    if (motionPreviewDisabled) return;
    setPreviewScenario("task");
    setInspectedEffect("motion");
    playMotionPreview();
  }

  return (
    <section className="featured-theme theme-detail-card">
      <button className="compact-detail-back" onClick={onBack}>
        <ArrowLeft size={14} />
        {t("backToThemes")}
      </button>
      <div className="featured-theme__preview">
        <PreviewWorkspace
          theme={previewTheme}
          variant={variant}
          locale={locale}
          reduceMotion={reduceMotion}
          resolveAsset={resolveAsset}
          presentation={previewPresentation}
          compact
          scenario={previewScenario}
          motionPreviewRevision={motionPreviewRevision}
        />
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
      </div>
      <div className="featured-theme__copy">
        <div className="theme-detail-card__identity">
          <span>
            {t("themeLabel")} {String(Math.max(1, themeIndex)).padStart(2, "0")}
            {" · "}
            {collectionLabel}
          </span>
          <div className="theme-detail-card__title-row">
            <h2>{localized.name}</h2>
            <button className="secondary-button" onClick={onEdit}>
              {editLabel}
              <ChevronRight size={15} />
            </button>
          </div>
          <p>{localized.description}</p>
        </div>
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
            <small>{t("surfaceMaterial")}</small>
            <strong>
              {t(materialLabels[personality.material])} ·{" "}
              {t(decorationLabels[personality.decorations])}
            </strong>
          </div>
          <div>
            <small>{t("motionStyle")}</small>
            <strong>{t(motionLabels[personality.motion])}</strong>
          </div>
        </div>
        <div className="theme-effect-summary theme-detail-card__coverage">
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
                aria-pressed={effect.active && inspectedEffect === effect.id}
                aria-label={`${t("inspectEffect")}: ${t(
                  effectLabels[effect.id],
                )}`}
                title={
                  effect.active ? t("inspectEffect") : t("effectUnavailable")
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
      </div>
    </section>
  );
}
