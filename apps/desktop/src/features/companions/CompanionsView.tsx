import {
  Check,
  ChevronRight,
  Download,
  Film,
  FolderOpen,
  MoreHorizontal,
  MousePointer2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  builtinCompanions,
  type CompanionDefinition,
  type EntityAttachment,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type { CompanionCreatorProject } from "../companion-creator/model";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { ThemeVariantName } from "../../lib/app-session";

export type CompanionCollection = "builtIn" | "mine";

export interface CompanionsViewProps {
  locale: Locale;
  selected: CompanionDefinition | null;
  theme: ThemeDefinition;
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
  onDeleteProject: (projectId: string) => void;
  onImport: () => void;
  onExport: (companion: CompanionDefinition) => void;
  onDelete: (companion: CompanionDefinition) => void;
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
}: CompanionsViewProps) {
  const companions =
    collection === "builtIn" ? builtinCompanions : localCompanions;
  const selectedCopy = selected
    ? (selected.locales[locale] ??
      selected.locales.en ?? {
        name: selected.name,
        description: selected.description,
      })
    : null;

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
          <div className="companion-detail-summary">
            <div>
              <span>{selected ? t("selectedCompanion") : t("themeOnly")}</span>
              <strong>{selectedCopy?.name ?? t("noCompanion")}</strong>
              <p>{selectedCopy?.description ?? t("companionIndependence")}</p>
            </div>
            <div className="companion-detail-summary__badges">
              {selected && <span>{t("interactive")}</span>}
              <span>{isLive ? t("statusApplied") : t("statusPending")}</span>
            </div>
          </div>
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
                  <details className="companion-option-actions">
                    <summary aria-label={`${t("moreActions")}: ${copy.name}`}>
                      <MoreHorizontal size={14} />
                    </summary>
                    <div role="menu">
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
