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
  onUseAutomaticDetection: () => void;
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
  onUseAutomaticDetection,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFiles,
  onRemoveSource,
}: ImportStepProps) {
  const sourceHint = project.source
    ? locale === "zh-CN"
      ? `当前限定为${c[project.source.kind]}；点击或拖入素材即可继续。`
      : `Currently limited to ${c[project.source.kind]}. Click or drop source files to continue.`
    : locale === "zh-CN"
      ? "支持图片、图片序列、视频和图集；直接导入时会自动识别。"
      : "Images, image sequences, videos, and atlases are detected automatically.";

  return (
    <section className="creator-panel creator-import">
      <div className="creator-panel__intro">
        <Upload size={20} />
        <div>
          <h2>{c.steps.import}</h2>
          <p>{c.importHelp}</p>
        </div>
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
          aria-describedby={
            project.source?.files.length
              ? undefined
              : "creator-source-detection-hint"
          }
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
              <span id="creator-source-detection-hint">{sourceHint}</span>
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
      <section
        className="creator-source-choice"
        aria-labelledby="creator-source-choice-label"
      >
        <div className="creator-source-choice__heading">
          <div>
            <strong id="creator-source-choice-label">
              {locale === "zh-CN"
                ? "可选：限定素材类型"
                : "Optional: limit source type"}
            </strong>
            <span>
              {locale === "zh-CN"
                ? "不选择时自动识别；只有需要约束文件选择器时才选择。"
                : "Leave this unset for automatic detection, or choose a type to constrain the file picker."}
            </span>
          </div>
          {project.source && project.source.files.length === 0 ? (
            <button
              type="button"
              className="creator-source-choice__mode"
              onClick={onUseAutomaticDetection}
            >
              {locale === "zh-CN" ? "恢复自动识别" : "Use automatic detection"}
            </button>
          ) : (
            <small>
              {project.source
                ? locale === "zh-CN"
                  ? `已识别：${c[project.source.kind]}`
                  : `Detected: ${c[project.source.kind]}`
                : locale === "zh-CN"
                  ? "自动识别（推荐）"
                  : "Auto detect (recommended)"}
            </small>
          )}
        </div>
        <div className="creator-source-types">
          {(
            [
              ["image", c.image, ImageIcon],
              ["sequence", c.sequence, Sparkles],
              ["video", c.video, Film],
              ["atlas", c.atlas, Grid3X3],
            ] as const
          ).map(([kind, label, Icon]) => {
            const active = project.source?.kind === kind;
            return (
              <button
                key={kind}
                className={
                  active ? "source-type source-type--active" : "source-type"
                }
                onClick={() => chooseKind(kind)}
                aria-pressed={active}
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
                {active ? (
                  <Check
                    className="source-type__state"
                    size={14}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
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
