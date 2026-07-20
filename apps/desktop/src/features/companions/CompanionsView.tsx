import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Film,
  FolderOpen,
  Magnet,
  MoreHorizontal,
  MousePointer2,
  PencilLine,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Move,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  builtinCompanions,
  type CompanionDefinition,
  type EntityAttachment,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type {
  CompanionCreatorProject,
  CreatorStep,
} from "../companion-creator/model";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { ThemeVariantName } from "../../lib/app-session";
import { findCompanionSourceProject } from "./companion-project-link";
import type {
  CompanionPlacementMode,
  SelectableCompanionPlacementMode,
} from "../../lib/companion-placement-modes";

export type CompanionCollection = "builtIn" | "mine";

const creatorSteps: CreatorStep[] = [
  "import",
  "extract",
  "cleanup",
  "align",
  "calibrate",
  "motions",
  "test",
];

const creatorStepLabels: Record<Locale, Record<CreatorStep, string>> = {
  en: {
    import: "Import",
    extract: "Extract / slice",
    cleanup: "Background cleanup",
    align: "Alignment",
    calibrate: "Direction calibration",
    motions: "Idle motions",
    test: "Test & save",
  },
  "zh-CN": {
    import: "导入",
    extract: "抽帧 / 切割",
    cleanup: "背景处理",
    align: "对齐",
    calibrate: "方向校准",
    motions: "小动作",
    test: "测试与保存",
  },
};

export interface CompanionsViewProps {
  locale: Locale;
  selected: CompanionDefinition | null;
  previewThemeFor: (companion: CompanionDefinition | null) => ThemeDefinition;
  localCompanions: CompanionDefinition[];
  projects: CompanionCreatorProject[];
  collection: CompanionCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  t: (key: MessageKey) => string;
  onSelect: (companion: CompanionDefinition | null) => void;
  onCollectionChange: (collection: CompanionCollection) => void;
  onCreate: () => void;
  onEditProject: (project: CompanionCreatorProject) => void;
  onDeleteProject: (project: CompanionCreatorProject) => void;
  onImport: () => void;
  onExport: (companion: CompanionDefinition) => void;
  onDelete: (companion: CompanionDefinition) => void;
  selectedSize: number | null;
  placementCustomized: boolean;
  placementMode: CompanionPlacementMode;
  onSizeChange: (size: number) => void;
  onPlacementModeChange: (mode: SelectableCompanionPlacementMode) => void;
  onResetPlacement: () => void;
  onAnchorChange: (anchor: { x: number; y: number }) => void;
  onAttachmentChange: (attachment: EntityAttachment | null) => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  resolveCompanionAsset: (
    companion: CompanionDefinition,
    path: string,
  ) => string;
  isLive: boolean;
  busy: boolean;
}

export function CompanionsView({
  locale,
  selected,
  previewThemeFor,
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
  selectedSize,
  placementCustomized,
  placementMode,
  onSizeChange,
  onPlacementModeChange,
  onResetPlacement,
  onAnchorChange,
  onAttachmentChange,
  resolveAsset,
  resolveCompanionAsset,
  isLive,
  busy,
}: CompanionsViewProps) {
  const [compactDetailOpen, setCompactDetailOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [browsedCompanionId, setBrowsedCompanionId] = useState<string | null>(
    selected?.id ?? null,
  );
  const layoutRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!compactDetailOpen) return;
    const element = layoutRef.current?.closest<HTMLElement>(
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
  const companions =
    collection === "builtIn" ? builtinCompanions : localCompanions;
  const selectedInCollection = selected
    ? companions.find((item) => item.id === selected.id)
    : null;
  const browsedCompanion = browsedCompanionId
    ? (companions.find((item) => item.id === browsedCompanionId) ??
      selectedInCollection ??
      companions[0] ??
      null)
    : null;
  useEffect(() => {
    setBrowsedCompanionId((current) => {
      if (current === null && selected === null) return null;
      if (current && companions.some((item) => item.id === current)) {
        return current;
      }
      return selectedInCollection?.id ?? companions[0]?.id ?? null;
    });
  }, [companions, selected?.id, selectedInCollection?.id]);
  const browsedCopy = browsedCompanion
    ? (browsedCompanion.locales[locale] ??
      browsedCompanion.locales.en ?? {
        name: browsedCompanion.name,
        description: browsedCompanion.description,
      })
    : null;
  const browsedIsLocal = Boolean(
    browsedCompanion &&
    localCompanions.some((item) => item.id === browsedCompanion.id),
  );
  const browsedSourceProject = browsedIsLocal
    ? findCompanionSourceProject(browsedCompanion, projects)
    : null;
  const browsedIsSelected = browsedCompanion?.id === selected?.id;
  const sizeProgress = selectedSize
    ? ((selectedSize - 24) / (512 - 24)) * 100
    : 0;
  const visibleProjects = showAllProjects ? projects : projects.slice(0, 3);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="page companions-page">
      <section className="page-heading">
        <div>
          <span className="page-kicker">{t("companionLibraryKicker")}</span>
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
            onClick={() => {
              setCompactDetailOpen(false);
              onCollectionChange("builtIn");
            }}
          >
            {t("builtInCompanions")}
            <small>{builtinCompanions.length}</small>
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
            {t("myCompanions")}
            <small>{localCompanions.length}</small>
          </button>
        </div>
      </div>

      {collection === "mine" && projects.length > 0 && (
        <section className="companion-projects">
          <div className="companion-projects__heading">
            <div>
              <span className="page-kicker">AUTOSAVED CREATOR PROJECTS</span>
              <strong>{t("companionDrafts")}</strong>
              <p>{t("companionDraftsDetail")}</p>
            </div>
            <div className="companion-projects__heading-actions">
              <small>{projects.length}</small>
              {projects.length > 3 && (
                <button
                  className="text-button"
                  onClick={() => setShowAllProjects((current) => !current)}
                >
                  {showAllProjects ? t("showRecentDrafts") : t("showAllDrafts")}
                </button>
              )}
            </div>
          </div>
          <div className="companion-projects__list">
            {visibleProjects.map((project) => {
              const stepIndex = Math.max(0, creatorSteps.indexOf(project.step));
              const stepLabel = creatorStepLabels[locale][project.step];
              const stepProgress =
                ((stepIndex + 1) / creatorSteps.length) * 100;
              const sourceCount = project.source?.files.length ?? 0;
              const frameCount = project.frames.length;
              const lastEdited = Number.isNaN(Date.parse(project.updatedAt))
                ? null
                : dateFormatter.format(new Date(project.updatedAt));
              return (
                <div key={project.id} className="companion-project-card">
                  <button
                    onClick={() => onEditProject(project)}
                    aria-label={`${t("continueDraft")}: ${project.name}, ${stepLabel}, ${stepIndex + 1}/${creatorSteps.length}`}
                  >
                    <span className="companion-project-card__icon">
                      <Film size={15} />
                    </span>
                    <span className="companion-project-card__body">
                      <span className="companion-project-card__title-row">
                        <strong>{project.name}</strong>
                        <small>{stepLabel}</small>
                      </span>
                      <span className="companion-project-card__meta">
                        {sourceCount}{" "}
                        {t(sourceCount === 1 ? "sourceFile" : "sourceFiles")} ·{" "}
                        {frameCount} {t(frameCount === 1 ? "frame" : "frames")}
                        {lastEdited ? ` · ${lastEdited}` : ""}
                      </span>
                      <span
                        className="companion-project-card__progress"
                        aria-hidden="true"
                      >
                        <span style={{ width: `${stepProgress}%` }} />
                      </span>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => onDeleteProject(project)}
                    aria-label={`${t("deleteDraft")}: ${project.name}`}
                    title={t("deleteDraft")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div
        ref={layoutRef}
        className={
          "companions-layout" +
          (compactDetailOpen ? " companions-layout--detail" : "")
        }
      >
        <section className="companion-preview-panel">
          <button
            className="compact-detail-back"
            onClick={() => setCompactDetailOpen(false)}
          >
            <ArrowLeft size={14} />
            {t("backToCompanions")}
          </button>
          <div className="companion-preview-stage">
            <PreviewWorkspace
              theme={previewThemeFor(browsedCompanion)}
              variant={variant}
              locale={locale}
              reduceMotion={reduceMotion}
              resolveAsset={resolveAsset}
              onEntityAnchorChange={
                browsedIsSelected ? onAnchorChange : undefined
              }
              onEntityAttachmentChange={
                browsedIsSelected ? onAttachmentChange : undefined
              }
            />
            {browsedCompanion && browsedIsSelected && (
              <span className="drag-hint">
                <MousePointer2 size={13} />
                {t("dragCompanion")}
              </span>
            )}
          </div>
          <div className="companion-detail-summary">
            <div>
              <span>
                {browsedIsSelected
                  ? browsedCompanion
                    ? t("selectedCompanion")
                    : t("themeOnly")
                  : t("previewOnly")}
              </span>
              <strong>{browsedCopy?.name ?? t("noCompanion")}</strong>
              <p>{browsedCopy?.description ?? t("companionIndependence")}</p>
            </div>
            <div className="companion-detail-summary__side">
              <div className="companion-detail-summary__badges">
                {browsedCompanion && (
                  <span>
                    {browsedIsLocal
                      ? t("installedLocally")
                      : t("builtInCompanion")}
                  </span>
                )}
                <span>
                  {busy
                    ? t("statusApplying")
                    : !browsedIsSelected
                      ? t("previewOnly")
                      : isLive
                        ? t("statusApplied")
                        : t("statusPending")}
                </span>
              </div>
              {browsedCompanion && browsedIsSelected && selectedSize && (
                <div
                  className="companion-placement-controls"
                  title={t("companionPlacementDetail")}
                >
                  <div className="companion-placement-controls__heading">
                    <strong>{t("companionPlacement")}</strong>
                    <small>
                      {placementCustomized
                        ? t("customized")
                        : t("packageDefault")}
                    </small>
                  </div>
                  <div
                    className="companion-placement-modes"
                    role="group"
                    aria-label={t("placementMode")}
                  >
                    <button
                      type="button"
                      aria-pressed={placementMode === "composer"}
                      onClick={() => onPlacementModeChange("composer")}
                    >
                      <Magnet size={12} aria-hidden="true" />
                      {t("composerEdge")}
                    </button>
                    <button
                      type="button"
                      aria-pressed={placementMode === "free"}
                      onClick={() => onPlacementModeChange("free")}
                    >
                      <Move size={12} aria-hidden="true" />
                      {t("freePosition")}
                    </button>
                    {placementMode === "custom" && (
                      <span>{t("customAttachment")}</span>
                    )}
                  </div>
                  <div className="companion-placement-controls__row">
                    <label className="range-control companion-size-control">
                      <input
                        type="range"
                        min={24}
                        max={512}
                        step={4}
                        value={selectedSize}
                        aria-label={t("companionSize")}
                        style={
                          {
                            "--range-progress": `${sizeProgress}%`,
                          } as CSSProperties
                        }
                        onChange={(event) =>
                          onSizeChange(Number(event.target.value))
                        }
                      />
                    </label>
                    <output>{selectedSize}px</output>
                    <button
                      className="secondary-button companion-placement-reset"
                      onClick={onResetPlacement}
                      disabled={!placementCustomized}
                      aria-label={t("resetCompanionPlacement")}
                    >
                      <RotateCcw size={12} />
                      {t("reset")}
                    </button>
                  </div>
                </div>
              )}
              {browsedCompanion && browsedIsLocal && (
                <div
                  className="companion-detail-summary__actions"
                  role="group"
                  aria-label={t("installedCompanionActions")}
                >
                  {browsedSourceProject && (
                    <button
                      className="secondary-button"
                      onClick={() => onEditProject(browsedSourceProject)}
                    >
                      <PencilLine size={13} />
                      {t("editSourceProject")}
                    </button>
                  )}
                  <button
                    className="secondary-button"
                    onClick={() => onExport(browsedCompanion)}
                  >
                    <Download size={13} />
                    {t("exportCompanion")}
                  </button>
                  <button
                    className="danger-button danger-button--quiet"
                    onClick={() => onDelete(browsedCompanion)}
                  >
                    <Trash2 size={13} />
                    {t("deleteCompanion")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className="companion-list"
          aria-label={t("companions")}
          data-scroll-surface="panel"
        >
          <button
            className={
              "companion-option" +
              (!selected ? " companion-option--active" : "")
            }
            onClick={() => {
              setBrowsedCompanionId(null);
              onSelect(null);
              setCompactDetailOpen(true);
            }}
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
            const sourceProject =
              collection === "mine"
                ? findCompanionSourceProject(item, projects)
                : null;
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
                  onClick={() => {
                    setBrowsedCompanionId(item.id);
                    onSelect(item);
                    setCompactDetailOpen(true);
                  }}
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
                  <details className="companion-option-actions">
                    <summary aria-label={`${t("moreActions")}: ${copy.name}`}>
                      <MoreHorizontal size={14} />
                    </summary>
                    <div role="menu">
                      {sourceProject && (
                        <button
                          role="menuitem"
                          onClick={() => onEditProject(sourceProject)}
                        >
                          <PencilLine size={14} />
                          {t("editSourceProject")}
                        </button>
                      )}
                      <button role="menuitem" onClick={() => onExport(item)}>
                        <Download size={14} />
                        {t("exportCompanion")}
                      </button>
                      <button
                        role="menuitem"
                        className="is-danger"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 size={14} />
                        {t("deleteCompanion")}
                      </button>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
