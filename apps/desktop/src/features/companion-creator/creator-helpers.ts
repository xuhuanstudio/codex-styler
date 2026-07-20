import { suggestSharedAlignment } from "./calibration";
import {
  extractImageFrames,
  extractVideoFrames,
  sliceAtlas,
  type ExtractedFrame,
} from "./media";
import type { CompanionCreatorProject, CompanionImportKind } from "./model";
import { loadCompanionProjectFrames } from "./project-files";
import { throwIfRestoreCancelled } from "./restore-flow";

export function cleanupSettingsSignature(
  cleanup: CompanionCreatorProject["cleanup"],
): string {
  return JSON.stringify(cleanup);
}

export function cleanupIsNoop(
  cleanup: CompanionCreatorProject["cleanup"],
): boolean {
  return (
    cleanup.mode === "preserve-alpha" &&
    cleanup.cornerMasks.length === 0 &&
    cleanup.strokes.length === 0
  );
}

export function projectStateSignature(
  project: CompanionCreatorProject,
): string {
  const snapshot = structuredClone(project);
  snapshot.updatedAt = "";
  return JSON.stringify(snapshot);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function defaultAtlas() {
  return {
    columns: 4,
    rows: 4,
    cellWidth: 512,
    cellHeight: 512,
    marginX: 0,
    marginY: 0,
    gapX: 0,
    gapY: 0,
    order: "row-major" as const,
    page: 0,
  };
}

export function sourceDescriptor(kind: CompanionImportKind, files: File[]) {
  return {
    kind,
    files: files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    })),
    videoRange: kind === "video" ? { startMs: 0, endMs: 30_000 } : undefined,
    extractionFps: kind === "video" ? 12 : undefined,
    atlas: kind === "atlas" ? defaultAtlas() : undefined,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function extractionActionLabel(
  kind: CompanionImportKind | undefined,
  locale: "en" | "zh-CN",
): string {
  const labels = {
    image: locale === "zh-CN" ? "准备伙伴帧" : "Prepare companion frame",
    sequence: locale === "zh-CN" ? "导入图片序列" : "Import image sequence",
    video: locale === "zh-CN" ? "抽取视频帧" : "Extract video frames",
    atlas: locale === "zh-CN" ? "切割序列图集" : "Slice sprite atlas",
  } as const;
  return kind
    ? labels[kind]
    : locale === "zh-CN"
      ? "生成帧"
      : "Generate frames";
}

export function atlasFieldLabel(
  field:
    | "columns"
    | "rows"
    | "cellWidth"
    | "cellHeight"
    | "marginX"
    | "marginY"
    | "gapX"
    | "gapY",
  locale: "en" | "zh-CN",
): string {
  const labels = {
    columns: locale === "zh-CN" ? "列数" : "Columns",
    rows: locale === "zh-CN" ? "行数" : "Rows",
    cellWidth: locale === "zh-CN" ? "单格宽度" : "Cell width",
    cellHeight: locale === "zh-CN" ? "单格高度" : "Cell height",
    marginX: locale === "zh-CN" ? "水平外边距" : "Horizontal margin",
    marginY: locale === "zh-CN" ? "垂直外边距" : "Vertical margin",
    gapX: locale === "zh-CN" ? "水平间距" : "Column gap",
    gapY: locale === "zh-CN" ? "垂直间距" : "Row gap",
  } as const;
  return labels[field];
}

export async function extractProjectFrames(
  project: CompanionCreatorProject,
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<ExtractedFrame[]> {
  if (!project.source || files.length === 0) return [];
  if (project.source.kind === "video") {
    const range = project.source.videoRange ?? { startMs: 0, endMs: 30_000 };
    return extractVideoFrames(
      files[0]!,
      { ...range, fps: project.source.extractionFps ?? 12 },
      onProgress,
    );
  }
  if (project.source.kind === "atlas") {
    return sliceAtlas(files[0]!, project.source.atlas ?? defaultAtlas());
  }
  return extractImageFrames(files);
}

export async function restoreCachedFrames(
  project: CompanionCreatorProject,
  options?: {
    signal?: AbortSignal;
    onProgress?: (completed: number, total: number) => void;
  },
): Promise<ExtractedFrame[] | null> {
  if (
    project.frames.length === 0 ||
    project.frames.some((frame) => !frame.storedPath)
  ) {
    return null;
  }
  const blobs = await loadCompanionProjectFrames(
    project.id,
    project.frames.map((frame) => frame.storedPath!),
  );
  if (blobs.some((blob) => blob === null)) return null;

  const restored = new Array<ExtractedFrame>(project.frames.length);
  let cursor = 0;
  let completed = 0;
  try {
    await Promise.all(
      Array.from({ length: Math.min(2, project.frames.length) }, async () => {
        while (cursor < project.frames.length) {
          if (options?.signal) throwIfRestoreCancelled(options.signal);
          const index = cursor;
          cursor += 1;
          const logical = project.frames[index]!;
          const blob = blobs[index]!;
          const bitmap = await createImageBitmap(blob);
          restored[index] = {
            id: logical.id,
            sourceIndex: logical.sourceIndex,
            sourceTimeMs: logical.sourceTimeMs,
            blob,
            url: URL.createObjectURL(blob),
            width: bitmap.width,
            height: bitmap.height,
          };
          bitmap.close();
          completed += 1;
          options?.onProgress?.(completed, project.frames.length);
        }
      }),
    );
  } catch (reason) {
    for (const frame of restored) {
      if (frame) URL.revokeObjectURL(frame.url);
    }
    throw reason;
  }
  return restored;
}

export function sharedCanvasDimensions(frames: ExtractedFrame[]) {
  if (frames.length === 0) return undefined;
  return {
    width: Math.min(...frames.map((frame) => frame.width)),
    height: Math.min(...frames.map((frame) => frame.height)),
  };
}

export function applySuggestedSharedAlignment(
  project: CompanionCreatorProject,
  extractedFrames: ExtractedFrame[],
): boolean {
  const suggestion = suggestSharedAlignment(
    project.frames,
    8,
    sharedCanvasDimensions(extractedFrames),
  );
  if (!suggestion) return false;
  project.frames.forEach((frame, index) => {
    const offset = suggestion.offsets[index];
    if (offset) frame.baselineOffset = offset;
  });
  project.sharedCrop = suggestion.crop;
  project.groundLine = suggestion.groundLine;
  return true;
}
