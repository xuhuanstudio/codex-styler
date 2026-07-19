import {
  AlertTriangle,
  ArrowLeft,
  Brush,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Crop,
  Eraser,
  Eye,
  Film,
  Grid3X3,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Minus,
  Move,
  MousePointer2,
  Pause,
  Pipette,
  Redo2,
  RotateCcw,
  Save,
  Scissors,
  ScanLine,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  atlasCellRect,
  atlasOverflow,
  commonSubjectCrop,
  calibrateDirections,
  diagnoseSharedAlignment,
  expandSharedCanvasToContent,
  fitSharedContentScale,
  nearestDirectionFrame,
  normalizeAngle,
  suggestSharedAlignment,
  type DirectionCalibration,
} from "./calibration";
import { compileCompanion } from "./compiler";
import { DirectionDial } from "./DirectionDial";
import {
  alphaBounds,
  cleanFrame,
  extractImageFrames,
  extractVideoFrames,
  measureVisualDeltas,
  sampleFrameColor,
  sliceAtlas,
  validateCreatorSourceFiles,
  type ExtractedFrame,
} from "./media";
import {
  companionProjectIsPristine,
  createCompanionProject,
  DEFAULT_CONTENT_SCALE,
  MAX_CONTENT_SCALE,
  MIN_CONTENT_SCALE,
  normalizeCompanionProject,
  resetCompanionProjectDerivedState,
  suggestedCompanionName,
  type AtlasSliceSettings,
  type CompanionCreatorProject,
  type CompanionImportKind,
  type CreatorStep,
  type DirectionAnchor,
  type FrameBounds,
  type LogicalFrame,
} from "./model";
import {
  companionOutputLimits,
  summarizeCompanionOutput,
} from "./output-summary";
import {
  diagnoseMotionRange,
  motionPreviewFrames,
  motionRangeSignature,
  type MotionPlayback,
} from "./motions";
import {
  cacheCompanionProjectFrames,
  loadCompanionProjectFrames,
  loadCompanionProjectSource,
  saveCompanionProject,
} from "./project-files";
import { filesFromDroppedPaths } from "./native-drop";
import {
  isCompanionRestoreCancelled,
  restoreFramesSequentially,
  throwIfRestoreCancelled,
} from "./restore-flow";
import { AtlasGridPreview, SourceMediaPreview } from "./SourcePreview";
import { CalibrationHealth, CalibrationSummary } from "./CalibrationStatus";
import { AlignmentAssistant } from "./AlignmentAssistant";
import { ImportStep } from "./ImportStep";
import {
  CleanupBrushStage,
  DirectionTimeline,
  FrameStage,
  InteractiveAlignmentStage,
  PointerTestStage,
} from "./StudioStages";
import type { CompanionDefinition } from "@codex-styler/theme-core";

const stepOrder: CreatorStep[] = [
  "import",
  "extract",
  "cleanup",
  "align",
  "calibrate",
  "motions",
  "test",
];

type DraftRestoreStage = "sources" | "frames" | "cleanup";

type DraftRestoreState =
  | {
      status: "running";
      stage: DraftRestoreStage;
      completed: number;
      total: number;
      progress: number;
      cancelling: boolean;
    }
  | { status: "cancelled" }
  | { status: "error"; message: string };

const copy = {
  en: {
    title: "Companion Studio",
    subtitle: "Turn local media into a calibrated, portable companion.",
    steps: {
      import: "Import",
      extract: "Extract / Slice",
      cleanup: "Clean up",
      align: "Align",
      calibrate: "Calibrate",
      motions: "Motions",
      test: "Test & Save",
    },
    importHelp:
      "Choose a still image, a naturally named image sequence, a short video, or an existing atlas. Source media stays on this device.",
    importGuideTitle: "A reliable source makes calibration faster",
    importGuideItems: [
      "Keep the subject fully visible at its original resolution.",
      "Use at least four distinct directions for a pointer-aware companion.",
      "Your source media stays local and is never included in the final package.",
    ],
    image: "Static image",
    sequence: "Image sequence",
    video: "Video",
    atlas: "Sprite atlas",
    imageHint: "PNG / JPEG / WebP · transparency preferred",
    sequenceHint: "Naturally ordered PNG / JPEG / WebP",
    videoHint: "MP4 / M4V / MOV / WebM · up to 30 seconds",
    atlasHint: "Grid-based sprite sheet",
    chooseFiles: "Choose files or drop them here",
    releaseFiles: "Release to import these files",
    noSource: "No source selected",
    extract: "Generate logical frames",
    cleanupHelp:
      "Preserve existing transparency or remove a sampled background locally. Inspect edges on more than one background before continuing.",
    preserveAlpha: "Preserve transparency",
    sampledColor: "Remove sampled color",
    processCleanup: "Apply changes to all frames",
    discardCleanup: "Discard edits",
    cleanupPending: "Preview changes have not been applied to all frames.",
    cleanupApplied: "All frames are up to date.",
    cleanupPreview: "Preview",
    cleanupBackdrop: "Background",
    cleanupTools: "Correction tools",
    cleanupToolsHint:
      "Brush in source coordinates. Result view shows the final pixels without correction overlays.",
    applyAndContinue: "Apply & continue",
    removeSource: "Remove source",
    autosaving: "Saving draft…",
    autosaveFailed: "Draft could not be saved",
    resetProjectTitle: "Reset this companion project?",
    resetProjectBody:
      "This clears the imported source, generated frames, calibration, and motion setup from this local draft. This action cannot be undone.",
    removeSourceTitle: "Remove the imported source?",
    removeSourceBody:
      "Generated frames and calibration from this source will also be cleared and cannot be restored with Undo.",
    changeSourceTitle: "Change the source type?",
    changeSourceBody:
      "The current source, generated frames, and calibration will be cleared before switching formats and cannot be restored with Undo.",
    replaceSourceTitle: "Replace the imported source?",
    replaceSourceBody:
      "The current generated frames, cleanup, alignment, calibration, and motions will be rebuilt for the new source. This cannot be restored with Undo.",
    cancel: "Cancel",
    confirmReset: "Reset project",
    confirmRemove: "Remove source",
    confirmChange: "Change source",
    confirmReplace: "Replace source",
    keepBrush: "Keep brush",
    eraseBrush: "Erase brush",
    eyedropper: "Pick background color",
    currentFrameOnly: "Current frame",
    allFrames: "All frames",
    brushSize: "Brush size",
    alignHelp:
      "Every frame uses this shared canvas and scale. Only baseline translation is allowed, preventing size and position jumps.",
    calibrateHelp:
      "Select a frame, then point the dial toward the cursor position that should use it. The dial, number and timeline anchor stay synchronized.",
    addAnchor: "Set direction anchor",
    motionsHelp:
      "Mark blinks, breathing and small gestures as idle ranges. They remain attached to poses instead of becoming duplicate directions.",
    addMotion: "Add current idle range",
    testHelp:
      "Move the pointer in the stage to test direction selection. The final package contains compiled atlases, not your source video.",
    save: "Build and install companion",
    building: "Building companion…",
    description: "Description",
    readiness: "Package readiness",
    compiledOutput: "Compiled output",
    outputCanvas: "Output canvas",
    logicalFrames: "Logical frames",
    directionCoverage: "Direction coverage",
    idleMotions: "Idle motions",
    decodedPage: "Largest decoded page",
    staticImageAsset: "1 optimized image",
    atlasPage: "atlas page",
    atlasPages: "atlas pages",
    pose: "pose",
    poses: "poses",
    clip: "clip",
    clips: "clips",
    excludedFrames: "excluded",
    packageLimitsReady: "Compiled assets fit package limits",
    packageLimits:
      "Limits: 512 frames · 8192 px per side · 8 atlas pages · 48 MiB decoded per page · 20 MiB encoded per asset",
    outputIssue: {
      "missing-crop": "Set a shared crop before compiling.",
      "missing-frames": "Include at least one logical frame before compiling.",
      "frame-limit": "Exclude frames until the project contains at most 512.",
      "canvas-limit": "Reduce the shared crop so neither side exceeds 8192 px.",
      "atlas-limit":
        "Reduce empty canvas area or exclude frames to fit within eight atlas pages.",
    },
    metadataReady: "Name, description, author and license are complete",
    framesReady: "Included frames are ready",
    directionsReady: "Direction behavior is ready",
    staticDirectionReady: "Static pose is ready",
    placementReady: "Placement has been tested",
    chooseLicense: "Choose a license",
    licenseHint:
      "Choose the license that covers the imported artwork, not Codex Styler itself.",
    readyCount: "checks ready",
    previewBackdrop: "Preview background",
    optionalSkipped: "Optional step skipped",
    fixMetadata: "Complete the highlighted companion details before building.",
    reviewRemaining: "Review remaining setup",
    reviewMetadata: "Complete companion details",
    reviewFrames: "Restore an included frame",
    reviewDirections: "Complete direction calibration",
    reviewOutput: "Fix compiled output",
    reviewIssue: "Open the step that needs attention",
    dragCompanion: "Drag companion position",
    previewHeight: "Composer height (preview)",
    companionSize: "Companion size",
    horizontalPosition: "Horizontal position",
    verticalOffset: "Edge offset",
    back: "Back to companions",
    previous: "Previous",
    next: "Next",
    undo: "Undo",
    redo: "Redo",
    resetStep: "Reset step",
    resetAll: "Reset project",
    noFrames: "Generate frames before continuing.",
    processing: "Processing locally…",
    restoringDraft: "Restoring local draft",
    restoreStageSources: "Reading source media",
    restoreStageFrames: "Restoring working frames",
    restoreStageCleanup: "Rebuilding background cleanup",
    restoreProgress: "completed",
    stopRestore: "Stop loading",
    stoppingRestore: "Stopping after the current frame…",
    restoreCancelled: "Draft loading was stopped",
    restoreCancelledDetail:
      "The draft and source media are still safe. Retry loading or return to the companion library.",
    restoreFailed: "This draft could not be restored",
    restoreFailedDetail:
      "Nothing was deleted. Retry once; if it fails again, return to the library and keep the draft for diagnostics.",
    retryRestore: "Retry loading",
    frame: "Frame",
    excluded: "Excluded",
    include: "Include",
    exclude: "Exclude",
    sharedCrop: "Shared crop",
    groundLine: "Ground line",
    baselineX: "Horizontal offset",
    baselineY: "Vertical offset",
    license: "Asset license",
    author: "Author",
    name: "Companion name",
    rangeStart: "Range start",
    rangeEnd: "Range end",
    followPointer: "Pointer test area",
    saved: "Companion installed in My Companions.",
  },
  "zh-CN": {
    title: "伙伴工作室",
    subtitle: "把本地素材制作成已校准、可移植的互动伙伴。",
    steps: {
      import: "导入",
      extract: "抽帧 / 切割",
      cleanup: "背景处理",
      align: "对齐",
      calibrate: "方向校准",
      motions: "小动作",
      test: "测试与保存",
    },
    importHelp:
      "可选择静态图片、自然命名的图片序列、短视频或已有图集。源素材始终保留在本机。",
    importGuideTitle: "素材准备越规范，后续校准越高效",
    importGuideItems: [
      "保持主体完整可见，并保留源素材原始分辨率。",
      "需要跟随光标时，建议准备至少四个清晰方向。",
      "源素材只保存在本机，不会写入最终伙伴包。",
    ],
    image: "静态图片",
    sequence: "图片序列",
    video: "视频",
    atlas: "序列图集",
    imageHint: "PNG / JPEG / WebP · 推荐透明背景",
    sequenceHint: "按文件名自然排序的 PNG / JPEG / WebP",
    videoHint: "MP4 / M4V / MOV / WebM · 最长 30 秒",
    atlasHint: "按网格切割的序列图",
    chooseFiles: "点击选择，或将素材拖放到这里",
    releaseFiles: "松开以导入这些素材",
    noSource: "尚未选择源素材",
    extract: "生成逻辑帧",
    cleanupHelp:
      "可保留已有透明通道，或在本地去除取样背景色。继续前请在多种背景上检查边缘。",
    preserveAlpha: "保留透明通道",
    sampledColor: "去除取样颜色",
    processCleanup: "应用到全部帧",
    discardCleanup: "放弃修改",
    cleanupPending: "当前预览尚未应用到全部帧。",
    cleanupApplied: "全部帧均已更新。",
    cleanupPreview: "预览",
    cleanupBackdrop: "检查背景",
    cleanupTools: "修正工具",
    cleanupToolsHint:
      "画笔使用源图坐标；“处理结果”只显示最终像素，不叠加修正标记。",
    applyAndContinue: "应用并继续",
    removeSource: "移除素材",
    autosaving: "正在保存草稿…",
    autosaveFailed: "草稿保存失败",
    resetProjectTitle: "重置整个伙伴工程？",
    resetProjectBody:
      "这会清除当前本地草稿中的源素材、生成帧、方向校准和动作设置，且无法撤销。",
    removeSourceTitle: "移除已导入素材？",
    removeSourceBody:
      "基于该素材生成的帧和校准数据也会一并清除，且无法通过撤销恢复。",
    changeSourceTitle: "切换素材类型？",
    changeSourceBody:
      "切换格式前会清除当前素材、生成帧和校准数据，且无法通过撤销恢复。",
    replaceSourceTitle: "替换已导入素材？",
    replaceSourceBody:
      "新素材会重新生成帧，并清除当前背景处理、对齐、方向校准和小动作数据，且无法通过撤销恢复。",
    cancel: "取消",
    confirmReset: "重置工程",
    confirmRemove: "移除素材",
    confirmChange: "切换类型",
    confirmReplace: "替换素材",
    keepBrush: "保留画笔",
    eraseBrush: "擦除画笔",
    eyedropper: "吸取背景色",
    currentFrameOnly: "仅当前帧",
    allFrames: "全部帧",
    brushSize: "画笔大小",
    alignHelp:
      "所有帧共用同一个画布和缩放比例，只允许基线平移，避免角色大小与位置跳动。",
    calibrateHelp:
      "先选择帧，再把圆盘指针指向“光标位于伙伴哪个方向时使用该帧”。圆盘、角度数字和时间轴锚点双向同步。",
    addAnchor: "设置方向锚点",
    motionsHelp:
      "将眨眼、呼吸和小动作标记为空闲区间，它们会关联姿态，而不会伪装成重复方向。",
    addMotion: "添加当前小动作区间",
    testHelp:
      "在舞台内移动光标测试方向选择。最终包只包含编译后的图集，不包含源视频。",
    save: "构建并安装伙伴",
    building: "正在构建伙伴…",
    description: "伙伴描述",
    readiness: "伙伴包就绪状态",
    compiledOutput: "编译输出",
    outputCanvas: "输出画布",
    logicalFrames: "逻辑帧",
    directionCoverage: "方向覆盖",
    idleMotions: "空闲动作",
    decodedPage: "最大解码页面",
    staticImageAsset: "1 张优化图片",
    atlasPage: "页图集",
    atlasPages: "页图集",
    pose: "个姿态",
    poses: "个姿态",
    clip: "个片段",
    clips: "个片段",
    excludedFrames: "帧已排除",
    packageLimitsReady: "编译资源符合伙伴包限制",
    packageLimits:
      "限制：512 帧 · 单边 8192 px · 8 页图集 · 每页解码 48 MiB · 单个编码资源 20 MiB",
    outputIssue: {
      "missing-crop": "请先设置共享裁剪区域。",
      "missing-frames": "请至少保留一个逻辑帧。",
      "frame-limit": "请排除部分帧，使工程不超过 512 帧。",
      "canvas-limit": "请缩小共享裁剪区域，确保任一边不超过 8192 px。",
      "atlas-limit": "请减少空白画布区域或排除部分帧，使图集不超过 8 页。",
    },
    metadataReady: "名称、描述、作者和许可证已填写",
    framesReady: "有效帧已准备完成",
    directionsReady: "方向行为已准备完成",
    staticDirectionReady: "静态姿态已准备完成",
    placementReady: "位置与尺寸已完成预览",
    chooseLicense: "请选择许可证",
    licenseHint:
      "请选择导入素材本身适用的许可证，而不是 Codex Styler 的许可证。",
    readyCount: "项检查已就绪",
    previewBackdrop: "预览背景",
    optionalSkipped: "已跳过可选步骤",
    fixMetadata: "请先补全高亮显示的伙伴信息，再进行构建。",
    reviewRemaining: "检查未完成设置",
    reviewMetadata: "补全伙伴信息",
    reviewFrames: "恢复至少一个有效帧",
    reviewDirections: "完成方向校准",
    reviewOutput: "修复编译输出",
    reviewIssue: "打开需要处理的步骤",
    dragCompanion: "拖动伙伴位置",
    previewHeight: "输入框高度（仅预览）",
    companionSize: "伙伴尺寸",
    horizontalPosition: "水平位置",
    verticalOffset: "边框偏移",
    back: "返回伙伴",
    previous: "上一步",
    next: "下一步",
    undo: "撤销",
    redo: "重做",
    resetStep: "重置当前步骤",
    resetAll: "重置整个工程",
    noFrames: "请先生成帧再继续。",
    processing: "正在本地处理…",
    restoringDraft: "正在恢复本地草稿",
    restoreStageSources: "读取源素材",
    restoreStageFrames: "恢复工作帧",
    restoreStageCleanup: "重建背景处理",
    restoreProgress: "已完成",
    stopRestore: "停止加载",
    stoppingRestore: "正在完成当前帧后停止…",
    restoreCancelled: "已停止加载草稿",
    restoreCancelledDetail:
      "草稿和源素材仍安全保留。你可以重新加载，或返回伙伴库稍后继续。",
    restoreFailed: "无法恢复这个草稿",
    restoreFailedDetail:
      "没有删除任何内容。请先重试一次；如果仍然失败，可返回伙伴库并保留草稿用于诊断。",
    retryRestore: "重新加载",
    frame: "帧",
    excluded: "已排除",
    include: "包含",
    exclude: "排除",
    sharedCrop: "共享裁剪",
    groundLine: "地面线",
    baselineX: "水平偏移",
    baselineY: "垂直偏移",
    license: "素材许可证",
    author: "作者",
    name: "伙伴名称",
    rangeStart: "区间起点",
    rangeEnd: "区间终点",
    followPointer: "光标测试区域",
    saved: "伙伴已安装到“我的伙伴”。",
  },
} as const;

type CreatorConfirmAction =
  | { kind: "reset-project" }
  | { kind: "remove-source" }
  | {
      kind: "replace-source";
      sourceKind: CompanionImportKind;
      files: File[];
    }
  | { kind: "change-source"; sourceKind: CompanionImportKind };

function cleanupSettingsSignature(
  cleanup: CompanionCreatorProject["cleanup"],
): string {
  return JSON.stringify(cleanup);
}

function cleanupIsNoop(cleanup: CompanionCreatorProject["cleanup"]): boolean {
  return (
    cleanup.mode === "preserve-alpha" &&
    cleanup.cornerMasks.length === 0 &&
    cleanup.strokes.length === 0
  );
}

function projectStateSignature(project: CompanionCreatorProject): string {
  const snapshot = structuredClone(project);
  snapshot.updatedAt = "";
  return JSON.stringify(snapshot);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function defaultAtlas() {
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

function sourceDescriptor(kind: CompanionImportKind, files: File[]) {
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

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function extractionActionLabel(
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

function atlasFieldLabel(
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

async function extractProjectFrames(
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

async function restoreCachedFrames(
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

function sharedCanvasDimensions(frames: ExtractedFrame[]) {
  if (frames.length === 0) return undefined;
  return {
    width: Math.min(...frames.map((frame) => frame.width)),
    height: Math.min(...frames.map((frame) => frame.height)),
  };
}

function applySuggestedSharedAlignment(
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

export function CompanionCreator({
  locale,
  initialProject,
  onBack,
  onSaved,
}: {
  locale: "en" | "zh-CN";
  initialProject?: CompanionCreatorProject | null;
  onBack: () => void;
  onSaved: (
    companion: CompanionDefinition,
    files: Map<string, Uint8Array>,
  ) => Promise<void> | void;
}) {
  const c = copy[locale];
  const requiresDraftRestore = Boolean(
    initialProject?.source?.files.some((file) => file.storedPath),
  );
  const [project, setProject] = useState<CompanionCreatorProject>(() =>
    initialProject
      ? normalizeCompanionProject(initialProject)
      : createCompanionProject(),
  );
  const [past, setPast] = useState<CompanionCreatorProject[]>([]);
  const [future, setFuture] = useState<CompanionCreatorProject[]>([]);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [sourceFrames, setSourceFrames] = useState<ExtractedFrame[]>([]);
  const [cleanupPreviewFrame, setCleanupPreviewFrame] =
    useState<ExtractedFrame>();
  const [cleanupBackdrop, setCleanupBackdrop] = useState<
    "transparent" | "black" | "white" | "theme"
  >("transparent");
  const [cleanupView, setCleanupView] = useState<"source" | "result" | "mask">(
    "result",
  );
  const [currentFrame, setCurrentFrame] = useState(0);
  const [angle, setAngle] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreState, setRestoreState] = useState<DraftRestoreState | null>(
    () =>
      requiresDraftRestore
        ? {
            status: "running",
            stage: "sources",
            completed: 0,
            total: initialProject?.source?.files.length ?? 1,
            progress: 0,
            cancelling: false,
          }
        : null,
  );
  const [motionStart, setMotionStart] = useState(0);
  const [motionEnd, setMotionEnd] = useState(0);
  const [motionPreviewing, setMotionPreviewing] = useState(false);
  const [motionPreviewedSignature, setMotionPreviewedSignature] = useState<
    string | null
  >(null);
  const [motionDraftPlayback, setMotionDraftPlayback] =
    useState<MotionPlayback>("forward");
  const [motionSelectionMode, setMotionSelectionMode] = useState<
    "inspect" | "start" | "end"
  >("end");
  const [calibrationStart, setCalibrationStart] = useState(0);
  const [calibrationEnd, setCalibrationEnd] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 18 });
  const [testComposerHeight, setTestComposerHeight] = useState(70);
  const [brushMode, setBrushMode] = useState<"keep" | "erase">("erase");
  const [brushScope, setBrushScope] = useState<"current" | "all">("current");
  const [brushSize, setBrushSize] = useState(28);
  const [samplingColor, setSamplingColor] = useState(false);
  const [alignmentTool, setAlignmentTool] = useState<"canvas" | "frame">(
    "canvas",
  );
  const [alignmentView, setAlignmentView] = useState<"current" | "overlay">(
    "current",
  );
  const [dragActive, setDragActive] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [videoDecodeStatus, setVideoDecodeStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [atlasDimensions, setAtlasDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [cleanupAppliedSignature, setCleanupAppliedSignature] = useState<
    string | null
  >(null);
  const [cleanupAppliedSettings, setCleanupAppliedSettings] = useState<
    CompanionCreatorProject["cleanup"]
  >(() =>
    structuredClone(
      initialProject
        ? normalizeCompanionProject(initialProject).cleanup
        : createCompanionProject().cleanup,
    ),
  );
  const [autosaveStatus, setAutosaveStatus] = useState<
    "saving" | "saved" | "error"
  >("saved");
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date());
  const [confirmAction, setConfirmAction] =
    useState<CreatorConfirmAction | null>(null);
  const [furthestStepIndex, setFurthestStepIndex] = useState(() =>
    Math.max(0, stepOrder.indexOf(initialProject?.step ?? "import")),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const creatorRootRef = useRef<HTMLDivElement>(null);
  const dropzoneRef = useRef<HTMLButtonElement>(null);
  const dragDepthRef = useRef(0);
  const nativeDragResetRef = useRef<number | null>(null);
  const nativeDropImportRef = useRef<(files: File[]) => Promise<void>>(
    async () => undefined,
  );
  const stepBaseline = useRef(project);
  const autosaveRef = useRef<number | null>(null);
  const autosaveRevisionRef = useRef(0);
  const latestProjectRef = useRef(project);
  const autosavePendingRef = useRef(false);
  const hasPersistedDraftRef = useRef(Boolean(initialProject));
  const framesRef = useRef(frames);
  const sourceFramesRef = useRef(sourceFrames);
  const cleanupPreviewRef = useRef<ExtractedFrame | undefined>(undefined);
  const restoreAbortRef = useRef<AbortController | null>(null);
  const activeStepRef = useRef(project.step);

  const updateProject = (
    updater: (value: CompanionCreatorProject) => CompanionCreatorProject,
  ) => {
    setProject((current) => {
      const next = updater(structuredClone(current));
      next.updatedAt = new Date().toISOString();
      setPast((items) => [...items.slice(-49), current]);
      setFuture([]);
      return next;
    });
  };

  useEffect(() => {
    latestProjectRef.current = project;
    if (autosaveRef.current !== null) window.clearTimeout(autosaveRef.current);
    const shouldPersist =
      hasPersistedDraftRef.current || !companionProjectIsPristine(project);
    if (!shouldPersist) {
      autosavePendingRef.current = false;
      setAutosaveStatus("saved");
      return;
    }
    const revision = ++autosaveRevisionRef.current;
    autosavePendingRef.current = true;
    setAutosaveStatus("saving");
    autosaveRef.current = window.setTimeout(() => {
      void saveCompanionProject(project)
        .then(() => {
          if (revision !== autosaveRevisionRef.current) return;
          hasPersistedDraftRef.current = true;
          autosavePendingRef.current = false;
          setLastSavedAt(new Date());
          setAutosaveStatus("saved");
        })
        .catch(() => {
          if (revision !== autosaveRevisionRef.current) return;
          autosavePendingRef.current = false;
          setAutosaveStatus("error");
        });
    }, 700);
    return () => {
      if (autosaveRef.current !== null)
        window.clearTimeout(autosaveRef.current);
    };
  }, [project]);

  useEffect(
    () => () => {
      if (!autosavePendingRef.current) return;
      autosaveRevisionRef.current += 1;
      void saveCompanionProject(latestProjectRef.current);
    },
    [],
  );

  useEffect(() => {
    if (activeStepRef.current === project.step) return;
    const previousStep = activeStepRef.current;
    activeStepRef.current = project.step;
    stepBaseline.current = structuredClone(project);
    if (project.step === "motions" && previousStep !== "motions") {
      const frame = Math.max(
        0,
        Math.min(project.frames.length - 1, currentFrame),
      );
      setMotionStart(frame);
      setMotionEnd(frame);
      setMotionSelectionMode("end");
      setMotionPreviewing(false);
      setMotionPreviewedSignature(null);
    }
  }, [project]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      creatorRootRef.current
        ?.closest<HTMLElement>(".app-main__viewport")
        ?.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [project.step]);

  useEffect(() => {
    if (!confirmAction) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmAction(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmAction]);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    if (!motionPreviewing || project.step !== "motions") return;
    const sequence = motionPreviewFrames(
      project.frames,
      motionStart,
      motionEnd,
      motionDraftPlayback,
    );
    if (sequence.length < 2) return;
    const signature = motionRangeSignature(
      motionStart,
      motionEnd,
      motionDraftPlayback,
      project.frames,
    );
    let cursor = Math.max(0, sequence.indexOf(currentFrame));
    const interval = window.setInterval(
      () => {
        cursor += 1;
        if (cursor >= sequence.length) {
          cursor = 0;
          setMotionPreviewedSignature(signature);
        }
        setCurrentFrame(sequence[cursor]!);
      },
      Math.max(42, Math.round(1000 / project.preview.frameRate)),
    );
    return () => window.clearInterval(interval);
  }, [
    motionEnd,
    motionDraftPlayback,
    motionPreviewing,
    motionStart,
    project.preview.frameRate,
    project.frames,
    project.step,
  ]);

  useEffect(() => {
    sourceFramesRef.current = sourceFrames;
  }, [sourceFrames]);

  useEffect(() => {
    if (!initialProject?.source?.files.some((file) => file.storedPath)) return;
    let active = true;
    const controller = new AbortController();
    restoreAbortRef.current = controller;
    let sourceOutput: ExtractedFrame[] = [];
    let output: ExtractedFrame[] = [];
    const generatedOutput: ExtractedFrame[] = [];
    let committed = false;
    const setRunningRestore = (
      stage: DraftRestoreStage,
      completed: number,
      total: number,
    ) => {
      if (!active || controller.signal.aborted) return;
      const safeTotal = Math.max(1, total);
      setRestoreState({
        status: "running",
        stage,
        completed,
        total: safeTotal,
        progress: Math.min(1, Math.max(0, completed / safeTotal)),
        cancelling: false,
      });
    };
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const descriptors = initialProject.source!.files;
        const restored: File[] = [];
        setRunningRestore("sources", 0, descriptors.length);
        for (const [index, descriptor] of descriptors.entries()) {
          throwIfRestoreCancelled(controller.signal);
          if (!descriptor.storedPath) {
            throw new Error(
              "One or more source files are missing from this draft",
            );
          }
          const blob = await loadCompanionProjectSource(
            initialProject.id,
            descriptor.storedPath,
          );
          throwIfRestoreCancelled(controller.signal);
          if (!blob) {
            throw new Error(
              "One or more source files are missing from this draft",
            );
          }
          restored.push(
            new File([blob], descriptor.name, {
              type: descriptor.type,
              lastModified: descriptor.lastModified,
            }),
          );
          setRunningRestore("sources", index + 1, descriptors.length);
        }
        const files = restored;
        setRunningRestore("frames", 0, initialProject.frames.length || 1);
        const cached = await restoreCachedFrames(initialProject, {
          signal: controller.signal,
          onProgress: (completed, total) =>
            setRunningRestore("frames", completed, total),
        });
        if (cached) {
          sourceOutput = cached;
        } else {
          sourceOutput = await extractProjectFrames(
            initialProject,
            files,
            (value) =>
              setRunningRestore(
                "frames",
                Math.round(value * Math.max(1, initialProject.frames.length)),
                Math.max(1, initialProject.frames.length),
              ),
          );
          throwIfRestoreCancelled(controller.signal);
          const storedPaths = await cacheCompanionProjectFrames(
            initialProject.id,
            sourceOutput,
          );
          throwIfRestoreCancelled(controller.signal);
          setProject((current) => {
            const next = structuredClone(current);
            next.frames.forEach((frame, index) => {
              frame.storedPath = storedPaths[index];
            });
            next.updatedAt = new Date().toISOString();
            return next;
          });
        }
        output = sourceOutput;
        if (
          initialProject.cleanup.mode !== "preserve-alpha" ||
          initialProject.cleanup.cornerMasks.length > 0 ||
          initialProject.cleanup.strokes.length > 0
        ) {
          setRunningRestore("cleanup", 0, sourceOutput.length);
          output = await restoreFramesSequentially(
            sourceOutput,
            async (frame) => {
              const cleaned = await cleanFrame(frame, initialProject.cleanup);
              generatedOutput.push(cleaned);
              return cleaned;
            },
            {
              signal: controller.signal,
              onProgress: (completed, total) =>
                setRunningRestore("cleanup", completed, total),
            },
          );
        }
        throwIfRestoreCancelled(controller.signal);
        if (!active) {
          for (const url of new Set(
            [...sourceOutput, ...output, ...generatedOutput].map(
              (frame) => frame.url,
            ),
          )) {
            URL.revokeObjectURL(url);
          }
          return;
        }
        setSourceFiles(files);
        setSourceFrames(
          sourceOutput.map((frame) => ({
            ...frame,
            url: URL.createObjectURL(frame.blob),
          })),
        );
        setFrames(output);
        setCleanupAppliedSignature(
          cleanupSettingsSignature(initialProject.cleanup),
        );
        setCleanupAppliedSettings(structuredClone(initialProject.cleanup));
        const retainedUrls = new Set(output.map((frame) => frame.url));
        for (const frame of sourceOutput) {
          if (!retainedUrls.has(frame.url)) URL.revokeObjectURL(frame.url);
        }
        committed = true;
        setRestoreState(null);
      } catch (reason) {
        if (active) {
          setRestoreState(
            isCompanionRestoreCancelled(reason)
              ? { status: "cancelled" }
              : {
                  status: "error",
                  message:
                    reason instanceof Error ? reason.message : String(reason),
                },
          );
        }
      } finally {
        if (!committed) {
          for (const url of new Set(
            [...sourceOutput, ...output, ...generatedOutput].map(
              (frame) => frame.url,
            ),
          )) {
            URL.revokeObjectURL(url);
          }
        }
        if (active) {
          setBusy(false);
          if (restoreAbortRef.current === controller) {
            restoreAbortRef.current = null;
          }
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [initialProject, restoreAttempt]);

  useEffect(
    () => () => {
      for (const frame of framesRef.current) URL.revokeObjectURL(frame.url);
      for (const frame of sourceFramesRef.current)
        URL.revokeObjectURL(frame.url);
      if (cleanupPreviewRef.current)
        URL.revokeObjectURL(cleanupPreviewRef.current.url);
    },
    [],
  );

  const activeLogical = project.frames[currentFrame];
  const activeFrame = activeLogical
    ? frames.find((frame) => frame.sourceIndex === activeLogical.sourceIndex)
    : undefined;
  const activeSourceFrame = activeLogical
    ? sourceFrames.find(
        (frame) => frame.sourceIndex === activeLogical.sourceIndex,
      )
    : undefined;
  const alignmentDiagnostics = useMemo(
    () =>
      diagnoseSharedAlignment(
        project.frames,
        project.sharedCrop,
        project.groundLine,
        project.contentScale,
      ),
    [
      project.contentScale,
      project.frames,
      project.groundLine,
      project.sharedCrop,
    ],
  );
  const activeAlignmentDiagnostic = alignmentDiagnostics.frames.find(
    (diagnostic) => diagnostic.frameIndex === currentFrame,
  );
  const alignmentOverlayFrames = useMemo(() => {
    const included = project.frames
      .map((logical, index) => ({
        logical,
        index,
        frame: frames.find((item) => item.sourceIndex === logical.sourceIndex),
      }))
      .filter(
        (
          item,
        ): item is {
          logical: (typeof project.frames)[number];
          index: number;
          frame: ExtractedFrame;
        } => !item.logical.excluded && Boolean(item.frame),
      );
    if (included.length <= 9) return included;
    const sampled = new Map<number, (typeof included)[number]>();
    for (let sample = 0; sample < 9; sample += 1) {
      const index = Math.round((sample / 8) * (included.length - 1));
      sampled.set(included[index]!.index, included[index]!);
    }
    const current = included.find((item) => item.index === currentFrame);
    if (current) sampled.set(current.index, current);
    return [...sampled.values()].sort(
      (left, right) => left.index - right.index,
    );
  }, [currentFrame, frames, project.frames]);
  const alignmentCanvas = useMemo(
    () => sharedCanvasDimensions(frames),
    [frames],
  );
  const fittedContentScale = useMemo(
    () =>
      fitSharedContentScale(
        project.frames,
        project.sharedCrop,
        project.groundLine,
      ),
    [project.frames, project.groundLine, project.sharedCrop],
  );
  const expandedAlignmentCanvas = useMemo(
    () =>
      expandSharedCanvasToContent(
        project.frames,
        project.sharedCrop,
        project.groundLine,
        project.contentScale,
        alignmentCanvas,
      ),
    [
      alignmentCanvas,
      project.contentScale,
      project.frames,
      project.groundLine,
      project.sharedCrop,
    ],
  );

  useEffect(() => {
    if (project.step !== "cleanup" || !activeSourceFrame) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      void cleanFrame(activeSourceFrame, project.cleanup)
        .then((preview) => {
          if (!active) {
            if (preview !== activeSourceFrame) URL.revokeObjectURL(preview.url);
            return;
          }
          const previous = cleanupPreviewRef.current;
          const next = preview === activeSourceFrame ? undefined : preview;
          cleanupPreviewRef.current = next;
          setCleanupPreviewFrame(next);
          if (previous && previous.url !== next?.url)
            URL.revokeObjectURL(previous.url);
        })
        .catch((reason) => {
          if (active)
            setError(reason instanceof Error ? reason.message : String(reason));
        });
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [activeSourceFrame, project.cleanup, project.step]);
  const calibration = useMemo(
    () => calibrateDirections(project.frames, project.directionAnchors),
    [project.frames, project.directionAnchors],
  );
  const outputSummary = useMemo(
    () => summarizeCompanionOutput(project, calibration),
    [calibration, project],
  );
  const currentDirectionAnchor = project.directionAnchors.find(
    (anchor) => anchor.frameIndex === currentFrame,
  );
  const conflictingDirectionAnchor = project.directionAnchors.find(
    (anchor) =>
      anchor.frameIndex !== currentFrame &&
      Math.abs(normalizeAngle(anchor.angle) - normalizeAngle(angle)) < 0.001,
  );
  useEffect(() => {
    if (project.step === "calibrate" && currentDirectionAnchor) {
      setAngle(currentDirectionAnchor.angle);
    }
  }, [currentDirectionAnchor?.angle, currentDirectionAnchor?.id, project.step]);
  const previewFrameIndex = useMemo(() => {
    const pointerAngle = normalizeAngle(
      (Math.atan2(pointer.x - 50, 50 - pointer.y) * 180) / Math.PI,
    );
    return nearestDirectionFrame(
      calibration.frameAngles,
      pointerAngle,
      project.neutralFrame,
    );
  }, [calibration.frameAngles, pointer, project.neutralFrame]);
  const motionDiagnostics = useMemo(
    () => diagnoseMotionRange(project, motionStart, motionEnd),
    [motionEnd, motionStart, project],
  );
  const motionDraftSignature = useMemo(
    () =>
      motionRangeSignature(
        motionStart,
        motionEnd,
        motionDraftPlayback,
        project.frames,
      ),
    [motionDraftPlayback, motionEnd, motionStart, project.frames],
  );
  const motionRangeReviewed = motionPreviewedSignature === motionDraftSignature;
  const motionCanSave =
    motionDiagnostics.canPreview &&
    motionRangeReviewed &&
    motionDiagnostics.overlappingMotionIds.length === 0 &&
    Boolean(motionDiagnostics.recommendedPoseAnchorId);

  const cleanupSignature = useMemo(
    () => cleanupSettingsSignature(project.cleanup),
    [project.cleanup],
  );
  const cleanupDirty =
    frames.length > 0 && cleanupAppliedSignature !== cleanupSignature;

  const clearDerivedMedia = () => {
    setSourceFiles([]);
    setVideoDurationMs(0);
    setVideoDecodeStatus("idle");
    setAtlasDimensions({ width: 0, height: 0 });
    setCleanupAppliedSignature(null);
    setCurrentFrame(0);
    replaceFrames([]);
    replaceSourceFrames([]);
  };

  const applySourceKind = (kind: CompanionImportKind | null) => {
    setProject((current) => {
      const next = structuredClone(current);
      next.source = kind ? sourceDescriptor(kind, []) : null;
      resetCompanionProjectDerivedState(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setPast([]);
    setFuture([]);
    clearDerivedMedia();
    const defaults = createCompanionProject(project.id).cleanup;
    setCleanupAppliedSettings(structuredClone(defaults));
    setFurthestStepIndex(0);
  };

  const chooseKind = (kind: CompanionImportKind) => {
    if (project.source?.kind === kind) return;
    if (project.source?.files.length || frames.length > 0) {
      setConfirmAction({ kind: "change-source", sourceKind: kind });
      return;
    }
    applySourceKind(kind);
  };

  const useAutomaticSourceDetection = () => {
    if (
      !project.source ||
      project.source.files.length > 0 ||
      frames.length > 0
    ) {
      return;
    }
    applySourceKind(null);
  };

  const replaceFrames = (nextFrames: ExtractedFrame[]) => {
    setFrames((current) => {
      const retained = new Set(nextFrames.map((frame) => frame.url));
      const stale = current.filter((frame) => !retained.has(frame.url));
      window.setTimeout(() => {
        for (const frame of stale) URL.revokeObjectURL(frame.url);
      });
      return nextFrames;
    });
  };

  const replaceSourceFrames = (nextFrames: ExtractedFrame[]) => {
    setSourceFrames((current) => {
      for (const frame of current) URL.revokeObjectURL(frame.url);
      return nextFrames.map((frame) => ({
        ...frame,
        url: URL.createObjectURL(frame.blob),
      }));
    });
  };

  const commitSourceFiles = async (
    kind: CompanionImportKind,
    selected: File[],
  ) => {
    setError(null);
    setBusy(true);
    try {
      const next = structuredClone(project);
      next.source = sourceDescriptor(kind, selected);
      next.name = suggestedCompanionName(selected[0]!.name);
      resetCompanionProjectDerivedState(next);
      setProject(await saveCompanionProject(next, selected));
      hasPersistedDraftRef.current = true;
      setSourceFiles(selected);
      setVideoDurationMs(0);
      setVideoDecodeStatus(kind === "video" ? "loading" : "idle");
      setAtlasDimensions({ width: 0, height: 0 });
      setCleanupAppliedSignature(null);
      setCleanupAppliedSettings(
        structuredClone(createCompanionProject(project.id).cleanup),
      );
      setCurrentFrame(0);
      replaceFrames([]);
      replaceSourceFrames([]);
      setFurthestStepIndex(0);
      setPast([]);
      setFuture([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const importSourceFiles = async (incoming: File[]) => {
    setError(null);
    try {
      const { kind, files: selected } = validateCreatorSourceFiles(
        incoming,
        project.source?.kind,
      );
      if (project.source?.files.length || frames.length > 0) {
        setConfirmAction({
          kind: "replace-source",
          sourceKind: kind,
          files: selected,
        });
        return;
      }
      await commitSourceFiles(kind, selected);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  nativeDropImportRef.current = importSourceFiles;

  const setVideoRange = (range: { startMs: number; endMs: number }) => {
    updateProject((next) => {
      if (next.source?.kind !== "video") return next;
      const duration = videoDurationMs || Number.POSITIVE_INFINITY;
      const startMs = Math.max(0, Math.min(range.startMs, duration - 100));
      let endMs = Math.min(range.endMs, duration, startMs + 30_000);
      if (endMs <= startMs) endMs = Math.min(duration, startMs + 1_000);
      next.source.videoRange = { startMs, endMs };
      return next;
    });
  };

  const setVideoRangeStart = (startMs: number) => {
    const current = project.source?.videoRange ?? {
      startMs: 0,
      endMs: Math.min(30_000, videoDurationMs || 30_000),
    };
    const duration = videoDurationMs || Number.POSITIVE_INFINITY;
    const normalizedStart = Math.max(0, Math.min(startMs, duration - 100));
    const endMs =
      normalizedStart >= current.endMs
        ? Math.min(duration, normalizedStart + 30_000)
        : Math.min(current.endMs, normalizedStart + 30_000);
    setVideoRange({ startMs: normalizedStart, endMs });
  };

  const setVideoRangeEnd = (endMs: number) => {
    const current = project.source?.videoRange ?? {
      startMs: 0,
      endMs: Math.min(30_000, videoDurationMs || 30_000),
    };
    setVideoRange({
      startMs: Math.max(0, Math.min(current.startMs, endMs - 100)),
      endMs,
    });
  };

  const syncVideoDuration = (durationMs: number) => {
    setVideoDurationMs(durationMs);
    setVideoDecodeStatus("ready");
    setProject((current) => {
      if (current.source?.kind !== "video") return current;
      const range = current.source.videoRange ?? {
        startMs: 0,
        endMs: 30_000,
      };
      const maximumEnd = Math.min(durationMs, range.startMs + 30_000);
      const nextRange = {
        startMs: Math.min(range.startMs, Math.max(0, durationMs - 100)),
        endMs: Math.min(range.endMs, maximumEnd),
      };
      if (nextRange.endMs <= nextRange.startMs) {
        nextRange.endMs = Math.min(durationMs, nextRange.startMs + 1_000);
      }
      if (
        nextRange.startMs === range.startMs &&
        nextRange.endMs === range.endMs
      ) {
        return current;
      }
      const next = structuredClone(current);
      next.source!.videoRange = nextRange;
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    await importSourceFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  };

  const onDragEnter = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const onDragOver = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };

  const onDrop = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    void importSourceFiles([...event.dataTransfer.files]);
  };

  useEffect(() => {
    if (project.step !== "import" || !("__TAURI_INTERNALS__" in window)) {
      return;
    }
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void (async () => {
      const currentWindow = getCurrentWindow();
      unlisten = await currentWindow.onDragDropEvent(({ payload }) => {
        if (disposed) return;
        if (nativeDragResetRef.current !== null) {
          window.clearTimeout(nativeDragResetRef.current);
          nativeDragResetRef.current = null;
        }
        if (payload.type === "leave") {
          setDragActive(false);
          return;
        }
        setDragActive(payload.type !== "drop");
        if (payload.type !== "drop") {
          nativeDragResetRef.current = window.setTimeout(
            () => setDragActive(false),
            1_200,
          );
          return;
        }
        setDragActive(false);
        void filesFromDroppedPaths(payload.paths)
          .then((files) => nativeDropImportRef.current(files))
          .catch((reason) =>
            setError(reason instanceof Error ? reason.message : String(reason)),
          );
      });
    })();
    return () => {
      disposed = true;
      unlisten?.();
      if (nativeDragResetRef.current !== null) {
        window.clearTimeout(nativeDragResetRef.current);
        nativeDragResetRef.current = null;
      }
      setDragActive(false);
    };
  }, [project.step]);

  const processSource = async () => {
    if (!project.source || sourceFiles.length === 0) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const output = await extractProjectFrames(
        project,
        sourceFiles,
        setProgress,
      );
      const bounds = await Promise.all(output.map(alphaBounds));
      const visualDeltas = await measureVisualDeltas(output);
      const storedPaths = await cacheCompanionProjectFrames(project.id, output);
      const logical = output.map((frame, index) => ({
        id: frame.id,
        sourceIndex: frame.sourceIndex,
        sourceTimeMs: frame.sourceTimeMs,
        storedPath: storedPaths[index],
        excluded: false,
        visualDelta: visualDeltas[index] ?? 1,
        baselineOffset: { x: 0, y: 0 },
        subjectBounds: bounds[index] ?? undefined,
      }));
      replaceSourceFrames(output);
      replaceFrames(output);
      const appliedCleanup = cleanupIsNoop(project.cleanup)
        ? structuredClone(project.cleanup)
        : structuredClone(createCompanionProject(project.id).cleanup);
      setCleanupAppliedSettings(appliedCleanup);
      setCleanupAppliedSignature(cleanupSettingsSignature(appliedCleanup));
      setCurrentFrame(0);
      setMotionEnd(Math.max(0, logical.length - 1));
      setCalibrationEnd(Math.max(0, logical.length - 1));
      setProject((current) => {
        const next = structuredClone(current);
        next.frames = logical;
        if (!applySuggestedSharedAlignment(next, output)) {
          next.sharedCrop = commonSubjectCrop(logical, 8) ?? {
            x: 0,
            y: 0,
            width: output[0]?.width ?? 1,
            height: output[0]?.height ?? 1,
          };
          next.groundLine = next.sharedCrop.y + next.sharedCrop.height;
        }
        // Direction cannot be inferred safely from frame order. Users assign
        // visual keyframes explicitly in the calibration workspace.
        next.directionAnchors = [];
        next.neutralFrame = 0;
        next.reducedMotionFrame = 0;
        next.step = "cleanup";
        next.updatedAt = new Date().toISOString();
        return next;
      });
      setPast([]);
      setFuture([]);
      setFurthestStepIndex((value) => Math.max(value, 2));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const processCleanup = async (): Promise<boolean> => {
    const source = sourceFrames.length > 0 ? sourceFrames : frames;
    if (source.length === 0) return false;
    setBusy(true);
    setError(null);
    setProgress(0);
    const appliedSignature = cleanupSignature;
    try {
      const cleaned: ExtractedFrame[] = [];
      for (const [index, frame] of source.entries()) {
        const output = await cleanFrame(frame, project.cleanup);
        cleaned.push(
          output === frame
            ? { ...frame, url: URL.createObjectURL(frame.blob) }
            : output,
        );
        setProgress((index + 1) / source.length);
      }
      const bounds = await Promise.all(cleaned.map(alphaBounds));
      replaceFrames(cleaned);
      setProject((current) => {
        const next = structuredClone(current);
        next.frames.forEach((frame, index) => {
          frame.subjectBounds = bounds[index] ?? undefined;
        });
        if (!applySuggestedSharedAlignment(next, cleaned)) {
          next.sharedCrop =
            commonSubjectCrop(next.frames, 8) ?? next.sharedCrop;
        }
        next.updatedAt = new Date().toISOString();
        return next;
      });
      setPast([]);
      setFuture([]);
      setCleanupAppliedSignature(appliedSignature);
      setCleanupAppliedSettings(structuredClone(project.cleanup));
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const discardCleanupChanges = () => {
    const applied = structuredClone(cleanupAppliedSettings);
    setSamplingColor(false);
    updateProject((next) => {
      next.cleanup = applied;
      return next;
    });
    setCleanupAppliedSignature(cleanupSettingsSignature(applied));
  };

  const setStep = (step: CreatorStep) => {
    if (step !== "motions") setMotionPreviewing(false);
    setFurthestStepIndex((value) => Math.max(value, stepOrder.indexOf(step)));
    updateProject((next) => {
      next.step = step;
      return next;
    });
  };

  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((items) => [project, ...items].slice(0, 50));
    setPast((items) => items.slice(0, -1));
    setProject(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, project].slice(-50));
    setFuture((items) => items.slice(1));
    setProject(next);
  };

  const setAnchorAt = (direction: number) => {
    const normalized = normalizeAngle(direction);
    setAngle(normalized);
    updateProject((next) => {
      next.directionAnchors = next.directionAnchors.filter(
        (anchor) =>
          anchor.frameIndex === currentFrame ||
          Math.abs(anchor.angle - normalized) > 0.001,
      );
      const existing = next.directionAnchors.find(
        (anchor) => anchor.frameIndex === currentFrame,
      );
      if (existing) existing.angle = normalized;
      else
        next.directionAnchors.push({
          id: crypto.randomUUID(),
          frameIndex: currentFrame,
          angle: normalized,
        });
      next.directionAnchors.sort(
        (left, right) => left.frameIndex - right.frameIndex,
      );
      return next;
    });
  };

  const setAnchor = () => setAnchorAt(angle);

  const selectCalibrationFrame = (index: number) => {
    const nextIndex = Math.max(0, Math.min(project.frames.length - 1, index));
    setCurrentFrame(nextIndex);
    const anchor = project.directionAnchors.find(
      (item) => item.frameIndex === nextIndex,
    );
    if (anchor) setAngle(anchor.angle);
  };

  const invalidateMotionPreview = () => {
    setMotionPreviewing(false);
    setMotionPreviewedSignature(null);
  };

  const setMotionBoundary = (boundary: "start" | "end", index: number) => {
    const value = Math.max(0, Math.min(project.frames.length - 1, index));
    invalidateMotionPreview();
    setCurrentFrame(value);
    if (boundary === "start") {
      setMotionStart(value);
      if (value > motionEnd) setMotionEnd(value);
      return;
    }
    setMotionEnd(value);
    if (value < motionStart) setMotionStart(value);
  };

  const selectMotionFrame = (index: number) => {
    if (motionSelectionMode === "start") {
      setMotionBoundary("start", index);
      setMotionSelectionMode("end");
      return;
    }
    if (motionSelectionMode === "end") {
      setMotionBoundary("end", index);
      setMotionSelectionMode("inspect");
      return;
    }
    setMotionPreviewing(false);
    setCurrentFrame(index);
  };

  const removeCurrentAnchor = () => {
    updateProject((next) => {
      next.directionAnchors = next.directionAnchors.filter(
        (anchor) => anchor.frameIndex !== currentFrame,
      );
      return next;
    });
  };

  const excludeCalibrationRange = () => {
    const start = Math.min(calibrationStart, calibrationEnd);
    const end = Math.max(calibrationStart, calibrationEnd);
    updateProject((next) => {
      for (let index = start; index <= end; index += 1) {
        if (next.frames[index]) next.frames[index]!.excluded = true;
      }
      next.directionAnchors = next.directionAnchors.filter(
        (anchor) => anchor.frameIndex < start || anchor.frameIndex > end,
      );
      return next;
    });
  };

  const reverseCalibrationRange = () => {
    const start = Math.min(calibrationStart, calibrationEnd);
    const end = Math.max(calibrationStart, calibrationEnd);
    if (end <= start) return;
    updateProject((next) => {
      const anchorFrames = new Map(
        next.directionAnchors.map((anchor) => [
          anchor.id,
          next.frames[anchor.frameIndex]?.id,
        ]),
      );
      const motionFrames = new Map(
        next.motionRanges.map((motion) => [
          motion.id,
          {
            start: next.frames[motion.startFrame]?.id,
            end: next.frames[motion.endFrame]?.id,
          },
        ]),
      );
      const neutralId = next.frames[next.neutralFrame]?.id;
      const reducedId = next.frames[next.reducedMotionFrame]?.id;
      next.frames.splice(
        start,
        end - start + 1,
        ...next.frames.slice(start, end + 1).reverse(),
      );
      for (const anchor of next.directionAnchors) {
        const frameId = anchorFrames.get(anchor.id);
        const index = next.frames.findIndex((frame) => frame.id === frameId);
        if (index >= 0) anchor.frameIndex = index;
      }
      next.directionAnchors.sort(
        (left, right) => left.frameIndex - right.frameIndex,
      );
      for (const motion of next.motionRanges) {
        const ids = motionFrames.get(motion.id);
        if (!ids) continue;
        const first = next.frames.findIndex((frame) => frame.id === ids.start);
        const last = next.frames.findIndex((frame) => frame.id === ids.end);
        if (first >= 0 && last >= 0) {
          motion.startFrame = Math.min(first, last);
          motion.endFrame = Math.max(first, last);
        }
      }
      const neutral = next.frames.findIndex((frame) => frame.id === neutralId);
      const reduced = next.frames.findIndex((frame) => frame.id === reducedId);
      if (neutral >= 0) next.neutralFrame = neutral;
      if (reduced >= 0) next.reducedMotionFrame = reduced;
      return next;
    });
  };

  const addCleanupStroke = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return;
    updateProject((next) => {
      next.cleanup.strokes.push({
        frame: brushScope === "all" ? "all" : (activeLogical?.sourceIndex ?? 0),
        mode: brushMode,
        points,
        radius: brushSize,
      });
      return next;
    });
  };

  const pickCleanupColor = async (point: { x: number; y: number }) => {
    const source = activeSourceFrame ?? activeFrame;
    if (!source) return;
    try {
      const sampledColor = await sampleFrameColor(source, point);
      updateProject((next) => {
        next.cleanup.mode = "sampled-color";
        next.cleanup.sampledColor = sampledColor;
        return next;
      });
    } finally {
      setSamplingColor(false);
    }
  };

  const metadataValid =
    project.name.trim().length > 0 &&
    project.name.trim().length <= 64 &&
    project.description.trim().length > 0 &&
    project.description.trim().length <= 240 &&
    project.author.trim().length > 0 &&
    project.author.trim().length <= 80 &&
    project.license.trim().length > 0;

  const save = async () => {
    if (!metadataValid) {
      setError(c.fixMetadata);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await compileCompanion(project, frames);
      await onSaved(result.companion, result.files);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const leaveCreator = async () => {
    if (exiting || busy) return;
    setExiting(true);
    setAutosaveStatus("saving");
    try {
      const latest = latestProjectRef.current;
      const shouldPersist =
        hasPersistedDraftRef.current || !companionProjectIsPristine(latest);
      if (shouldPersist) {
        await saveCompanionProject(latest);
        hasPersistedDraftRef.current = true;
      }
      autosavePendingRef.current = false;
      autosaveRevisionRef.current += 1;
      setLastSavedAt(new Date());
      setAutosaveStatus("saved");
      onBack();
    } catch (reason) {
      setAutosaveStatus("error");
      setError(reason instanceof Error ? reason.message : String(reason));
      setExiting(false);
    }
  };

  const stepIndex = stepOrder.indexOf(project.step);
  const directionSetupValid = frames.length === 1 || calibration.ready;
  const includedFrameCount = project.frames.filter(
    (frame) => !frame.excluded,
  ).length;
  const readinessCount =
    Number(metadataValid) +
    Number(includedFrameCount > 0) +
    Number(alignmentDiagnostics.ready) +
    Number(directionSetupValid) +
    Number(outputSummary.withinLimits);
  const buildReady =
    metadataValid &&
    includedFrameCount > 0 &&
    alignmentDiagnostics.ready &&
    directionSetupValid &&
    outputSummary.withinLimits;
  const stepHasChanges =
    projectStateSignature(project) !==
    projectStateSignature(stepBaseline.current);
  const projectHasContent = !companionProjectIsPristine(project);
  const canContinue =
    project.step === "import"
      ? Boolean(project.source?.files.length)
      : project.step === "align"
        ? alignmentDiagnostics.ready
        : project.step === "calibrate"
          ? directionSetupValid
          : frames.length > 0;
  const stepComplete: Record<CreatorStep, boolean> = {
    import: furthestStepIndex > 0 && Boolean(project.source?.files.length),
    extract: furthestStepIndex > 1 && frames.length > 0,
    cleanup: furthestStepIndex > 2 && frames.length > 0 && !cleanupDirty,
    align: furthestStepIndex > 3 && !cleanupDirty && alignmentDiagnostics.ready,
    calibrate: furthestStepIndex > 4 && !cleanupDirty && directionSetupValid,
    motions: furthestStepIndex > 5 && !cleanupDirty,
    test: false,
  };
  const motionStepSkipped =
    frames.length === 1 &&
    furthestStepIndex > stepOrder.indexOf("motions") &&
    project.motionRanges.length === 0;
  const nextStep =
    frames.length === 1 && project.step === "calibrate"
      ? "test"
      : stepOrder[stepIndex + 1];
  const previousStep =
    frames.length === 1 && project.step === "test"
      ? "calibrate"
      : stepOrder[stepIndex - 1];
  const estimatedVideoFrames =
    project.source?.kind === "video" && videoDecodeStatus === "ready"
      ? Math.min(
          512,
          Math.max(
            1,
            Math.ceil(
              (((project.source.videoRange?.endMs ?? 30_000) -
                (project.source.videoRange?.startMs ?? 0)) /
                1000) *
                (project.source.extractionFps ?? 12),
            ),
          ),
        )
      : null;

  const stepPrerequisiteMet = (target: CreatorStep) => {
    switch (target) {
      case "import":
        return true;
      case "extract":
        return Boolean(project.source?.files.length);
      case "cleanup":
        return frames.length > 0;
      case "align":
        return frames.length > 0;
      case "calibrate":
        return alignmentDiagnostics.ready;
      case "motions":
      case "test":
        return directionSetupValid;
    }
  };

  const canOpenStep = (target: CreatorStep) => {
    const targetIndex = stepOrder.indexOf(target);
    if (busy || targetIndex < 0 || !stepPrerequisiteMet(target)) return false;
    const skipsStaticMotion =
      frames.length === 1 && project.step === "calibrate" && target === "test";
    return (
      targetIndex <= furthestStepIndex ||
      targetIndex === stepIndex + 1 ||
      skipsStaticMotion
    );
  };

  const navigateToStep = async (target: CreatorStep) => {
    const targetIndex = stepOrder.indexOf(target);
    if (!canOpenStep(target)) return;
    if (targetIndex === stepIndex + 1 && !canContinue) return;
    if (targetIndex > stepOrder.indexOf("cleanup") && cleanupDirty) {
      const applied = await processCleanup();
      if (!applied) return;
    }
    setStep(target);
  };

  const focusFirstInvalidMetadata = () => {
    const fieldId =
      project.name.trim().length === 0 || project.name.trim().length > 64
        ? "companion-name"
        : project.description.trim().length === 0 ||
            project.description.trim().length > 240
          ? "companion-description"
          : project.author.trim().length === 0 ||
              project.author.trim().length > 80
            ? "companion-author"
            : "companion-license";
    setError(null);
    window.requestAnimationFrame(() => {
      const field = document.getElementById(fieldId);
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      field?.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
      field?.focus({ preventScroll: true });
    });
  };

  const resolveFirstReadinessIssue = () => {
    if (!metadataValid) {
      focusFirstInvalidMetadata();
      return;
    }
    if (includedFrameCount === 0) {
      void navigateToStep("cleanup");
      return;
    }
    if (!alignmentDiagnostics.ready) {
      void navigateToStep("align");
      return;
    }
    if (!directionSetupValid) {
      void navigateToStep("calibrate");
      return;
    }
    if (!outputSummary.withinLimits) {
      const target: CreatorStep =
        outputSummary.issue === "frame-limit" ? "extract" : "align";
      void navigateToStep(target);
    }
  };

  const readinessAction = !metadataValid
    ? { title: c.reviewMetadata, detail: c.fixMetadata }
    : includedFrameCount === 0
      ? { title: c.reviewFrames, detail: c.outputIssue["missing-frames"] }
      : !alignmentDiagnostics.ready
        ? {
            title: locale === "zh-CN" ? "检查画布" : "Review canvas",
            detail:
              locale === "zh-CN"
                ? "确保所有有效帧都位于共享画布内并对齐地面线。"
                : "Keep every included frame inside the shared canvas and on the ground line.",
          }
        : !directionSetupValid
          ? { title: c.reviewDirections, detail: c.reviewIssue }
          : !outputSummary.withinLimits && outputSummary.issue
            ? {
                title: c.reviewOutput,
                detail: c.outputIssue[outputSummary.issue],
              }
            : null;

  const resetCurrentStep = () => {
    const baseline = structuredClone(stepBaseline.current);
    setPast([]);
    setFuture([]);
    setProject(baseline);
    if (project.step === "import" && !baseline.source?.files.length) {
      clearDerivedMedia();
      setFurthestStepIndex(0);
    }
    if (project.step === "cleanup") {
      setCleanupAppliedSettings(structuredClone(baseline.cleanup));
      setCleanupAppliedSignature(cleanupSettingsSignature(baseline.cleanup));
      if (cleanupIsNoop(baseline.cleanup) && sourceFrames.length > 0) {
        replaceFrames(
          sourceFrames.map((frame) => ({
            ...frame,
            url: URL.createObjectURL(frame.blob),
          })),
        );
      }
    }
  };

  const resetProject = () => {
    // Reset the current draft in place so the library does not accumulate an
    // orphaned project every time a creator starts over.
    const next = createCompanionProject(project.id);
    setPast([]);
    setFuture([]);
    setProject(next);
    setCleanupAppliedSettings(structuredClone(next.cleanup));
    stepBaseline.current = structuredClone(next);
    activeStepRef.current = next.step;
    clearDerivedMedia();
    setFurthestStepIndex(0);
    setConfirmAction(null);
  };

  const confirmCreatorAction = () => {
    const action = confirmAction;
    if (!action) return;
    if (action.kind === "reset-project") {
      resetProject();
      return;
    }
    if (action.kind === "replace-source") {
      setConfirmAction(null);
      void commitSourceFiles(action.sourceKind, action.files);
      return;
    }
    if (action.kind === "change-source") {
      applySourceKind(action.sourceKind);
    } else {
      applySourceKind(project.source?.kind ?? "image");
    }
    setConfirmAction(null);
  };

  const confirmTitle =
    confirmAction?.kind === "reset-project"
      ? c.resetProjectTitle
      : confirmAction?.kind === "replace-source"
        ? c.replaceSourceTitle
        : confirmAction?.kind === "remove-source"
          ? c.removeSourceTitle
          : c.changeSourceTitle;
  const confirmBody =
    confirmAction?.kind === "reset-project"
      ? c.resetProjectBody
      : confirmAction?.kind === "replace-source"
        ? c.replaceSourceBody
        : confirmAction?.kind === "remove-source"
          ? c.removeSourceBody
          : c.changeSourceBody;
  const confirmLabel =
    confirmAction?.kind === "reset-project"
      ? c.confirmReset
      : confirmAction?.kind === "replace-source"
        ? c.confirmReplace
        : confirmAction?.kind === "remove-source"
          ? c.confirmRemove
          : c.confirmChange;

  const cancelDraftRestore = () => {
    setRestoreState((current) =>
      current?.status === "running"
        ? { ...current, cancelling: true }
        : current,
    );
    restoreAbortRef.current?.abort();
  };

  const retryDraftRestore = () => {
    setRestoreState({
      status: "running",
      stage: "sources",
      completed: 0,
      total: initialProject?.source?.files.length ?? 1,
      progress: 0,
      cancelling: false,
    });
    setRestoreAttempt((value) => value + 1);
  };

  const restoreStageLabel =
    restoreState?.status === "running"
      ? restoreState.stage === "sources"
        ? c.restoreStageSources
        : restoreState.stage === "frames"
          ? c.restoreStageFrames
          : c.restoreStageCleanup
      : null;

  return (
    <div ref={creatorRootRef} className="companion-creator page">
      <header className="creator-header">
        <button
          className="button button--ghost"
          onClick={() => void leaveCreator()}
          disabled={exiting || busy}
        >
          <ArrowLeft size={16} /> {c.back}
        </button>
        <div>
          <span className="page-kicker">LOCAL · DATA-ONLY · REVERSIBLE</span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
        <div className="creator-history">
          <button
            className="icon-button"
            onClick={undo}
            disabled={past.length === 0}
            aria-label={c.undo}
            title={c.undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-button"
            onClick={redo}
            disabled={future.length === 0}
            aria-label={c.redo}
            title={c.redo}
          >
            <Redo2 size={16} />
          </button>
          <button
            className="button button--ghost"
            onClick={resetCurrentStep}
            disabled={
              !stepHasChanges || busy || exiting || Boolean(restoreState)
            }
            title={c.resetStep}
            aria-label={c.resetStep}
          >
            <Eraser size={15} /> <span>{c.resetStep}</span>
          </button>
          <button
            className="button button--danger-ghost"
            onClick={() => setConfirmAction({ kind: "reset-project" })}
            disabled={
              !projectHasContent || busy || exiting || Boolean(restoreState)
            }
            title={c.resetAll}
            aria-label={c.resetAll}
          >
            <RotateCcw size={15} /> <span>{c.resetAll}</span>
          </button>
        </div>
      </header>

      <nav
        className="creator-steps"
        aria-label={c.title}
        data-scroll-surface="horizontal"
      >
        {stepOrder.map((step, index) => (
          <button
            key={step}
            className={
              project.step === step
                ? "creator-step creator-step--active"
                : step === "motions" && motionStepSkipped
                  ? "creator-step creator-step--skipped"
                  : stepComplete[step]
                    ? "creator-step creator-step--complete"
                    : "creator-step"
            }
            onClick={() => void navigateToStep(step)}
            disabled={Boolean(restoreState) || !canOpenStep(step)}
            aria-current={project.step === step ? "step" : undefined}
            title={
              step === "motions" && motionStepSkipped
                ? `${c.steps[step]} · ${c.optionalSkipped}`
                : c.steps[step]
            }
          >
            <span>
              {step === "motions" && motionStepSkipped ? (
                <Minus size={13} />
              ) : stepComplete[step] && project.step !== step ? (
                <Check size={13} />
              ) : (
                index + 1
              )}
            </span>
            {c.steps[step]}
          </button>
        ))}
      </nav>

      {error && !restoreState && (
        <div className="creator-error" role="alert">
          {error}
        </div>
      )}
      {restoreState && (
        <section
          className={`creator-restore-card creator-restore-card--${restoreState.status}`}
          aria-live="polite"
          aria-busy={restoreState.status === "running"}
        >
          <span className="creator-restore-card__icon">
            {restoreState.status === "running" ? (
              <LoaderCircle className="spin" size={20} />
            ) : restoreState.status === "cancelled" ? (
              <Pause size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </span>
          <div className="creator-restore-card__body">
            <span className="page-kicker">{c.restoringDraft}</span>
            <strong>
              {restoreState.status === "running"
                ? restoreState.cancelling
                  ? c.stoppingRestore
                  : restoreStageLabel
                : restoreState.status === "cancelled"
                  ? c.restoreCancelled
                  : c.restoreFailed}
            </strong>
            {restoreState.status === "running" ? (
              <>
                <div className="creator-restore-card__progress-copy">
                  <span>
                    {restoreState.completed}/{restoreState.total}{" "}
                    {c.restoreProgress}
                  </span>
                  <output>{Math.round(restoreState.progress * 100)}%</output>
                </div>
                <span
                  className="creator-restore-card__progress"
                  aria-hidden="true"
                >
                  <span style={{ width: `${restoreState.progress * 100}%` }} />
                </span>
              </>
            ) : (
              <p>
                {restoreState.status === "cancelled"
                  ? c.restoreCancelledDetail
                  : c.restoreFailedDetail}
              </p>
            )}
            {restoreState.status === "error" && (
              <code>{restoreState.message}</code>
            )}
          </div>
          <div className="creator-restore-card__actions">
            {restoreState.status === "running" ? (
              <button
                className="button button--ghost"
                onClick={cancelDraftRestore}
                disabled={restoreState.cancelling}
              >
                <Pause size={15} />
                {restoreState.cancelling ? c.stoppingRestore : c.stopRestore}
              </button>
            ) : (
              <>
                <button
                  className="button button--ghost"
                  onClick={() => void leaveCreator()}
                >
                  <ArrowLeft size={15} /> {c.back}
                </button>
                <button
                  className="button button--primary"
                  onClick={retryDraftRestore}
                >
                  <RotateCcw size={15} /> {c.retryRestore}
                </button>
              </>
            )}
          </div>
        </section>
      )}
      {busy && !restoreState && (
        <div className="creator-progress" aria-live="polite">
          <LoaderCircle className="spin" size={16} /> {c.processing}
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      <div
        className="creator-workbench"
        data-scroll-surface="workspace"
        hidden={Boolean(restoreState)}
      >
        <main className="creator-stage">
          {project.step === "import" && (
            <ImportStep
              project={project}
              locale={locale}
              copy={c}
              dragActive={dragActive}
              dropzoneRef={dropzoneRef}
              inputRef={inputRef}
              chooseKind={chooseKind}
              onUseAutomaticDetection={useAutomaticSourceDetection}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onFiles={onFiles}
              onRemoveSource={() => setConfirmAction({ kind: "remove-source" })}
            />
          )}

          {project.step === "extract" && (
            <section className="creator-panel creator-panel--editor">
              <div className="creator-panel__intro">
                <Scissors size={20} />
                <div>
                  <h2>{c.steps.extract}</h2>
                  <p>
                    {project.source?.kind === "atlas"
                      ? locale === "zh-CN"
                        ? "设置切割网格；每个单元格都会先在源图上标出，再生成逻辑帧。"
                        : "Define the grid. Every cell is shown before it becomes a logical frame."
                      : locale === "zh-CN"
                        ? "抽帧密度只影响动作与方向细节，不会降低源图分辨率。"
                        : "Frame density controls direction detail, not source resolution."}
                  </p>
                </div>
              </div>
              <div className="creator-editor-grid">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--caption">
                    <span>{project.source?.files[0]?.name ?? c.noSource}</span>
                    <strong>
                      {sourceFiles.length}{" "}
                      {locale === "zh-CN" ? "个文件" : "files"}
                    </strong>
                  </div>
                  {project.source?.kind === "atlas" && project.source.atlas ? (
                    <AtlasGridPreview
                      file={sourceFiles[0]}
                      settings={project.source.atlas}
                      locale={locale}
                      onDimensions={setAtlasDimensions}
                    />
                  ) : (
                    <SourceMediaPreview
                      file={sourceFiles[0]}
                      kind={project.source?.kind}
                      locale={locale}
                      videoRange={project.source?.videoRange}
                      onVideoRangeChange={setVideoRange}
                      onVideoMetadata={syncVideoDuration}
                      onVideoStatus={setVideoDecodeStatus}
                    />
                  )}
                  <p className="creator-canvas-note">
                    {locale === "zh-CN"
                      ? "可随时返回并重新生成；源文件不会写入最终伙伴包。"
                      : "You can return and regenerate at any time. Source files are never included in the final package."}
                  </p>
                </div>
                <aside className="creator-inspector-panel">
                  <section>
                    <h3>
                      {locale === "zh-CN" ? "素材摘要" : "Source summary"}
                    </h3>
                    <dl className="creator-source-summary">
                      <div>
                        <dt>{locale === "zh-CN" ? "类型" : "Type"}</dt>
                        <dd>{project.source ? c[project.source.kind] : "—"}</dd>
                      </div>
                      <div>
                        <dt>{locale === "zh-CN" ? "大小" : "Size"}</dt>
                        <dd>
                          {formatFileSize(
                            sourceFiles.reduce(
                              (total, file) => total + file.size,
                              0,
                            ),
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>
                  {project.source?.kind === "video" && (
                    <section>
                      <h3>
                        {locale === "zh-CN" ? "抽帧范围" : "Extraction range"}
                      </h3>
                      <div className="creator-inspector-fields">
                        <label className="creator-field">
                          <span>
                            {locale === "zh-CN"
                              ? "开始（秒）"
                              : "Start (seconds)"}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={Math.max(0, videoDurationMs / 1000 - 0.1)}
                            step={0.1}
                            disabled={videoDecodeStatus !== "ready"}
                            value={
                              Math.round(
                                ((project.source.videoRange?.startMs ?? 0) /
                                  1000) *
                                  100,
                              ) / 100
                            }
                            onChange={(event) =>
                              setVideoRangeStart(
                                Number(event.target.value) * 1000,
                              )
                            }
                          />
                        </label>
                        <label className="creator-field">
                          <span>
                            {locale === "zh-CN"
                              ? "结束（秒）"
                              : "End (seconds)"}
                          </span>
                          <input
                            type="number"
                            min={0.1}
                            max={videoDurationMs / 1000}
                            step={0.1}
                            disabled={videoDecodeStatus !== "ready"}
                            value={
                              Math.round(
                                ((project.source.videoRange?.endMs ?? 30000) /
                                  1000) *
                                  100,
                              ) / 100
                            }
                            onChange={(event) =>
                              setVideoRangeEnd(
                                Number(event.target.value) * 1000,
                              )
                            }
                          />
                        </label>
                        <label className="creator-control-row">
                          <span>
                            {locale === "zh-CN" ? "每秒抽帧" : "Extraction FPS"}
                          </span>
                          <output>
                            {project.source.extractionFps ?? 12} FPS
                          </output>
                          <input
                            type="range"
                            min={1}
                            max={60}
                            value={project.source.extractionFps ?? 12}
                            onChange={(event) =>
                              updateProject((next) => {
                                next.source!.extractionFps = Number(
                                  event.target.value,
                                );
                                return next;
                              })
                            }
                          />
                        </label>
                        <div className="creator-estimate" aria-live="polite">
                          <Film size={14} />
                          <span>
                            {estimatedVideoFrames === null
                              ? videoDecodeStatus === "unavailable"
                                ? locale === "zh-CN"
                                  ? "无法读取视频时长"
                                  : "Video duration unavailable"
                                : locale === "zh-CN"
                                  ? "正在读取视频时长…"
                                  : "Reading video duration…"
                              : locale === "zh-CN"
                                ? `预计生成 ${estimatedVideoFrames} 帧`
                                : `Estimated output: ${estimatedVideoFrames} frames`}
                          </span>
                          <small>
                            {videoDecodeStatus === "unavailable"
                              ? locale === "zh-CN"
                                ? "请转换为本机可解码的 H.264 MP4 后重试"
                                : "Convert to a locally decodable H.264 MP4 and retry"
                              : locale === "zh-CN"
                                ? "保持源图分辨率"
                                : "Source resolution preserved"}
                          </small>
                        </div>
                      </div>
                    </section>
                  )}
                  {project.source?.kind === "atlas" && project.source.atlas && (
                    <section>
                      <h3>
                        {locale === "zh-CN" ? "切割参数" : "Slice settings"}
                      </h3>
                      <div className="creator-coordinate-grid">
                        {(
                          [
                            "columns",
                            "rows",
                            "cellWidth",
                            "cellHeight",
                            "marginX",
                            "marginY",
                            "gapX",
                            "gapY",
                          ] as const
                        ).map((field) => (
                          <label key={field} className="creator-field">
                            <span>{atlasFieldLabel(field, locale)}</span>
                            <input
                              type="number"
                              min={
                                field.includes("margin") ||
                                field.includes("gap")
                                  ? 0
                                  : 1
                              }
                              value={project.source!.atlas![field]}
                              onChange={(event) =>
                                updateProject((next) => {
                                  next.source!.atlas![field] = Number(
                                    event.target.value,
                                  );
                                  return next;
                                })
                              }
                            />
                          </label>
                        ))}
                        <label className="creator-field">
                          <span>
                            {locale === "zh-CN" ? "读取顺序" : "Read order"}
                          </span>
                          <span className="creator-select-control">
                            <select
                              value={project.source.atlas.order}
                              onChange={(event) =>
                                updateProject((next) => {
                                  next.source!.atlas!.order = event.target
                                    .value as "row-major" | "column-major";
                                  return next;
                                })
                              }
                            >
                              <option value="row-major">
                                {locale === "zh-CN" ? "先行后列" : "Row major"}
                              </option>
                              <option value="column-major">
                                {locale === "zh-CN"
                                  ? "先列后行"
                                  : "Column major"}
                              </option>
                            </select>
                            <ChevronDown size={14} aria-hidden="true" />
                          </span>
                        </label>
                      </div>
                      <button
                        className="button button--ghost creator-fit-grid"
                        disabled={
                          atlasDimensions.width === 0 ||
                          atlasDimensions.height === 0
                        }
                        onClick={() =>
                          updateProject((next) => {
                            const atlas = next.source!.atlas!;
                            atlas.cellWidth = Math.max(
                              1,
                              Math.floor(
                                (atlasDimensions.width -
                                  atlas.marginX * 2 -
                                  atlas.gapX * (atlas.columns - 1)) /
                                  atlas.columns,
                              ),
                            );
                            atlas.cellHeight = Math.max(
                              1,
                              Math.floor(
                                (atlasDimensions.height -
                                  atlas.marginY * 2 -
                                  atlas.gapY * (atlas.rows - 1)) /
                                  atlas.rows,
                              ),
                            );
                            return next;
                          })
                        }
                      >
                        <Grid3X3 size={14} />
                        {locale === "zh-CN"
                          ? "按源图均分网格"
                          : "Fit grid evenly to source"}
                      </button>
                    </section>
                  )}
                  <button
                    className="button button--primary creator-inspector-action"
                    onClick={processSource}
                    disabled={busy || sourceFiles.length === 0}
                  >
                    <CirclePlay size={17} />
                    {extractionActionLabel(project.source?.kind, locale)}
                  </button>
                </aside>
              </div>
            </section>
          )}

          {project.step === "cleanup" && (
            <section className="creator-panel creator-panel--editor">
              <div className="creator-panel__intro">
                <Eraser size={20} />
                <div>
                  <h2>{c.steps.cleanup}</h2>
                  <p>{c.cleanupHelp}</p>
                </div>
              </div>
              <div className="creator-editor-grid creator-editor-grid--cleanup">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--cleanup">
                    <div className="creator-toolbar-group">
                      <span>{c.cleanupPreview}</span>
                      <div
                        className="creator-segmented"
                        aria-label={c.cleanupPreview}
                      >
                        {(["source", "result", "mask"] as const).map((view) => (
                          <button
                            key={view}
                            className={cleanupView === view ? "is-active" : ""}
                            onClick={() => setCleanupView(view)}
                            aria-pressed={cleanupView === view}
                          >
                            {view === "source"
                              ? locale === "zh-CN"
                                ? "原图"
                                : "Source"
                              : view === "result"
                                ? locale === "zh-CN"
                                  ? "处理结果"
                                  : "Result"
                                : locale === "zh-CN"
                                  ? "透明遮罩"
                                  : "Alpha mask"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="creator-toolbar-group creator-toolbar-group--backdrop">
                      <span>{c.cleanupBackdrop}</span>
                      <div
                        className="creator-segmented"
                        aria-label={c.cleanupBackdrop}
                      >
                        {(
                          ["transparent", "black", "white", "theme"] as const
                        ).map((background) => (
                          <button
                            key={background}
                            className={
                              cleanupBackdrop === background ? "is-active" : ""
                            }
                            onClick={() => setCleanupBackdrop(background)}
                            aria-label={`${c.cleanupBackdrop}: ${background}`}
                            title={`${c.cleanupBackdrop}: ${background}`}
                            aria-pressed={cleanupBackdrop === background}
                          >
                            <i
                              className={`backdrop-swatch backdrop-swatch--${background}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <CleanupBrushStage
                    frame={
                      cleanupView === "source"
                        ? (activeSourceFrame ?? activeFrame)
                        : (cleanupPreviewFrame ??
                          activeSourceFrame ??
                          activeFrame)
                    }
                    strokes={project.cleanup.strokes}
                    cornerMasks={project.cleanup.cornerMasks}
                    frameIndex={activeLogical?.sourceIndex ?? 0}
                    brushMode={brushMode}
                    brushSize={brushSize}
                    sampling={samplingColor}
                    backdrop={cleanupBackdrop}
                    maskView={cleanupView === "mask"}
                    showGuides={cleanupView !== "result"}
                    toolLabel={
                      samplingColor
                        ? c.eyedropper
                        : brushMode === "keep"
                          ? c.keepBrush
                          : c.eraseBrush
                    }
                    onStroke={addCleanupStroke}
                    onSample={(point) => void pickCleanupColor(point)}
                  />
                  <section className="cleanup-tool-dock">
                    <div className="cleanup-tool-dock__intro">
                      <span>
                        <Eye size={15} /> {c.cleanupTools}
                      </span>
                      <small>{c.cleanupToolsHint}</small>
                    </div>
                    <div
                      className="cleanup-brush-toolbar"
                      role="toolbar"
                      aria-label={c.cleanupTools}
                    >
                      <div className="cleanup-brush-modes">
                        <button
                          className={
                            brushMode === "keep" && !samplingColor
                              ? "is-active"
                              : ""
                          }
                          onClick={() => {
                            setBrushMode("keep");
                            setSamplingColor(false);
                          }}
                          aria-pressed={brushMode === "keep" && !samplingColor}
                        >
                          <Brush size={15} /> {c.keepBrush}
                        </button>
                        <button
                          className={
                            brushMode === "erase" && !samplingColor
                              ? "is-active"
                              : ""
                          }
                          onClick={() => {
                            setBrushMode("erase");
                            setSamplingColor(false);
                          }}
                          aria-pressed={brushMode === "erase" && !samplingColor}
                        >
                          <Eraser size={15} /> {c.eraseBrush}
                        </button>
                        <button
                          className={samplingColor ? "is-active" : ""}
                          onClick={() => setSamplingColor((value) => !value)}
                          aria-pressed={samplingColor}
                        >
                          <Pipette size={15} /> {c.eyedropper}
                        </button>
                      </div>
                      <label className="creator-control-row">
                        <span>{c.brushSize}</span>
                        <output>{brushSize}px</output>
                        <input
                          type="range"
                          min={4}
                          max={96}
                          value={brushSize}
                          onChange={(event) =>
                            setBrushSize(Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="creator-field">
                        <span>
                          {locale === "zh-CN" ? "作用范围" : "Apply to"}
                        </span>
                        <span className="creator-select-control">
                          <select
                            value={brushScope}
                            onChange={(event) =>
                              setBrushScope(
                                event.target.value as "current" | "all",
                              )
                            }
                          >
                            <option value="current">
                              {c.currentFrameOnly}
                            </option>
                            <option value="all">{c.allFrames}</option>
                          </select>
                          <ChevronDown size={14} aria-hidden="true" />
                        </span>
                      </label>
                    </div>
                  </section>
                  <p className="creator-canvas-note">
                    {locale === "zh-CN"
                      ? "画笔与遮罩按源图坐标保存；切换黑、白和主题色背景检查边缘残留。"
                      : "Brushes and masks stay in source coordinates. Check edges against black, white, and theme backdrops."}
                  </p>
                </div>
                <aside className="creator-inspector-panel creator-inspector-panel--cleanup">
                  <div className="creator-cleanup-commit creator-cleanup-commit--top">
                    <div
                      className={
                        cleanupDirty
                          ? "creator-commit-state creator-commit-state--pending"
                          : "creator-commit-state creator-commit-state--applied"
                      }
                      role="status"
                    >
                      {cleanupDirty ? (
                        <AlertTriangle size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      <span>
                        <strong>
                          {cleanupDirty
                            ? locale === "zh-CN"
                              ? "存在未应用的调整"
                              : "Unapplied adjustments"
                            : locale === "zh-CN"
                              ? "处理结果已同步"
                              : "Processing is synchronized"}
                        </strong>
                        <small>
                          {cleanupDirty ? c.cleanupPending : c.cleanupApplied}
                        </small>
                      </span>
                    </div>
                    {cleanupDirty ? (
                      <div className="creator-cleanup-actions">
                        <button
                          className="button button--ghost"
                          onClick={discardCleanupChanges}
                          disabled={busy}
                        >
                          <RotateCcw size={15} /> {c.discardCleanup}
                        </button>
                        <button
                          className="button button--primary"
                          onClick={() => void processCleanup()}
                          disabled={busy}
                        >
                          <Eraser size={16} /> {c.processCleanup}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <section>
                    <h3>
                      {locale === "zh-CN" ? "背景识别" : "Background key"}
                    </h3>
                    <div className="creator-inspector-fields">
                      <label className="creator-field">
                        <span>{locale === "zh-CN" ? "处理方式" : "Mode"}</span>
                        <span className="creator-select-control">
                          <select
                            value={project.cleanup.mode}
                            onChange={(event) =>
                              updateProject((next) => {
                                next.cleanup.mode = event.target
                                  .value as CompanionCreatorProject["cleanup"]["mode"];
                                return next;
                              })
                            }
                          >
                            <option value="preserve-alpha">
                              {c.preserveAlpha}
                            </option>
                            <option value="sampled-color">
                              {c.sampledColor}
                            </option>
                          </select>
                          <ChevronDown size={14} aria-hidden="true" />
                        </span>
                      </label>
                      <p className="creator-inspector-help">
                        {project.cleanup.mode === "preserve-alpha"
                          ? locale === "zh-CN"
                            ? "当前保留源透明通道。需要移除实色背景时，可使用吸管取色或切换为“去除取样颜色”。"
                            : "Source transparency is preserved. Pick a color or switch to sampled-color removal for solid backgrounds."
                          : locale === "zh-CN"
                            ? "取样后再调整容差、羽化和去色溢出，并在黑白背景上检查边缘。"
                            : "Sample the background, then tune tolerance, feather, and despill against black and white backdrops."}
                      </p>
                      <label
                        className={
                          project.cleanup.mode === "preserve-alpha"
                            ? "creator-color-field is-inactive"
                            : "creator-color-field"
                        }
                      >
                        <span>
                          {locale === "zh-CN" ? "取样颜色" : "Sample color"}
                        </span>
                        <input
                          type="color"
                          value={project.cleanup.sampledColor}
                          disabled={project.cleanup.mode === "preserve-alpha"}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.cleanup.sampledColor = event.target.value;
                              return next;
                            })
                          }
                        />
                        <code>
                          {project.cleanup.sampledColor.toUpperCase()}
                        </code>
                      </label>
                      {(
                        [
                          [
                            "tolerance",
                            locale === "zh-CN" ? "容差" : "Tolerance",
                            100,
                          ],
                          [
                            "feather",
                            locale === "zh-CN" ? "羽化" : "Feather",
                            24,
                          ],
                          [
                            "despill",
                            locale === "zh-CN" ? "去色溢出" : "Despill",
                            100,
                          ],
                        ] as const
                      ).map(([field, label, max]) => (
                        <label
                          key={field}
                          className={
                            project.cleanup.mode === "preserve-alpha"
                              ? "creator-control-row is-inactive"
                              : "creator-control-row"
                          }
                        >
                          <span>{label}</span>
                          <output>{project.cleanup[field]}</output>
                          <input
                            type="range"
                            min={0}
                            max={max}
                            disabled={project.cleanup.mode === "preserve-alpha"}
                            value={project.cleanup[field]}
                            onChange={(event) =>
                              updateProject((next) => {
                                next.cleanup[field] = Number(
                                  event.target.value,
                                );
                                return next;
                              })
                            }
                          />
                        </label>
                      ))}
                      <label
                        className={
                          project.cleanup.mode === "preserve-alpha"
                            ? "creator-toggle-row is-inactive"
                            : "creator-toggle-row"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={project.cleanup.connectedSubject}
                          disabled={project.cleanup.mode === "preserve-alpha"}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.cleanup.connectedSubject =
                                event.target.checked;
                              return next;
                            })
                          }
                        />
                        <span>
                          {locale === "zh-CN"
                            ? "仅保留主要连通主体"
                            : "Keep the primary connected subject"}
                        </span>
                      </label>
                    </div>
                  </section>
                  <section>
                    <h3>{locale === "zh-CN" ? "角落遮罩" : "Corner masks"}</h3>
                    <p className="creator-inspector-help">
                      {locale === "zh-CN"
                        ? "仅适用于没有覆盖主体的角落水印。"
                        : "Use only for corner marks that never overlap the subject."}
                    </p>
                    <div className="corner-mask-grid">
                      {(
                        [
                          ["top-left", "TL"],
                          ["top-right", "TR"],
                          ["bottom-left", "BL"],
                          ["bottom-right", "BR"],
                        ] as const
                      ).map(([corner, label]) => {
                        const active = project.cleanup.cornerMasks.some(
                          (mask) => mask.corner === corner,
                        );
                        return (
                          <button
                            key={corner}
                            className={active ? "is-active" : ""}
                            onClick={() =>
                              updateProject((next) => {
                                const exists = next.cleanup.cornerMasks.some(
                                  (mask) => mask.corner === corner,
                                );
                                next.cleanup.cornerMasks = exists
                                  ? next.cleanup.cornerMasks.filter(
                                      (mask) => mask.corner !== corner,
                                    )
                                  : [
                                      ...next.cleanup.cornerMasks,
                                      { corner, width: 112, height: 112 },
                                    ];
                                return next;
                              })
                            }
                            aria-label={
                              locale === "zh-CN"
                                ? `${corner} 角落遮罩`
                                : `${corner.replace("-", " ")} corner mask`
                            }
                            aria-pressed={active}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {project.cleanup.cornerMasks.length > 0 && (
                      <div className="corner-mask-settings">
                        {project.cleanup.cornerMasks.map((mask) => (
                          <div key={mask.corner}>
                            <strong>
                              {locale === "zh-CN"
                                ? {
                                    "top-left": "左上",
                                    "top-right": "右上",
                                    "bottom-left": "左下",
                                    "bottom-right": "右下",
                                  }[mask.corner]
                                : mask.corner
                                    .split("-")
                                    .map(
                                      (part) =>
                                        part[0]!.toUpperCase() + part.slice(1),
                                    )
                                    .join(" ")}
                            </strong>
                            <label className="creator-field">
                              <span>{locale === "zh-CN" ? "宽" : "Width"}</span>
                              <input
                                type="number"
                                min={1}
                                max={activeFrame?.width ?? 8192}
                                value={mask.width}
                                onChange={(event) =>
                                  updateProject((next) => {
                                    const target =
                                      next.cleanup.cornerMasks.find(
                                        (item) => item.corner === mask.corner,
                                      );
                                    if (target)
                                      target.width = Number(event.target.value);
                                    return next;
                                  })
                                }
                              />
                            </label>
                            <label className="creator-field">
                              <span>
                                {locale === "zh-CN" ? "高" : "Height"}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={activeFrame?.height ?? 8192}
                                value={mask.height}
                                onChange={(event) =>
                                  updateProject((next) => {
                                    const target =
                                      next.cleanup.cornerMasks.find(
                                        (item) => item.corner === mask.corner,
                                      );
                                    if (target)
                                      target.height = Number(
                                        event.target.value,
                                      );
                                    return next;
                                  })
                                }
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </section>
          )}

          {project.step === "align" && (
            <section className="creator-panel creator-panel--editor">
              <div className="creator-panel__intro">
                <Crop size={20} />
                <div>
                  <h2>{c.steps.align}</h2>
                  <p>{c.alignHelp}</p>
                </div>
              </div>
              <div className="creator-editor-grid">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--alignment">
                    <div className="creator-toolbar-group">
                      <span>{locale === "zh-CN" ? "编辑" : "Edit"}</span>
                      <div
                        className="creator-segmented"
                        aria-label={
                          locale === "zh-CN" ? "对齐编辑工具" : "Alignment tool"
                        }
                      >
                        <button
                          className={
                            alignmentTool === "canvas" ? "is-active" : ""
                          }
                          aria-pressed={alignmentTool === "canvas"}
                          onClick={() => {
                            setAlignmentTool("canvas");
                          }}
                        >
                          <ScanLine size={13} />
                          {locale === "zh-CN" ? "共享画布" : "Shared canvas"}
                        </button>
                        <button
                          className={
                            alignmentTool === "frame" ? "is-active" : ""
                          }
                          aria-pressed={alignmentTool === "frame"}
                          onClick={() => {
                            setAlignmentTool("frame");
                          }}
                        >
                          <Move size={13} />
                          {locale === "zh-CN" ? "当前帧" : "Current frame"}
                        </button>
                      </div>
                    </div>
                    <div className="creator-toolbar-group creator-toolbar-group--backdrop">
                      {frames.length > 1 && (
                        <div
                          className="creator-segmented"
                          aria-label={
                            locale === "zh-CN"
                              ? "对齐预览"
                              : "Alignment preview"
                          }
                        >
                          <button
                            className={
                              alignmentView === "current" ? "is-active" : ""
                            }
                            aria-pressed={alignmentView === "current"}
                            onClick={() => setAlignmentView("current")}
                          >
                            <Eye size={13} />
                            {locale === "zh-CN" ? "单帧" : "Single"}
                          </button>
                          <button
                            className={
                              alignmentView === "overlay" ? "is-active" : ""
                            }
                            aria-pressed={alignmentView === "overlay"}
                            onClick={() => {
                              setAlignmentView("overlay");
                            }}
                          >
                            <Layers3 size={13} />
                            {locale === "zh-CN" ? "叠影" : "Onion skin"}
                          </button>
                        </div>
                      )}
                      <strong className="alignment-canvas-size">
                        {activeFrame
                          ? `${activeFrame.width} × ${activeFrame.height}`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                  <InteractiveAlignmentStage
                    frame={activeFrame}
                    logicalFrame={activeLogical}
                    comparisonFrames={alignmentOverlayFrames}
                    canvas={alignmentCanvas}
                    crop={project.sharedCrop}
                    groundLine={project.groundLine}
                    contentScale={project.contentScale}
                    currentFrame={currentFrame}
                    tool={alignmentTool}
                    view={alignmentView}
                    locale={locale}
                    onCropChange={(crop) =>
                      updateProject((next) => {
                        next.sharedCrop = crop;
                        return next;
                      })
                    }
                    onGroundLineChange={(groundLine) =>
                      updateProject((next) => {
                        next.groundLine = groundLine;
                        return next;
                      })
                    }
                    onFrameOffsetChange={(offset) =>
                      updateProject((next) => {
                        next.frames[currentFrame]!.baselineOffset = offset;
                        return next;
                      })
                    }
                  />
                  <p className="creator-canvas-note">
                    {alignmentTool === "canvas"
                      ? locale === "zh-CN"
                        ? "拖动蓝色裁剪框或四角控制点调整全部帧；黄色线是共同落点。"
                        : "Drag the blue crop or its handles for every frame; the yellow line is the shared contact point."
                      : locale === "zh-CN"
                        ? "拖动画面平移当前帧。所有帧保持同一缩放比例，避免角色大小跳动。"
                        : "Drag the artwork to translate this frame. Scale stays shared so the subject never jumps in size."}
                  </p>
                </div>
                <aside className="creator-inspector-panel creator-inspector-panel--align">
                  <AlignmentAssistant
                    locale={locale}
                    diagnostics={alignmentDiagnostics}
                    currentScale={project.contentScale}
                    fittedScale={fittedContentScale}
                    canExpand={Boolean(expandedAlignmentCanvas)}
                    onFit={() =>
                      updateProject((next) => {
                        const fitted = fitSharedContentScale(
                          next.frames,
                          next.sharedCrop,
                          next.groundLine,
                        );
                        if (
                          fitted !== null &&
                          fitted < next.contentScale - 0.001
                        ) {
                          next.contentScale = fitted;
                        }
                        return next;
                      })
                    }
                    onExpand={() =>
                      updateProject((next) => {
                        const expanded = expandSharedCanvasToContent(
                          next.frames,
                          next.sharedCrop,
                          next.groundLine,
                          next.contentScale,
                          alignmentCanvas,
                        );
                        if (!expanded) return next;
                        next.sharedCrop = expanded.crop;
                        next.groundLine = expanded.groundLine;
                        next.frames.forEach((frame) => {
                          frame.baselineOffset.x += expanded.offsetDelta.x;
                          frame.baselineOffset.y += expanded.offsetDelta.y;
                        });
                        return next;
                      })
                    }
                    onInspect={() => {
                      const outlier = alignmentDiagnostics.frames.find(
                        (diagnostic) =>
                          diagnostic.missingBounds ||
                          diagnostic.outsideCrop ||
                          Math.abs(diagnostic.baselineDelta ?? 0) > 2 ||
                          Math.abs(diagnostic.centerDelta ?? 0) > 2,
                      );
                      if (!outlier) return;
                      selectCalibrationFrame(outlier.frameIndex);
                      setAlignmentTool("frame");
                      setAlignmentView("overlay");
                    }}
                    onAutoAlign={() =>
                      updateProject((next) => {
                        applySuggestedSharedAlignment(next, frames);
                        return next;
                      })
                    }
                    onReturnCleanup={() => setStep("cleanup")}
                  />
                  <section>
                    <div className="creator-section-heading">
                      <div>
                        <h3>
                          {locale === "zh-CN"
                            ? `当前帧 · ${currentFrame + 1}`
                            : `Current frame · ${currentFrame + 1}`}
                        </h3>
                        <p className="creator-inspector-help">
                          {activeAlignmentDiagnostic?.missingBounds
                            ? locale === "zh-CN"
                              ? "当前帧未识别到主体。"
                              : "No subject was detected in this frame."
                            : locale === "zh-CN"
                              ? `落点偏差 ${Math.round(activeAlignmentDiagnostic?.baselineDelta ?? 0)} px · 中心偏差 ${Math.round(activeAlignmentDiagnostic?.centerDelta ?? 0)} px`
                              : `Ground ${Math.round(activeAlignmentDiagnostic?.baselineDelta ?? 0)} px · center ${Math.round(activeAlignmentDiagnostic?.centerDelta ?? 0)} px`}
                        </p>
                      </div>
                      <span
                        className={
                          activeLogical?.excluded ||
                          activeAlignmentDiagnostic?.missingBounds ||
                          activeAlignmentDiagnostic?.outsideCrop
                            ? "alignment-frame-state alignment-frame-state--warning"
                            : "alignment-frame-state"
                        }
                      >
                        {activeLogical?.excluded
                          ? locale === "zh-CN"
                            ? "已排除"
                            : "Excluded"
                          : activeAlignmentDiagnostic?.missingBounds
                            ? locale === "zh-CN"
                              ? "未识别"
                              : "Not detected"
                            : activeAlignmentDiagnostic?.outsideCrop
                              ? locale === "zh-CN"
                                ? "超出画布"
                                : "Outside"
                              : locale === "zh-CN"
                                ? "画布内"
                                : "Inside"}
                      </span>
                    </div>
                    <div className="creator-coordinate-grid">
                      {(["x", "y"] as const).map((axis) => (
                        <label key={axis} className="creator-field">
                          <span>
                            {axis === "x" ? c.baselineX : c.baselineY}
                          </span>
                          <input
                            type="number"
                            step={1}
                            min={
                              -Math.round(
                                axis === "x"
                                  ? (activeFrame?.width ?? 1)
                                  : (activeFrame?.height ?? 1),
                              )
                            }
                            max={Math.round(
                              axis === "x"
                                ? (activeFrame?.width ?? 1)
                                : (activeFrame?.height ?? 1),
                            )}
                            value={Math.round(
                              activeLogical?.baselineOffset[axis] ?? 0,
                            )}
                            onChange={(event) =>
                              updateProject((next) => {
                                next.frames[currentFrame]!.baselineOffset[
                                  axis
                                ] = Number(event.target.value);
                                return next;
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <div className="alignment-frame-actions">
                      <button
                        className="button button--ghost"
                        disabled={
                          !activeLogical?.subjectBounds ||
                          project.groundLine === null ||
                          !project.sharedCrop
                        }
                        onClick={() =>
                          updateProject((next) => {
                            const logical = next.frames[currentFrame]!;
                            const bounds = logical.subjectBounds;
                            if (
                              !bounds ||
                              !next.sharedCrop ||
                              next.groundLine === null
                            )
                              return next;
                            logical.baselineOffset = {
                              x:
                                next.sharedCrop.x +
                                next.sharedCrop.width / 2 -
                                (bounds.x + bounds.width / 2),
                              y: next.groundLine - (bounds.y + bounds.height),
                            };
                            return next;
                          })
                        }
                      >
                        <ScanLine size={14} />
                        {locale === "zh-CN"
                          ? "吸附当前帧"
                          : "Snap current frame"}
                      </button>
                      <button
                        className="button button--ghost"
                        onClick={() =>
                          updateProject((next) => {
                            next.frames[currentFrame]!.baselineOffset = {
                              x: 0,
                              y: 0,
                            };
                            return next;
                          })
                        }
                      >
                        <RotateCcw size={14} />
                        {locale === "zh-CN" ? "清零偏移" : "Clear offset"}
                      </button>
                    </div>
                  </section>
                  <section>
                    <div className="creator-section-heading">
                      <div>
                        <h3>{c.sharedCrop}</h3>
                        <p className="creator-inspector-help">
                          {locale === "zh-CN"
                            ? "裁剪与地面线作用于全部有效帧。"
                            : "Crop and ground line apply to every included frame."}
                        </p>
                      </div>
                    </div>
                    <div className="alignment-scale-control">
                      <div className="alignment-scale-control__heading">
                        <span>
                          <strong>
                            {locale === "zh-CN" ? "全局尺寸" : "Global size"}
                          </strong>
                          <small>
                            {locale === "zh-CN"
                              ? "所有有效帧统一等比缩放"
                              : "Uniform scale for every included frame"}
                          </small>
                        </span>
                        <label>
                          <input
                            type="number"
                            min={MIN_CONTENT_SCALE * 100}
                            max={MAX_CONTENT_SCALE * 100}
                            step={1}
                            aria-label={
                              locale === "zh-CN"
                                ? "全局尺寸百分比"
                                : "Global size percentage"
                            }
                            value={Math.round(project.contentScale * 100)}
                            onChange={(event) =>
                              updateProject((next) => {
                                const percentage = Number(event.target.value);
                                if (!Number.isFinite(percentage)) return next;
                                next.contentScale = clamp(
                                  percentage / 100,
                                  MIN_CONTENT_SCALE,
                                  MAX_CONTENT_SCALE,
                                );
                                return next;
                              })
                            }
                          />
                          <span>%</span>
                        </label>
                      </div>
                      <div className="alignment-scale-control__slider">
                        <input
                          type="range"
                          min={MIN_CONTENT_SCALE * 100}
                          max={MAX_CONTENT_SCALE * 100}
                          step={1}
                          value={project.contentScale * 100}
                          aria-label={
                            locale === "zh-CN"
                              ? "调整所有帧的统一尺寸"
                              : "Adjust the uniform size of all frames"
                          }
                          onChange={(event) =>
                            updateProject((next) => {
                              next.contentScale =
                                Number(event.target.value) / 100;
                              return next;
                            })
                          }
                        />
                        <button
                          type="button"
                          className="button button--ghost"
                          disabled={
                            Math.abs(
                              project.contentScale - DEFAULT_CONTENT_SCALE,
                            ) < 0.001
                          }
                          onClick={() =>
                            updateProject((next) => {
                              next.contentScale = DEFAULT_CONTENT_SCALE;
                              return next;
                            })
                          }
                        >
                          <RotateCcw size={13} />
                          100%
                        </button>
                      </div>
                      <p>
                        {locale === "zh-CN"
                          ? "以共享画布中心和地面线为支点；不会修改或逐帧压缩源素材。"
                          : "Anchored to the shared center and ground line; source frames are never resized independently."}
                      </p>
                      {project.contentScale < 0.65 && (
                        <p className="alignment-scale-control__warning">
                          <AlertTriangle size={13} />
                          {locale === "zh-CN"
                            ? "缩放低于 65%。建议检查异常帧，避免少数大帧让全部画面过小。"
                            : "Scale is below 65%. Inspect outliers so one oversized frame does not make every pose too small."}
                        </p>
                      )}
                    </div>
                    <div className="creator-coordinate-grid">
                      {project.sharedCrop &&
                        (["x", "y", "width", "height"] as const).map(
                          (field) => (
                            <label key={field} className="creator-field">
                              <span>{field.toUpperCase()}</span>
                              <input
                                type="number"
                                min={
                                  field === "width" || field === "height"
                                    ? 1
                                    : 0
                                }
                                max={
                                  field === "x" || field === "width"
                                    ? alignmentCanvas?.width
                                    : alignmentCanvas?.height
                                }
                                value={Math.round(project.sharedCrop![field])}
                                onChange={(event) =>
                                  updateProject((next) => {
                                    const crop = next.sharedCrop!;
                                    const value = Number(event.target.value);
                                    if (!Number.isFinite(value)) return next;
                                    const width =
                                      alignmentCanvas?.width ??
                                      crop.x + crop.width;
                                    const height =
                                      alignmentCanvas?.height ??
                                      crop.y + crop.height;
                                    if (field === "x")
                                      crop.x = clamp(
                                        value,
                                        0,
                                        Math.max(0, width - crop.width),
                                      );
                                    if (field === "y")
                                      crop.y = clamp(
                                        value,
                                        0,
                                        Math.max(0, height - crop.height),
                                      );
                                    if (field === "width")
                                      crop.width = clamp(
                                        value,
                                        1,
                                        Math.max(1, width - crop.x),
                                      );
                                    if (field === "height")
                                      crop.height = clamp(
                                        value,
                                        1,
                                        Math.max(1, height - crop.y),
                                      );
                                    return next;
                                  })
                                }
                              />
                            </label>
                          ),
                        )}
                    </div>
                    <div className="creator-inspector-fields alignment-ground-control">
                      <label className="creator-control-row">
                        <span>{c.groundLine}</span>
                        <output>
                          {Math.round(project.groundLine ?? 0)} px
                        </output>
                        <input
                          type="range"
                          min={0}
                          max={alignmentCanvas?.height ?? 1}
                          value={project.groundLine ?? 0}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.groundLine = clamp(
                                Number(event.target.value),
                                0,
                                alignmentCanvas?.height ?? 1,
                              );
                              return next;
                            })
                          }
                        />
                      </label>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          )}

          {project.step === "calibrate" && (
            <section className="creator-panel creator-panel--editor creator-calibrate">
              <div className="creator-panel__intro">
                <MousePointer2 size={20} />
                <div>
                  <h2>{c.steps.calibrate}</h2>
                  <p>{c.calibrateHelp}</p>
                </div>
              </div>
              <div className="creator-editor-grid">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--caption">
                    <span>
                      {project.frames.length <= 1
                        ? locale === "zh-CN"
                          ? "静态伙伴使用当前帧，不需要方向锚点。"
                          : "A static companion uses this frame and needs no direction anchors."
                        : locale === "zh-CN"
                          ? "先选帧，再用圆盘定义光标方向。"
                          : "Select a frame, then define its pointer direction with the dial."}
                    </span>
                    <div className="calibration-frame-nav">
                      <button
                        type="button"
                        aria-label={
                          locale === "zh-CN" ? "上一帧" : "Previous frame"
                        }
                        disabled={currentFrame <= 0}
                        onClick={() => selectCalibrationFrame(currentFrame - 1)}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <strong>
                        {locale === "zh-CN" ? "当前帧" : "Frame"}{" "}
                        {currentFrame + 1}
                        <small> / {project.frames.length}</small>
                      </strong>
                      <button
                        type="button"
                        aria-label={
                          locale === "zh-CN" ? "下一帧" : "Next frame"
                        }
                        disabled={currentFrame >= project.frames.length - 1}
                        onClick={() => selectCalibrationFrame(currentFrame + 1)}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <FrameStage
                    frame={activeFrame}
                    project={project}
                    currentFrame={currentFrame}
                  />
                  {project.frames.length > 1 && (
                    <CalibrationHealth
                      calibration={calibration}
                      project={project}
                      locale={locale}
                    />
                  )}
                </div>
                <aside className="creator-inspector-panel creator-direction-inspector">
                  <section>
                    <h3>
                      {locale === "zh-CN" ? "光标方向" : "Pointer direction"}
                    </h3>
                    {project.frames.length <= 1 ? (
                      <div className="creator-static-state">
                        <span>
                          <Check size={18} />
                        </span>
                        <strong>
                          {locale === "zh-CN"
                            ? "静态姿态已就绪"
                            : "Static pose ready"}
                        </strong>
                        <p>
                          {locale === "zh-CN"
                            ? "单张图片会始终使用当前姿态，无需设置方向角度。"
                            : "A single image always uses this pose, so no direction angle is required."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <CalibrationSummary
                          calibration={calibration}
                          locale={locale}
                        />
                        <DirectionDial
                          angle={angle}
                          onChange={setAngle}
                          label={locale === "zh-CN" ? "方向角度" : "Direction"}
                        />
                        <button
                          className="button button--primary creator-inspector-action"
                          onClick={setAnchor}
                        >
                          {currentDirectionAnchor
                            ? locale === "zh-CN"
                              ? "更新当前锚点"
                              : "Update current anchor"
                            : conflictingDirectionAnchor
                              ? locale === "zh-CN"
                                ? `将 ${Math.round(angle)}° 锚点移到此帧`
                                : `Move ${Math.round(angle)}° anchor here`
                              : c.addAnchor}
                        </button>
                        {conflictingDirectionAnchor &&
                          !currentDirectionAnchor && (
                            <p className="creator-inline-warning">
                              <AlertTriangle size={13} />
                              {locale === "zh-CN"
                                ? `${Math.round(angle)}° 当前属于第 ${conflictingDirectionAnchor.frameIndex + 1} 帧；继续会移动该锚点。`
                                : `${Math.round(angle)}° currently belongs to frame ${conflictingDirectionAnchor.frameIndex + 1}; continuing moves that anchor.`}
                            </p>
                          )}
                        <div
                          className="direction-preset-grid"
                          aria-label={
                            locale === "zh-CN"
                              ? "八方向快捷锚点"
                              : "Eight-direction anchor shortcuts"
                          }
                        >
                          {[0, 45, 90, 135, 180, 225, 270, 315].map(
                            (direction) => {
                              const assigned = project.directionAnchors.find(
                                (anchor) =>
                                  Math.abs(anchor.angle - direction) < 0.001,
                              );
                              const isCurrent =
                                assigned?.frameIndex === currentFrame;
                              return (
                                <button
                                  key={direction}
                                  type="button"
                                  className={`${assigned ? "is-assigned" : ""}${isCurrent ? " is-current" : ""}`}
                                  onClick={() => setAnchorAt(direction)}
                                  aria-label={
                                    locale === "zh-CN"
                                      ? `把当前第 ${currentFrame + 1} 帧设置为 ${direction} 度方向`
                                      : `Assign frame ${currentFrame + 1} to ${direction} degrees`
                                  }
                                >
                                  <i
                                    aria-hidden="true"
                                    style={{
                                      transform: `rotate(${direction}deg)`,
                                    }}
                                  >
                                    ↑
                                  </i>
                                  <strong>{direction}°</strong>
                                  <small>
                                    {assigned
                                      ? `${locale === "zh-CN" ? "帧" : "F"}${assigned.frameIndex + 1}`
                                      : locale === "zh-CN"
                                        ? "未设置"
                                        : "Unset"}
                                  </small>
                                </button>
                              );
                            },
                          )}
                        </div>
                        {project.directionAnchors.some(
                          (anchor) => anchor.frameIndex === currentFrame,
                        ) && (
                          <button
                            type="button"
                            className="button button--ghost creator-inspector-action"
                            onClick={removeCurrentAnchor}
                          >
                            <Trash2 size={15} />
                            {locale === "zh-CN"
                              ? "移除当前帧锚点"
                              : "Remove this frame's anchor"}
                          </button>
                        )}
                        <p className="creator-inspector-help">
                          {locale === "zh-CN"
                            ? `已设置 ${project.directionAnchors.length} 个锚点，建议至少 8 个。`
                            : `${project.directionAnchors.length} anchors set; 8 or more is recommended.`}
                        </p>
                        {project.directionAnchors.length > 0 && (
                          <div
                            className="direction-anchor-roster"
                            aria-label={
                              locale === "zh-CN"
                                ? "已设置的方向锚点"
                                : "Assigned direction anchors"
                            }
                          >
                            {[...project.directionAnchors]
                              .sort((left, right) => left.angle - right.angle)
                              .map((anchor) => (
                                <button
                                  key={anchor.id}
                                  type="button"
                                  className={
                                    anchor.frameIndex === currentFrame
                                      ? "is-current"
                                      : ""
                                  }
                                  onClick={() =>
                                    selectCalibrationFrame(anchor.frameIndex)
                                  }
                                >
                                  <i
                                    aria-hidden="true"
                                    style={{
                                      transform: `rotate(${anchor.angle}deg)`,
                                    }}
                                  >
                                    ↑
                                  </i>
                                  <span>{Math.round(anchor.angle)}°</span>
                                  <small>
                                    {locale === "zh-CN" ? "帧" : "F"}
                                    {anchor.frameIndex + 1}
                                  </small>
                                </button>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                  {project.frames.length > 1 && (
                    <details className="creator-inspector-disclosure">
                      <summary>
                        <span>
                          <strong>
                            {locale === "zh-CN"
                              ? "异常区间修正"
                              : "Repair an unusual range"}
                          </strong>
                          <small>
                            {locale === "zh-CN"
                              ? "用于来回转动、倒序或无效片段"
                              : "For turn-backs, reversed or unusable footage"}
                          </small>
                        </span>
                        <ChevronRight size={15} />
                      </summary>
                      <div className="creator-inspector-disclosure__body">
                        <div className="creator-coordinate-grid">
                          <label className="creator-field">
                            <span>{c.rangeStart}</span>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, project.frames.length)}
                              value={calibrationStart + 1}
                              onChange={(event) =>
                                setCalibrationStart(
                                  Math.max(
                                    0,
                                    Math.min(
                                      project.frames.length - 1,
                                      Number(event.target.value) - 1,
                                    ),
                                  ),
                                )
                              }
                            />
                          </label>
                          <label className="creator-field">
                            <span>{c.rangeEnd}</span>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, project.frames.length)}
                              value={calibrationEnd + 1}
                              onChange={(event) =>
                                setCalibrationEnd(
                                  Math.max(
                                    0,
                                    Math.min(
                                      project.frames.length - 1,
                                      Number(event.target.value) - 1,
                                    ),
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                        <div className="calibration-range-shortcuts">
                          <button
                            type="button"
                            onClick={() => setCalibrationStart(currentFrame)}
                          >
                            {locale === "zh-CN"
                              ? "当前帧作为起点"
                              : "Current as start"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalibrationEnd(currentFrame)}
                          >
                            {locale === "zh-CN"
                              ? "当前帧作为终点"
                              : "Current as end"}
                          </button>
                        </div>
                        <div className="creator-inspector-actions">
                          <button
                            className="button button--ghost"
                            onClick={reverseCalibrationRange}
                          >
                            {locale === "zh-CN" ? "反转区间" : "Reverse range"}
                          </button>
                          <button
                            className="button button--ghost"
                            onClick={excludeCalibrationRange}
                          >
                            {locale === "zh-CN" ? "排除区间" : "Exclude range"}
                          </button>
                        </div>
                      </div>
                    </details>
                  )}
                </aside>
              </div>
              {project.frames.length > 1 && (
                <div>
                  <DirectionTimeline
                    project={project}
                    frames={frames}
                    currentFrame={currentFrame}
                    locale={locale}
                    onSelect={selectCalibrationFrame}
                  />
                </div>
              )}
            </section>
          )}

          {project.step === "motions" && (
            <section className="creator-panel creator-panel--editor creator-panel--motions">
              <div className="creator-panel__intro">
                <Sparkles size={20} />
                <div>
                  <h2>{c.steps.motions}</h2>
                  <p>{c.motionsHelp}</p>
                </div>
              </div>
              <div className="creator-editor-grid">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--caption">
                    <span>
                      {project.frames.length <= 1
                        ? locale === "zh-CN"
                          ? "静态图片没有连续帧，小动作可以直接跳过。"
                          : "A static image has no frame sequence, so idle motions can be skipped."
                        : locale === "zh-CN"
                          ? "先标记起点和终点，再完整预览一次循环。"
                          : "Mark the start and end, then review one complete loop."}
                    </span>
                    <strong>
                      {project.frames.length <= 1
                        ? locale === "zh-CN"
                          ? "可选步骤"
                          : "Optional"
                        : `${motionStart + 1}–${motionEnd + 1}`}
                    </strong>
                  </div>
                  <FrameStage
                    frame={activeFrame}
                    project={project}
                    currentFrame={currentFrame}
                  />
                  {project.frames.length > 1 && (
                    <DirectionTimeline
                      project={project}
                      frames={frames}
                      currentFrame={currentFrame}
                      locale={locale}
                      onSelect={selectMotionFrame}
                      draftMotionRange={{
                        startFrame: motionStart,
                        endFrame: motionEnd,
                      }}
                      motionPreviewing={motionPreviewing}
                    />
                  )}
                </div>
                <aside className="creator-inspector-panel">
                  {project.frames.length <= 1 ? (
                    <section>
                      <h3>{locale === "zh-CN" ? "小动作" : "Idle motions"}</h3>
                      <div className="creator-static-state">
                        <span>
                          <Check size={18} />
                        </span>
                        <strong>
                          {locale === "zh-CN"
                            ? "无需配置"
                            : "No setup required"}
                        </strong>
                        <p>
                          {locale === "zh-CN"
                            ? "如需眨眼、呼吸等动作，请导入图片序列或视频。"
                            : "Import an image sequence or video to add blinks, breathing, or gestures."}
                        </p>
                      </div>
                    </section>
                  ) : (
                    <>
                      <section>
                        <div className="creator-inspector-heading">
                          <div>
                            <h3>
                              {locale === "zh-CN" ? "动作区间" : "Motion range"}
                            </h3>
                            <p>
                              {locale === "zh-CN"
                                ? "选择工具，再点击时间轴中的帧。"
                                : "Choose a tool, then click a timeline frame."}
                            </p>
                          </div>
                          <span>
                            {motionStart + 1}–{motionEnd + 1}
                          </span>
                        </div>
                        <div className="motion-selection-tools" role="group">
                          {(["inspect", "start", "end"] as const).map(
                            (mode) => (
                              <button
                                key={mode}
                                type="button"
                                className={
                                  motionSelectionMode === mode
                                    ? "is-active"
                                    : ""
                                }
                                aria-pressed={motionSelectionMode === mode}
                                onClick={() => setMotionSelectionMode(mode)}
                              >
                                {mode === "inspect"
                                  ? locale === "zh-CN"
                                    ? "检查帧"
                                    : "Inspect"
                                  : mode === "start"
                                    ? locale === "zh-CN"
                                      ? "标记起点"
                                      : "Mark start"
                                    : locale === "zh-CN"
                                      ? "标记终点"
                                      : "Mark end"}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="motion-boundary-fields">
                          <label>
                            <span>{c.rangeStart}</span>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, project.frames.length)}
                              value={motionStart + 1}
                              onChange={(event) =>
                                setMotionBoundary(
                                  "start",
                                  Number(event.target.value) - 1,
                                )
                              }
                            />
                          </label>
                          <label>
                            <span>{c.rangeEnd}</span>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, project.frames.length)}
                              value={motionEnd + 1}
                              onChange={(event) =>
                                setMotionBoundary(
                                  "end",
                                  Number(event.target.value) - 1,
                                )
                              }
                            />
                          </label>
                        </div>
                        <div className="motion-playback-choice">
                          <span>
                            {locale === "zh-CN" ? "循环方式" : "Loop style"}
                          </span>
                          <div role="group">
                            {(["forward", "ping-pong"] as const).map(
                              (playback) => (
                                <button
                                  key={playback}
                                  type="button"
                                  className={
                                    motionDraftPlayback === playback
                                      ? "is-active"
                                      : ""
                                  }
                                  aria-pressed={
                                    motionDraftPlayback === playback
                                  }
                                  onClick={() => {
                                    invalidateMotionPreview();
                                    setMotionDraftPlayback(playback);
                                  }}
                                >
                                  {playback === "forward"
                                    ? locale === "zh-CN"
                                      ? "正向循环"
                                      : "Forward"
                                    : locale === "zh-CN"
                                      ? "往返循环"
                                      : "Ping-pong"}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="motion-draft-health">
                          <span
                            className={
                              motionDiagnostics.canPreview ? "is-ready" : ""
                            }
                          >
                            {motionDiagnostics.includedFrames.length}
                            {locale === "zh-CN" ? " 帧" : " frames"}
                          </span>
                          <span>
                            {(motionDiagnostics.durationMs / 1000).toFixed(2)}s
                          </span>
                          <span>
                            {locale === "zh-CN" ? "姿态 " : "Pose "}
                            {motionDiagnostics.recommendedPoseAngle === null
                              ? "—"
                              : `${Math.round(motionDiagnostics.recommendedPoseAngle)}°`}
                          </span>
                          {motionDiagnostics.excludedCount > 0 && (
                            <small>
                              {locale === "zh-CN"
                                ? `${motionDiagnostics.excludedCount} 帧已排除`
                                : `${motionDiagnostics.excludedCount} excluded`}
                            </small>
                          )}
                          {motionDiagnostics.hasDirectionDrift && (
                            <small>
                              {locale === "zh-CN"
                                ? `方向漂移 ${Math.round(motionDiagnostics.angleDrift)}°`
                                : `${Math.round(motionDiagnostics.angleDrift)}° direction drift`}
                            </small>
                          )}
                          {motionDiagnostics.overlappingMotionIds.length >
                            0 && (
                            <small>
                              {locale === "zh-CN"
                                ? "与已有动作重叠"
                                : "Overlaps a saved motion"}
                            </small>
                          )}
                        </div>
                        {motionDiagnostics.hasDirectionDrift && (
                          <p className="motion-draft-warning">
                            <AlertTriangle size={14} />
                            {locale === "zh-CN"
                              ? "该区间包含明显转向。空闲动作通常应保持同一姿态；请缩短区间，或确认这确实是需要的动作。"
                              : "This range changes direction noticeably. Idle motion normally stays within one pose; shorten it or confirm the change is intentional."}
                          </p>
                        )}
                        <div className="creator-inspector-actions motion-preview-actions">
                          <button
                            className="button button--ghost"
                            onClick={() => {
                              const sequence = motionPreviewFrames(
                                project.frames,
                                motionStart,
                                motionEnd,
                                motionDraftPlayback,
                              );
                              setCurrentFrame(sequence[0] ?? motionStart);
                              setMotionPreviewing((current) => !current);
                            }}
                            disabled={!motionDiagnostics.canPreview}
                          >
                            {motionPreviewing ? (
                              <Pause size={15} />
                            ) : (
                              <CirclePlay size={15} />
                            )}
                            {motionPreviewing
                              ? locale === "zh-CN"
                                ? "停止预览"
                                : "Stop preview"
                              : locale === "zh-CN"
                                ? "预览区间"
                                : "Preview range"}
                          </button>
                          <span
                            className={motionRangeReviewed ? "is-reviewed" : ""}
                          >
                            {motionPreviewing
                              ? locale === "zh-CN"
                                ? "正在检查循环…"
                                : "Reviewing loop…"
                              : motionRangeReviewed
                                ? locale === "zh-CN"
                                  ? "已完整预览"
                                  : "Loop reviewed"
                                : locale === "zh-CN"
                                  ? "尚未完整预览"
                                  : "Not reviewed yet"}
                          </span>
                        </div>
                      </section>
                      <button
                        className="button button--primary creator-inspector-action"
                        disabled={!motionCanSave}
                        onClick={() => {
                          setMotionPreviewing(false);
                          updateProject((next) => {
                            next.motionRanges.push({
                              id: crypto.randomUUID(),
                              name: `${locale === "zh-CN" ? "小动作" : "Idle"} ${
                                next.motionRanges.length + 1
                              }`,
                              poseAnchorIds:
                                motionDiagnostics.recommendedPoseAnchorId
                                  ? [motionDiagnostics.recommendedPoseAnchorId]
                                  : [],
                              startFrame: motionStart,
                              endFrame: motionEnd,
                              playback: motionDraftPlayback,
                              speed: 1,
                              minimumDelayMs: 2500,
                              maximumDelayMs: 8000,
                            });
                            return next;
                          });
                          setMotionPreviewedSignature(null);
                          const nextFrame = Math.min(
                            project.frames.length - 1,
                            motionEnd + 1,
                          );
                          setMotionStart(nextFrame);
                          setMotionEnd(nextFrame);
                          setCurrentFrame(nextFrame);
                          setMotionSelectionMode("end");
                        }}
                      >
                        <Sparkles size={15} /> {c.addMotion}
                      </button>
                      <p className="creator-inspector-help">
                        {!motionDiagnostics.canPreview
                          ? locale === "zh-CN"
                            ? "区间至少需要两帧未排除画面。"
                            : "The range needs at least two included frames."
                          : motionDiagnostics.overlappingMotionIds.length > 0
                            ? locale === "zh-CN"
                              ? "请先调整区间，避免与已有动作重复。"
                              : "Adjust the range so it does not overlap a saved motion."
                            : !motionRangeReviewed
                              ? locale === "zh-CN"
                                ? "完整预览一次循环后即可保存。"
                                : "Review one full loop to enable saving."
                              : locale === "zh-CN"
                                ? "将默认关联到最接近的方向姿态，保存后仍可调整。"
                                : "The nearest direction pose will be linked by default and can be changed below."}
                      </p>
                    </>
                  )}
                </aside>
              </div>
              <div className="motion-list">
                {project.motionRanges.length === 0 && (
                  <div className="motion-list__empty">
                    <Sparkles size={18} />
                    <div>
                      <strong>
                        {locale === "zh-CN"
                          ? "尚未添加小动作"
                          : "No idle motions yet"}
                      </strong>
                      <p>
                        {locale === "zh-CN"
                          ? "选择至少两帧并预览循环，确认衔接自然后再添加。"
                          : "Select at least two frames and preview the loop before adding it."}
                      </p>
                    </div>
                  </div>
                )}
                {project.motionRanges.map((motion) => (
                  <div key={motion.id} className="motion-card">
                    <input
                      aria-label={
                        locale === "zh-CN" ? "动作名称" : "Motion name"
                      }
                      value={motion.name}
                      onChange={(event) =>
                        updateProject((next) => {
                          next.motionRanges.find(
                            (item) => item.id === motion.id,
                          )!.name = event.target.value;
                          return next;
                        })
                      }
                    />
                    <span>
                      {motion.startFrame + 1}–{motion.endFrame + 1}
                    </span>
                    <label>
                      {locale === "zh-CN" ? "播放方式" : "Playback"}
                      <span className="creator-select-control">
                        <select
                          value={motion.playback}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.motionRanges.find(
                                (item) => item.id === motion.id,
                              )!.playback = event.target.value as
                                "forward" | "ping-pong";
                              return next;
                            })
                          }
                        >
                          <option value="forward">
                            {locale === "zh-CN" ? "正向" : "Forward"}
                          </option>
                          <option value="ping-pong">
                            {locale === "zh-CN" ? "往返" : "Ping-pong"}
                          </option>
                        </select>
                        <ChevronDown size={14} aria-hidden="true" />
                      </span>
                    </label>
                    <label>
                      {locale === "zh-CN" ? "最短间隔（秒）" : "Min delay (s)"}
                      <input
                        type="number"
                        min={0.25}
                        max={120}
                        step={0.25}
                        value={motion.minimumDelayMs / 1000}
                        onChange={(event) =>
                          updateProject((next) => {
                            const target = next.motionRanges.find(
                              (item) => item.id === motion.id,
                            )!;
                            target.minimumDelayMs = Math.min(
                              target.maximumDelayMs,
                              Math.max(250, Number(event.target.value) * 1000),
                            );
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      {locale === "zh-CN" ? "最长间隔（秒）" : "Max delay (s)"}
                      <input
                        type="number"
                        min={0.25}
                        max={120}
                        step={0.25}
                        value={motion.maximumDelayMs / 1000}
                        onChange={(event) =>
                          updateProject((next) => {
                            const target = next.motionRanges.find(
                              (item) => item.id === motion.id,
                            )!;
                            target.maximumDelayMs = Math.max(
                              target.minimumDelayMs,
                              Math.min(
                                120_000,
                                Number(event.target.value) * 1000,
                              ),
                            );
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      {locale === "zh-CN" ? "速度" : "Speed"}
                      <input
                        type="number"
                        min={0.1}
                        max={4}
                        step={0.1}
                        value={motion.speed}
                        onChange={(event) =>
                          updateProject((next) => {
                            next.motionRanges.find(
                              (item) => item.id === motion.id,
                            )!.speed = Math.min(
                              4,
                              Math.max(0.1, Number(event.target.value) || 1),
                            );
                            return next;
                          })
                        }
                      />
                    </label>
                    <fieldset>
                      <legend>
                        {locale === "zh-CN"
                          ? "允许播放的方向姿态"
                          : "Allowed direction poses"}
                      </legend>
                      {project.directionAnchors.map((anchor) => (
                        <label key={anchor.id}>
                          <input
                            type="checkbox"
                            checked={motion.poseAnchorIds.includes(anchor.id)}
                            disabled={
                              motion.poseAnchorIds.includes(anchor.id) &&
                              motion.poseAnchorIds.length === 1
                            }
                            onChange={(event) =>
                              updateProject((next) => {
                                const target = next.motionRanges.find(
                                  (item) => item.id === motion.id,
                                )!;
                                target.poseAnchorIds = event.target.checked
                                  ? [...target.poseAnchorIds, anchor.id]
                                  : target.poseAnchorIds.filter(
                                      (id) => id !== anchor.id,
                                    );
                                return next;
                              })
                            }
                          />
                          {Math.round(anchor.angle)}°
                        </label>
                      ))}
                    </fieldset>
                    <div className="motion-card__actions">
                      <button
                        className="icon-button"
                        aria-label={
                          locale === "zh-CN"
                            ? `预览 ${motion.name}`
                            : `Preview ${motion.name}`
                        }
                        title={
                          locale === "zh-CN" ? "预览动作" : "Preview motion"
                        }
                        onClick={() => {
                          setMotionStart(motion.startFrame);
                          setMotionEnd(motion.endFrame);
                          setMotionDraftPlayback(motion.playback);
                          setCurrentFrame(motion.startFrame);
                          setMotionPreviewedSignature(null);
                          setMotionPreviewing(true);
                          setMotionSelectionMode("inspect");
                        }}
                      >
                        <CirclePlay size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={
                          locale === "zh-CN" ? "删除小动作" : "Delete motion"
                        }
                        title={
                          locale === "zh-CN" ? "删除小动作" : "Delete motion"
                        }
                        onClick={() =>
                          updateProject((next) => {
                            next.motionRanges = next.motionRanges.filter(
                              (item) => item.id !== motion.id,
                            );
                            return next;
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {project.step === "test" && (
            <section className="creator-panel creator-panel--editor creator-panel--test">
              <div className="creator-panel__intro">
                <CirclePlay size={20} />
                <div>
                  <h2>{c.steps.test}</h2>
                  <p>{c.testHelp}</p>
                </div>
              </div>
              <div className="creator-editor-grid creator-editor-grid--test">
                <div className="creator-canvas-column">
                  <div className="creator-canvas-toolbar creator-canvas-toolbar--caption creator-test-toolbar">
                    <span>
                      {frames.length === 1
                        ? locale === "zh-CN"
                          ? "拖动伙伴设置默认落点，并调整输入框高度检查贴边效果。"
                          : "Drag the companion to set its default placement and test changing composer heights."
                        : locale === "zh-CN"
                          ? "移动光标检查方向切换；拖动伙伴设置默认落点。"
                          : "Move the pointer to test directions, then drag the companion into place."}
                    </span>
                    <div className="creator-canvas-toolbar__actions">
                      <div
                        className="creator-segmented"
                        aria-label={c.previewBackdrop}
                      >
                        {(
                          ["transparent", "black", "white", "theme"] as const
                        ).map((background) => (
                          <button
                            key={background}
                            className={
                              project.preview.background === background
                                ? "is-active"
                                : ""
                            }
                            onClick={() =>
                              updateProject((next) => {
                                next.preview.background = background;
                                return next;
                              })
                            }
                            aria-label={`${c.previewBackdrop}: ${background}`}
                            aria-pressed={
                              project.preview.background === background
                            }
                          >
                            <i
                              className={`backdrop-swatch backdrop-swatch--${background}`}
                            />
                          </button>
                        ))}
                      </div>
                      <strong>{project.preview.renderFps} FPS</strong>
                    </div>
                  </div>
                  <PointerTestStage
                    frame={frames.find(
                      (item) =>
                        item.sourceIndex ===
                        project.frames[previewFrameIndex]?.sourceIndex,
                    )}
                    logicalFrame={project.frames[previewFrameIndex]}
                    crop={project.sharedCrop}
                    groundLine={project.groundLine}
                    contentScale={project.contentScale}
                    pointer={pointer}
                    onPointer={setPointer}
                    placement={project.placement}
                    backdrop={project.preview.background}
                    composerHeight={testComposerHeight}
                    onPlacement={(placement) =>
                      updateProject((next) => {
                        next.placement = placement;
                        return next;
                      })
                    }
                    label={c.followPointer}
                    dragLabel={c.dragCompanion}
                    workspaceLabel={
                      locale === "zh-CN" ? "工作区输入框" : "Workspace composer"
                    }
                  />
                </div>
                <aside className="creator-inspector-panel creator-inspector-panel--test">
                  <section className="creator-readiness creator-build-section">
                    <div className="creator-readiness__heading">
                      <h3>{c.readiness}</h3>
                      <span>
                        {readinessCount}/5 {c.readyCount}
                      </span>
                    </div>
                    <ul>
                      <li data-ready={metadataValid}>
                        {metadataValid ? (
                          <Check size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {c.metadataReady}
                      </li>
                      <li data-ready={includedFrameCount > 0}>
                        {includedFrameCount > 0 ? (
                          <Check size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {c.framesReady} · {includedFrameCount}
                      </li>
                      <li data-ready={directionSetupValid}>
                        {directionSetupValid ? (
                          <Check size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {frames.length === 1
                          ? c.staticDirectionReady
                          : c.directionsReady}
                      </li>
                      <li data-ready={outputSummary.withinLimits}>
                        {outputSummary.withinLimits ? (
                          <Check size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {c.packageLimitsReady}
                      </li>
                      <li data-ready={alignmentDiagnostics.ready}>
                        {alignmentDiagnostics.ready ? (
                          <Check size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {locale === "zh-CN"
                          ? "共享画布与全局尺寸已就绪"
                          : "Shared canvas and global size ready"}
                      </li>
                    </ul>
                    <div className="creator-output-summary">
                      <div className="creator-output-summary__heading">
                        <strong>{c.compiledOutput}</strong>
                        <span>
                          {outputSummary.assetKind === "image"
                            ? c.staticImageAsset
                            : outputSummary.assetKind === "atlas"
                              ? `${outputSummary.atlasPages} ${
                                  outputSummary.atlasPages === 1
                                    ? c.atlasPage
                                    : c.atlasPages
                                }`
                              : "—"}
                        </span>
                      </div>
                      <dl>
                        <div>
                          <dt>{c.outputCanvas}</dt>
                          <dd>
                            {outputSummary.canvas
                              ? `${outputSummary.canvas.width} × ${outputSummary.canvas.height} px`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>{c.logicalFrames}</dt>
                          <dd>
                            {outputSummary.includedFrames} /{" "}
                            {companionOutputLimits.frames}
                            {outputSummary.excludedFrames > 0
                              ? ` · ${outputSummary.excludedFrames} ${c.excludedFrames}`
                              : ""}
                          </dd>
                        </div>
                        <div>
                          <dt>{c.directionCoverage}</dt>
                          <dd>
                            {Math.round(outputSummary.directionCoverage * 100)}%
                            {` · ${outputSummary.directionPoses} ${
                              outputSummary.directionPoses === 1
                                ? c.pose
                                : c.poses
                            }`}
                          </dd>
                        </div>
                        <div>
                          <dt>{c.idleMotions}</dt>
                          <dd>
                            {outputSummary.idleClips}{" "}
                            {outputSummary.idleClips === 1 ? c.clip : c.clips}
                          </dd>
                        </div>
                        {outputSummary.assetKind === "atlas" ? (
                          <div>
                            <dt>{c.decodedPage}</dt>
                            <dd>
                              {formatFileSize(outputSummary.decodedPageBytes)} /{" "}
                              {formatFileSize(
                                companionOutputLimits.decodedPageBytes,
                              )}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      <p>{c.packageLimits}</p>
                    </div>
                    {readinessAction ? (
                      <button
                        type="button"
                        className="creator-readiness-action"
                        onClick={resolveFirstReadinessIssue}
                      >
                        <AlertTriangle size={15} />
                        <span>
                          <strong>{readinessAction.title}</strong>
                          <small>{readinessAction.detail}</small>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ) : null}
                  </section>
                  <section>
                    <h3>
                      {locale === "zh-CN" ? "伙伴信息" : "Companion details"}
                    </h3>
                    <div className="creator-inspector-fields">
                      <label className="creator-field">
                        <span>{c.name}</span>
                        <input
                          id="companion-name"
                          value={project.name}
                          maxLength={64}
                          aria-invalid={
                            project.name.trim().length === 0 ||
                            project.name.trim().length > 64
                          }
                          onChange={(event) =>
                            updateProject((next) => {
                              next.name = event.target.value;
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-field">
                        <span>{c.description}</span>
                        <textarea
                          id="companion-description"
                          value={project.description}
                          maxLength={240}
                          aria-invalid={
                            project.description.trim().length === 0 ||
                            project.description.trim().length > 240
                          }
                          onChange={(event) =>
                            updateProject((next) => {
                              next.description = event.target.value;
                              return next;
                            })
                          }
                        />
                        <small>{project.description.length} / 240</small>
                      </label>
                      <label className="creator-field">
                        <span>{c.author}</span>
                        <input
                          id="companion-author"
                          value={project.author}
                          maxLength={80}
                          aria-invalid={
                            project.author.trim().length === 0 ||
                            project.author.trim().length > 80
                          }
                          onChange={(event) =>
                            updateProject((next) => {
                              next.author = event.target.value;
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-field">
                        <span>{c.license}</span>
                        <span className="creator-select-control">
                          <select
                            id="companion-license"
                            value={project.license}
                            aria-invalid={project.license.trim().length === 0}
                            aria-describedby="companion-license-hint"
                            onChange={(event) =>
                              updateProject((next) => {
                                next.license = event.target.value;
                                return next;
                              })
                            }
                          >
                            <option value="" disabled>
                              {c.chooseLicense}
                            </option>
                            <option>CC-BY-4.0</option>
                            <option>CC0-1.0</option>
                            <option>MIT</option>
                            <option>Proprietary</option>
                          </select>
                          <ChevronDown size={14} aria-hidden="true" />
                        </span>
                        <small
                          id="companion-license-hint"
                          className="creator-field__hint"
                        >
                          {c.licenseHint}
                        </small>
                      </label>
                    </div>
                  </section>
                  <section>
                    <h3>
                      {locale === "zh-CN" ? "运行表现" : "Runtime behavior"}
                    </h3>
                    <div className="creator-inspector-fields">
                      <label className="creator-control-row">
                        <span>
                          {locale === "zh-CN"
                            ? "跟随平滑度"
                            : "Follow smoothing"}
                        </span>
                        <output>
                          {project.preview.followSmoothing.toFixed(2)}
                        </output>
                        <input
                          type="range"
                          min={0.02}
                          max={0.8}
                          step={0.01}
                          value={project.preview.followSmoothing}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.preview.followSmoothing = Number(
                                event.target.value,
                              );
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-control-row">
                        <span>{c.companionSize}</span>
                        <output>{Math.round(project.placement.size)} px</output>
                        <input
                          type="range"
                          min={48}
                          max={240}
                          step={1}
                          value={project.placement.size}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.placement.size = Number(event.target.value);
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-control-row">
                        <span>{c.horizontalPosition}</span>
                        <output>
                          {Math.round(project.placement.align * 100)}%
                        </output>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={project.placement.align}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.placement.align = Number(event.target.value);
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-control-row">
                        <span>{c.verticalOffset}</span>
                        <output>
                          {Math.round(project.placement.offsetY)} px
                        </output>
                        <input
                          type="range"
                          min={-48}
                          max={96}
                          step={1}
                          value={project.placement.offsetY}
                          onChange={(event) =>
                            updateProject((next) => {
                              next.placement.offsetY = Number(
                                event.target.value,
                              );
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="creator-control-row">
                        <span>{c.previewHeight}</span>
                        <output>{testComposerHeight} px</output>
                        <input
                          type="range"
                          min={56}
                          max={112}
                          step={1}
                          value={testComposerHeight}
                          onChange={(event) =>
                            setTestComposerHeight(Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="creator-field">
                        <span>
                          {locale === "zh-CN" ? "渲染上限" : "Render cap"}
                        </span>
                        <span className="creator-select-control">
                          <select
                            value={project.preview.renderFps}
                            onChange={(event) =>
                              updateProject((next) => {
                                next.preview.renderFps = Number(
                                  event.target.value,
                                ) as 24 | 30 | 60;
                                return next;
                              })
                            }
                          >
                            <option value={24}>24 FPS</option>
                            <option value={30}>30 FPS</option>
                            <option value={60}>60 FPS</option>
                          </select>
                          <ChevronDown size={14} aria-hidden="true" />
                        </span>
                      </label>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          )}
        </main>

        {frames.length > 1 &&
          project.step !== "calibrate" &&
          project.step !== "motions" &&
          project.step !== "test" && (
            <aside className="creator-frame-strip">
              <div className="creator-frame-strip__header">
                <strong>
                  {frames.length} {locale === "zh-CN" ? "帧" : "frames"}
                </strong>
                <span>
                  {c.frame} {currentFrame + 1}
                </span>
              </div>
              <div
                className="creator-frame-strip__items"
                data-scroll-surface="horizontal"
              >
                {project.frames.map((logical, index) => {
                  const frame = frames.find(
                    (item) => item.sourceIndex === logical.sourceIndex,
                  );
                  const alignmentIssue = alignmentDiagnostics.frames.find(
                    (diagnostic) =>
                      diagnostic.frameIndex === index &&
                      (diagnostic.missingBounds ||
                        diagnostic.outsideCrop ||
                        Math.abs(diagnostic.baselineDelta ?? 0) > 2 ||
                        Math.abs(diagnostic.centerDelta ?? 0) > 2),
                  );
                  return (
                    <button
                      key={logical.id}
                      className={[
                        "frame-thumb",
                        currentFrame === index ? "frame-thumb--active" : "",
                        logical.excluded ? "frame-thumb--excluded" : "",
                        project.step === "align" && alignmentIssue
                          ? "frame-thumb--warning"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={`${c.frame} ${index + 1}${
                        project.step === "align" && alignmentIssue
                          ? locale === "zh-CN"
                            ? "，需要对齐"
                            : ", needs alignment"
                          : logical.excluded
                            ? locale === "zh-CN"
                              ? "，已排除"
                              : ", excluded"
                            : ""
                      }`}
                      onClick={() => setCurrentFrame(index)}
                    >
                      {frame && <img src={frame.url} alt="" />}
                      <span>{index + 1}</span>
                    </button>
                  );
                })}
              </div>
              <button
                className="button button--ghost"
                onClick={() =>
                  updateProject((next) => {
                    next.frames[currentFrame]!.excluded =
                      !next.frames[currentFrame]!.excluded;
                    return next;
                  })
                }
              >
                {activeLogical?.excluded ? c.include : c.exclude}
              </button>
            </aside>
          )}
      </div>

      <footer className="creator-footer" hidden={Boolean(restoreState)}>
        <button
          className="button button--ghost"
          disabled={stepIndex === 0}
          onClick={() => void navigateToStep(previousStep!)}
        >
          <ChevronLeft size={15} /> {c.previous}
        </button>
        <span
          className={`creator-footer__status creator-footer__status--${autosaveStatus}`}
          role="status"
        >
          <i />
          {!projectHasContent
            ? locale === "zh-CN"
              ? "导入素材或编辑信息后开始自动保存"
              : "Autosave starts after you import media or edit details"
            : autosaveStatus === "saving"
              ? c.autosaving
              : autosaveStatus === "error"
                ? c.autosaveFailed
                : `${locale === "zh-CN" ? "已自动保存" : "Autosaved"} ${lastSavedAt.toLocaleTimeString(locale)}`}
        </span>
        {project.step === "test" ? (
          <button
            className="button button--primary creator-footer__build"
            onClick={buildReady ? save : resolveFirstReadinessIssue}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : buildReady ? (
              <Save size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
            {busy ? c.building : buildReady ? c.save : c.reviewRemaining}
          </button>
        ) : (
          <button
            className="button button--primary"
            disabled={!canContinue}
            onClick={() => void navigateToStep(nextStep!)}
          >
            {project.step === "cleanup" && cleanupDirty
              ? c.applyAndContinue
              : c.next}{" "}
            <ChevronRight size={15} />
          </button>
        )}
      </footer>

      {confirmAction ? (
        <div
          className="confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setConfirmAction(null);
          }}
        >
          <section
            className="confirm-dialog creator-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="creator-confirm-title"
          >
            <span className="confirm-dialog__icon">
              <AlertTriangle size={20} />
            </span>
            <h2 id="creator-confirm-title">{confirmTitle}</h2>
            <p>{confirmBody}</p>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setConfirmAction(null)}
              >
                {c.cancel}
              </button>
              <button className="danger-button" onClick={confirmCreatorAction}>
                {confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
