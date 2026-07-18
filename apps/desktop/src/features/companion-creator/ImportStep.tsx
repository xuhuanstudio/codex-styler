import {
  Check,
  Film,
  Grid3X3,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent, DragEvent, RefObject } from "react";
import type { CompanionCreatorProject, CompanionImportKind } from "./model";

interface ImportStepCopy {
  steps: { import: string };
  importHelp: string;
  image: string;
  sequence: string;
  video: string;
  atlas: string;
  imageHint: string;
  sequenceHint: string;
  videoHint: string;
  atlasHint: string;
  releaseFiles: string;
  chooseFiles: string;
  noSource: string;
  removeSource: string;
  importGuideTitle: string;
  importGuideItems: readonly string[];
}

export interface ImportStepProps {
  project: CompanionCreatorProject;
  locale: "en" | "zh-CN";
  copy: ImportStepCopy;
  dragActive: boolean;
  dropzoneRef: RefObject<HTMLButtonElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  chooseKind: (kind: CompanionImportKind) => void;
  onDragEnter: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onFiles: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onRemoveSource: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ImportStep({
  project,
  locale,
  copy: c,
  dragActive,
  dropzoneRef,
  inputRef,
  chooseKind,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFiles,
  onRemoveSource,
}: ImportStepProps) {
  return (
    <section className="creator-panel creator-import">
      <div className="creator-panel__intro">
        <Upload size={20} />
        <div>
          <h2>{c.steps.import}</h2>
          <p>{c.importHelp}</p>
        </div>
      </div>
      <div className="creator-source-types">
        {(
          [
            ["image", c.image, ImageIcon],
            ["sequence", c.sequence, Sparkles],
            ["video", c.video, Film],
            ["atlas", c.atlas, Grid3X3],
          ] as const
        ).map(([kind, label, Icon]) => (
          <button
            key={kind}
            className={
              project.source?.kind === kind
                ? "source-type source-type--active"
                : "source-type"
            }
            onClick={() => chooseKind(kind)}
            aria-pressed={project.source?.kind === kind}
          >
            <Icon size={21} />
            <strong>{label}</strong>
            <span>
              {kind === "video"
                ? c.videoHint
                : kind === "sequence"
                  ? c.sequenceHint
                  : kind === "atlas"
                    ? c.atlasHint
                    : c.imageHint}
            </span>
          </button>
        ))}
      </div>
      <div className="creator-dropzone-shell">
        <button
          ref={dropzoneRef}
          type="button"
          className={
            dragActive
              ? "creator-dropzone creator-dropzone--active"
              : "creator-dropzone"
          }
          onClick={() => inputRef.current?.click()}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {project.source?.files.length ? (
            <>
              <span className="creator-dropzone__ready-icon">
                <Check size={17} />
              </span>
              <span className="creator-dropzone__content">
                <small>
                  {dragActive
                    ? c.releaseFiles
                    : locale === "zh-CN"
                      ? `${project.source.files.length} 个素材已就绪`
                      : `${project.source.files.length} source ${project.source.files.length === 1 ? "file" : "files"} ready`}
                </small>
                <strong>
                  {project.source.files.map((file) => file.name).join(", ")}
                </strong>
                <em>
                  {formatFileSize(
                    project.source.files.reduce(
                      (total, file) => total + file.size,
                      0,
                    ),
                  )}
                  <b>
                    {locale === "zh-CN"
                      ? "点击或拖入以替换"
                      : "Click or drop to replace"}
                  </b>
                </em>
              </span>
            </>
          ) : (
            <>
              <Upload size={22} />
              <strong>{dragActive ? c.releaseFiles : c.chooseFiles}</strong>
              <span>{c.noSource}</span>
            </>
          )}
        </button>
        {project.source?.files.length ? (
          <button
            type="button"
            className="creator-dropzone__remove"
            onClick={onRemoveSource}
            aria-label={c.removeSource}
            title={c.removeSource}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple={!project.source || project.source.kind === "sequence"}
        accept={
          project.source?.kind === "video"
            ? ".mp4,.m4v,.mov,.webm,video/mp4,video/quicktime,video/webm"
            : project.source
              ? ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              : ".png,.jpg,.jpeg,.webp,.mp4,.m4v,.mov,.webm,image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
        }
        onChange={onFiles}
      />
      <section className="creator-import-guide" aria-label={c.importGuideTitle}>
        <div>
          <Sparkles size={16} />
          <strong>{c.importGuideTitle}</strong>
        </div>
        <ul>
          {c.importGuideItems.map((item) => (
            <li key={item}>
              <Check size={13} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
