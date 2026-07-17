import {
  AlertTriangle,
  ArrowLeft,
  Brush,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Crop,
  Eraser,
  Film,
  Grid3X3,
  Image as ImageIcon,
  LoaderCircle,
  MousePointer2,
  Pipette,
  Redo2,
  RotateCcw,
  Save,
  Scissors,
  Sparkles,
  Undo2,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import {
  atlasCellRect,
  atlasOverflow,
  commonSubjectCrop,
  calibrateDirections,
  normalizeAngle,
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
  type ExtractedFrame,
} from "./media";
import {
  createCompanionProject,
  type AtlasSliceSettings,
  type CompanionCreatorProject,
  type CompanionImportKind,
  type CreatorStep,
  type DirectionAnchor,
} from "./model";
import {
  loadCompanionProjectSource,
  saveCompanionProject,
} from "./project-files";
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
    image: "Static image",
    sequence: "Image sequence",
    video: "Video",
    atlas: "Sprite atlas",
    chooseFiles: "Choose source files",
    extract: "Generate logical frames",
    cleanupHelp:
      "Preserve existing transparency or remove a sampled background locally. Inspect edges on more than one background before continuing.",
    preserveAlpha: "Preserve transparency",
    sampledColor: "Remove sampled color",
    processCleanup: "Apply non-destructive clean-up preview",
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
    back: "Back to companions",
    previous: "Previous",
    next: "Next",
    undo: "Undo",
    redo: "Redo",
    resetStep: "Reset step",
    resetAll: "Reset project",
    noFrames: "Generate frames before continuing.",
    processing: "Processing locally…",
    frame: "Frame",
    excluded: "Excluded",
    include: "Include",
    exclude: "Exclude",
    sharedCrop: "Shared crop",
    groundLine: "Ground line",
    baselineX: "Baseline X",
    baselineY: "Baseline Y",
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
    image: "静态图片",
    sequence: "图片序列",
    video: "视频",
    atlas: "序列图集",
    chooseFiles: "选择源素材",
    extract: "生成逻辑帧",
    cleanupHelp:
      "可保留已有透明通道，或在本地去除取样背景色。继续前请在多种背景上检查边缘。",
    preserveAlpha: "保留透明通道",
    sampledColor: "去除取样颜色",
    processCleanup: "应用非破坏性处理预览",
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
    back: "返回伙伴",
    previous: "上一步",
    next: "下一步",
    undo: "撤销",
    redo: "重做",
    resetStep: "重置当前步骤",
    resetAll: "重置整个工程",
    noFrames: "请先生成帧再继续。",
    processing: "正在本地处理…",
    frame: "帧",
    excluded: "已排除",
    include: "包含",
    exclude: "排除",
    sharedCrop: "共享裁剪",
    groundLine: "地面线",
    baselineX: "基线 X",
    baselineY: "基线 Y",
    license: "素材许可证",
    author: "作者",
    name: "伙伴名称",
    rangeStart: "区间起点",
    rangeEnd: "区间终点",
    followPointer: "光标测试区域",
    saved: "伙伴已安装到“我的伙伴”。",
  },
} as const;

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

function initialAnchors(frameCount: number): DirectionAnchor[] {
  if (frameCount < 4) return [];
  const count = Math.min(8, frameCount);
  return Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    frameIndex: Math.round((index * (frameCount - 1)) / (count - 1)),
    angle: (index * 360) / count,
  }));
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
  const [project, setProject] = useState<CompanionCreatorProject>(
    initialProject ?? createCompanionProject(),
  );
  const [past, setPast] = useState<CompanionCreatorProject[]>([]);
  const [future, setFuture] = useState<CompanionCreatorProject[]>([]);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [angle, setAngle] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState("Local creator");
  const [license, setLicense] = useState("CC-BY-4.0");
  const [motionStart, setMotionStart] = useState(0);
  const [motionEnd, setMotionEnd] = useState(0);
  const [calibrationStart, setCalibrationStart] = useState(0);
  const [calibrationEnd, setCalibrationEnd] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 0 });
  const [brushMode, setBrushMode] = useState<"keep" | "erase">("erase");
  const [brushScope, setBrushScope] = useState<"current" | "all">("current");
  const [brushSize, setBrushSize] = useState(28);
  const [samplingColor, setSamplingColor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepBaseline = useRef(project);
  const autosaveRef = useRef<number | null>(null);
  const framesRef = useRef(frames);
  const restoredProjectRef = useRef(false);

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
    if (autosaveRef.current !== null) window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => {
      void saveCompanionProject(project).catch(() => undefined);
    }, 700);
    return () => {
      if (autosaveRef.current !== null)
        window.clearTimeout(autosaveRef.current);
    };
  }, [project]);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    if (
      restoredProjectRef.current ||
      !initialProject?.source?.files.some((file) => file.storedPath)
    ) {
      return;
    }
    restoredProjectRef.current = true;
    let active = true;
    void (async () => {
      setBusy(true);
      try {
        const restored = await Promise.all(
          initialProject.source!.files.map(async (descriptor) => {
            if (!descriptor.storedPath) return null;
            const blob = await loadCompanionProjectSource(
              initialProject.id,
              descriptor.storedPath,
            );
            return blob
              ? new File([blob], descriptor.name, {
                  type: descriptor.type,
                  lastModified: descriptor.lastModified,
                })
              : null;
          }),
        );
        const files = restored.filter((file): file is File => file !== null);
        if (files.length !== initialProject.source!.files.length) {
          throw new Error(
            "One or more source files are missing from this draft",
          );
        }
        let output = await extractProjectFrames(
          initialProject,
          files,
          setProgress,
        );
        if (
          initialProject.cleanup.mode !== "preserve-alpha" ||
          initialProject.cleanup.cornerMasks.length > 0 ||
          initialProject.cleanup.strokes.length > 0
        ) {
          output = await Promise.all(
            output.map((frame) => cleanFrame(frame, initialProject.cleanup)),
          );
        }
        if (!active) return;
        setSourceFiles(files);
        setFrames(output);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialProject]);

  useEffect(
    () => () => {
      for (const frame of framesRef.current) URL.revokeObjectURL(frame.url);
    },
    [],
  );

  const activeLogical = project.frames[currentFrame];
  const activeFrame = activeLogical
    ? frames.find((frame) => frame.sourceIndex === activeLogical.sourceIndex)
    : undefined;
  const calibration = useMemo(
    () => calibrateDirections(project.frames, project.directionAnchors),
    [project.frames, project.directionAnchors],
  );
  const previewFrameIndex = useMemo(() => {
    const pointerAngle = normalizeAngle(
      (Math.atan2(pointer.x - 50, 50 - pointer.y) * 180) / Math.PI,
    );
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    for (const anchor of project.directionAnchors) {
      const delta = Math.abs(((anchor.angle - pointerAngle + 540) % 360) - 180);
      if (delta < distance) {
        nearest = anchor.frameIndex;
        distance = delta;
      }
    }
    return nearest;
  }, [pointer, project.directionAnchors]);

  const chooseKind = (kind: CompanionImportKind) => {
    updateProject((next) => {
      next.source = sourceDescriptor(kind, []);
      return next;
    });
    setSourceFiles([]);
    setFrames([]);
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

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = [...(event.target.files ?? [])];
    if (selected.length === 0) return;
    const kind =
      project.source?.kind ??
      (selected[0]!.type.startsWith("video/")
        ? "video"
        : selected.length > 1
          ? "sequence"
          : "image");
    const next = structuredClone(project);
    next.source = sourceDescriptor(kind, selected);
    next.name = selected[0]!.name.replace(/\.[^.]+$/u, "") || next.name;
    setProject(await saveCompanionProject(next, selected));
    setSourceFiles(selected);
    setPast((items) => [...items, project]);
    setFuture([]);
    event.target.value = "";
  };

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
      const logical = output.map((frame, index) => ({
        id: frame.id,
        sourceIndex: frame.sourceIndex,
        sourceTimeMs: frame.sourceTimeMs,
        excluded: false,
        visualDelta: visualDeltas[index] ?? 1,
        baselineOffset: { x: 0, y: 0 },
        subjectBounds: bounds[index] ?? undefined,
      }));
      replaceFrames(output);
      setCurrentFrame(0);
      setMotionEnd(Math.max(0, logical.length - 1));
      setCalibrationEnd(Math.max(0, logical.length - 1));
      updateProject((next) => {
        next.frames = logical;
        next.sharedCrop = commonSubjectCrop(logical, 8) ?? {
          x: 0,
          y: 0,
          width: output[0]?.width ?? 1,
          height: output[0]?.height ?? 1,
        };
        next.groundLine = next.sharedCrop.y + next.sharedCrop.height;
        next.directionAnchors = initialAnchors(logical.length);
        next.neutralFrame = 0;
        next.reducedMotionFrame = 0;
        next.step = "cleanup";
        return next;
      });
      stepBaseline.current = project;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const processCleanup = async () => {
    if (frames.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const cleaned: ExtractedFrame[] = [];
      for (const [index, frame] of frames.entries()) {
        cleaned.push(await cleanFrame(frame, project.cleanup));
        setProgress((index + 1) / frames.length);
      }
      const bounds = await Promise.all(cleaned.map(alphaBounds));
      replaceFrames(cleaned);
      updateProject((next) => {
        next.frames.forEach((frame, index) => {
          frame.subjectBounds = bounds[index] ?? undefined;
        });
        next.sharedCrop = commonSubjectCrop(next.frames, 8) ?? next.sharedCrop;
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const setStep = (step: CreatorStep) => {
    stepBaseline.current = structuredClone(project);
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

  const setAnchor = () => {
    updateProject((next) => {
      const existing = next.directionAnchors.find(
        (anchor) => anchor.frameIndex === currentFrame,
      );
      if (existing) existing.angle = angle;
      else
        next.directionAnchors.push({
          id: crypto.randomUUID(),
          frameIndex: currentFrame,
          angle,
        });
      next.directionAnchors.sort(
        (left, right) => left.frameIndex - right.frameIndex,
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
    if (!activeFrame) return;
    try {
      const sampledColor = await sampleFrameColor(activeFrame, point);
      updateProject((next) => {
        next.cleanup.mode = "sampled-color";
        next.cleanup.sampledColor = sampledColor;
        return next;
      });
    } finally {
      setSamplingColor(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await compileCompanion(project, frames, author, license);
      await onSaved(result.companion, result.files);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = stepOrder.indexOf(project.step);
  const canContinue =
    project.step === "import"
      ? Boolean(project.source?.files.length)
      : frames.length > 0;

  return (
    <div className="companion-creator page">
      <header className="creator-header">
        <button className="button button--ghost" onClick={onBack}>
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
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-button"
            onClick={redo}
            disabled={future.length === 0}
            aria-label={c.redo}
          >
            <Redo2 size={16} />
          </button>
          <button
            className="button button--ghost"
            onClick={() => setProject(stepBaseline.current)}
          >
            <RotateCcw size={15} /> {c.resetStep}
          </button>
          <button
            className="button button--ghost"
            onClick={() => {
              setProject(createCompanionProject());
              setFrames([]);
              setSourceFiles([]);
            }}
          >
            <RotateCcw size={15} /> {c.resetAll}
          </button>
        </div>
      </header>

      <nav className="creator-steps" aria-label={c.title}>
        {stepOrder.map((step, index) => (
          <button
            key={step}
            className={
              project.step === step
                ? "creator-step creator-step--active"
                : index < stepIndex
                  ? "creator-step creator-step--complete"
                  : "creator-step"
            }
            onClick={() => (index === 0 || frames.length > 0) && setStep(step)}
            disabled={index > 1 && frames.length === 0}
          >
            <span>{index < stepIndex ? <Check size={13} /> : index + 1}</span>
            {c.steps[step]}
          </button>
        ))}
      </nav>

      {error && (
        <div className="creator-error" role="alert">
          {error}
        </div>
      )}
      {busy && (
        <div className="creator-progress" aria-live="polite">
          <LoaderCircle className="spin" size={16} /> {c.processing}
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      <div className="creator-workbench">
        <main className="creator-stage">
          {project.step === "import" && (
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
                  >
                    <Icon size={21} />
                    <strong>{label}</strong>
                    <span>
                      {kind === "video"
                        ? "MP4 / MOV · H.264"
                        : kind === "sequence"
                          ? "PNG / JPEG / WebP"
                          : kind === "atlas"
                            ? "Grid slice"
                            : "Transparent preferred"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="creator-dropzone"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={22} />
                <strong>{c.chooseFiles}</strong>
                <span>
                  {project.source?.files.map((file) => file.name).join(", ") ||
                    "No source selected"}
                </span>
              </button>
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple={project.source?.kind === "sequence"}
                accept={
                  project.source?.kind === "video"
                    ? "video/mp4,video/quicktime,video/webm"
                    : "image/png,image/jpeg,image/webp"
                }
                onChange={onFiles}
              />
            </section>
          )}

          {project.step === "extract" && (
            <section className="creator-panel">
              <div className="creator-panel__intro">
                <Scissors size={20} />
                <div>
                  <h2>{c.steps.extract}</h2>
                  <p>
                    {project.source?.kind === "atlas"
                      ? "Define the grid. Every cell is shown before it becomes a logical frame."
                      : "Frame density controls direction detail, not source resolution."}
                  </p>
                </div>
              </div>
              {project.source?.kind === "video" && (
                <div className="creator-form-grid">
                  <label>
                    Start (seconds)
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={(project.source.videoRange?.startMs ?? 0) / 1000}
                      onChange={(event) =>
                        updateProject((next) => {
                          next.source!.videoRange!.startMs =
                            Number(event.target.value) * 1000;
                          return next;
                        })
                      }
                    />
                  </label>
                  <label>
                    End (seconds)
                    <input
                      type="number"
                      min={0.1}
                      max={30}
                      step={0.1}
                      value={(project.source.videoRange?.endMs ?? 30000) / 1000}
                      onChange={(event) =>
                        updateProject((next) => {
                          next.source!.videoRange!.endMs =
                            Number(event.target.value) * 1000;
                          return next;
                        })
                      }
                    />
                  </label>
                  <label>
                    Extraction FPS
                    <input
                      type="number"
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
                </div>
              )}
              {project.source?.kind === "atlas" && project.source.atlas && (
                <>
                  <AtlasGridPreview
                    file={sourceFiles[0]}
                    settings={project.source.atlas}
                  />
                  <div className="creator-form-grid creator-form-grid--atlas">
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
                      <label key={field}>
                        {field}
                        <input
                          type="number"
                          min={
                            field.includes("margin") || field.includes("gap")
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
                    <label>
                      Read order
                      <select
                        value={project.source.atlas.order}
                        onChange={(event) =>
                          updateProject((next) => {
                            next.source!.atlas!.order = event.target.value as
                              "row-major" | "column-major";
                            return next;
                          })
                        }
                      >
                        <option value="row-major">Row major</option>
                        <option value="column-major">Column major</option>
                      </select>
                    </label>
                    <label>
                      Page
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={project.source.atlas.page}
                        onChange={(event) =>
                          updateProject((next) => {
                            next.source!.atlas!.page = Number(
                              event.target.value,
                            );
                            return next;
                          })
                        }
                      />
                    </label>
                  </div>
                </>
              )}
              <button
                className="button button--primary creator-primary-action"
                onClick={processSource}
                disabled={busy || sourceFiles.length === 0}
              >
                <CirclePlay size={17} /> {c.extract}
              </button>
            </section>
          )}

          {project.step === "cleanup" && (
            <section className="creator-panel">
              <div className="creator-panel__intro">
                <Eraser size={20} />
                <div>
                  <h2>{c.steps.cleanup}</h2>
                  <p>{c.cleanupHelp}</p>
                </div>
              </div>
              <div className="cleanup-preview-grid">
                {(["transparent", "black", "white", "theme"] as const).map(
                  (background) => (
                    <div
                      key={background}
                      className={`frame-inspector frame-inspector--${background}`}
                    >
                      {activeFrame && <img src={activeFrame.url} alt="" />}
                    </div>
                  ),
                )}
              </div>
              <CleanupBrushStage
                frame={activeFrame}
                strokes={project.cleanup.strokes}
                frameIndex={activeLogical?.sourceIndex ?? 0}
                brushMode={brushMode}
                brushSize={brushSize}
                sampling={samplingColor}
                onStroke={addCleanupStroke}
                onSample={(point) => void pickCleanupColor(point)}
              />
              <div
                className="cleanup-brush-toolbar"
                role="toolbar"
                aria-label={c.steps.cleanup}
              >
                <div className="cleanup-brush-modes">
                  <button
                    className={
                      brushMode === "keep" && !samplingColor ? "is-active" : ""
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
                      brushMode === "erase" && !samplingColor ? "is-active" : ""
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
                <label>
                  {c.brushSize}
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={brushSize}
                    onChange={(event) =>
                      setBrushSize(Number(event.target.value))
                    }
                  />
                  <span>{brushSize}px</span>
                </label>
                <label>
                  {locale === "zh-CN" ? "作用范围" : "Apply to"}
                  <select
                    value={brushScope}
                    onChange={(event) =>
                      setBrushScope(event.target.value as "current" | "all")
                    }
                  >
                    <option value="current">{c.currentFrameOnly}</option>
                    <option value="all">{c.allFrames}</option>
                  </select>
                </label>
              </div>
              <div className="creator-form-grid">
                <label className="field-wide">
                  Background mode
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
                    <option value="preserve-alpha">{c.preserveAlpha}</option>
                    <option value="sampled-color">{c.sampledColor}</option>
                  </select>
                </label>
                <label>
                  Sample color
                  <input
                    type="color"
                    value={project.cleanup.sampledColor}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.cleanup.sampledColor = event.target.value;
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  Tolerance
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.cleanup.tolerance}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.cleanup.tolerance = Number(event.target.value);
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  Feather
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={project.cleanup.feather}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.cleanup.feather = Number(event.target.value);
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  Despill
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.cleanup.despill}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.cleanup.despill = Number(event.target.value);
                        return next;
                      })
                    }
                  />
                </label>
                <label className="creator-check-field">
                  <input
                    type="checkbox"
                    checked={project.cleanup.connectedSubject}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.cleanup.connectedSubject = event.target.checked;
                        return next;
                      })
                    }
                  />
                  {locale === "zh-CN"
                    ? "仅保留主要连通主体"
                    : "Keep the primary connected subject"}
                </label>
              </div>
              <div className="corner-mask-control">
                <span>
                  {locale === "zh-CN"
                    ? "角落遮罩（用于不覆盖主体的水印）"
                    : "Corner masks for watermarks outside the subject"}
                </span>
                <div>
                  {(
                    [
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                    ] as const
                  ).map((corner) => {
                    const active = project.cleanup.cornerMasks.some(
                      (mask) => mask.corner === corner,
                    );
                    return (
                      <button
                        key={corner}
                        className={
                          active
                            ? "button button--ghost corner-mask--active"
                            : "button button--ghost"
                        }
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
                      >
                        {corner}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                className="button button--primary creator-primary-action"
                onClick={processCleanup}
                disabled={busy}
              >
                <Eraser size={17} /> {c.processCleanup}
              </button>
            </section>
          )}

          {project.step === "align" && (
            <section className="creator-panel">
              <div className="creator-panel__intro">
                <Crop size={20} />
                <div>
                  <h2>{c.steps.align}</h2>
                  <p>{c.alignHelp}</p>
                </div>
              </div>
              <FrameStage
                frame={activeFrame}
                project={project}
                currentFrame={currentFrame}
                overlay
              />
              <div className="creator-form-grid">
                {project.sharedCrop &&
                  (["x", "y", "width", "height"] as const).map((field) => (
                    <label key={field}>
                      {c.sharedCrop} {field.toUpperCase()}
                      <input
                        type="number"
                        min={field === "width" || field === "height" ? 1 : 0}
                        value={Math.round(project.sharedCrop![field])}
                        onChange={(event) =>
                          updateProject((next) => {
                            next.sharedCrop![field] = Number(
                              event.target.value,
                            );
                            return next;
                          })
                        }
                      />
                    </label>
                  ))}
                <label>
                  {c.groundLine}
                  <input
                    type="number"
                    value={project.groundLine ?? 0}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.groundLine = Number(event.target.value);
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  {c.baselineX}
                  <input
                    type="number"
                    value={activeLogical?.baselineOffset.x ?? 0}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.frames[currentFrame]!.baselineOffset.x = Number(
                          event.target.value,
                        );
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  {c.baselineY}
                  <input
                    type="number"
                    value={activeLogical?.baselineOffset.y ?? 0}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.frames[currentFrame]!.baselineOffset.y = Number(
                          event.target.value,
                        );
                        return next;
                      })
                    }
                  />
                </label>
              </div>
            </section>
          )}

          {project.step === "calibrate" && (
            <section className="creator-panel creator-calibrate">
              <div className="creator-panel__intro">
                <MousePointer2 size={20} />
                <div>
                  <h2>{c.steps.calibrate}</h2>
                  <p>{c.calibrateHelp}</p>
                </div>
              </div>
              <div className="calibration-grid">
                <FrameStage
                  frame={activeFrame}
                  project={project}
                  currentFrame={currentFrame}
                />
                <div>
                  <DirectionDial
                    angle={angle}
                    onChange={setAngle}
                    label="Direction"
                  />
                  <button
                    className="button button--primary"
                    onClick={setAnchor}
                  >
                    {c.addAnchor}
                  </button>
                  <p className="calibration-count">
                    {project.directionAnchors.length} anchors · recommended 8+
                  </p>
                </div>
              </div>
              <DirectionTimeline
                project={project}
                frames={frames}
                currentFrame={currentFrame}
                onSelect={(index) => {
                  setCurrentFrame(index);
                  const anchor = project.directionAnchors.find(
                    (item) => item.frameIndex === index,
                  );
                  if (anchor) setAngle(anchor.angle);
                }}
              />
              <CalibrationHealth calibration={calibration} project={project} />
              <div className="creator-form-grid calibration-range-tools">
                <label>
                  {c.rangeStart}
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, project.frames.length - 1)}
                    value={calibrationStart}
                    onChange={(event) =>
                      setCalibrationStart(Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  {c.rangeEnd}
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, project.frames.length - 1)}
                    value={calibrationEnd}
                    onChange={(event) =>
                      setCalibrationEnd(Number(event.target.value))
                    }
                  />
                </label>
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
            </section>
          )}

          {project.step === "motions" && (
            <section className="creator-panel">
              <div className="creator-panel__intro">
                <Sparkles size={20} />
                <div>
                  <h2>{c.steps.motions}</h2>
                  <p>{c.motionsHelp}</p>
                </div>
              </div>
              <DirectionTimeline
                project={project}
                frames={frames}
                currentFrame={currentFrame}
                onSelect={setCurrentFrame}
              />
              <div className="creator-form-grid">
                <label>
                  {c.rangeStart}
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, project.frames.length - 1)}
                    value={motionStart}
                    onChange={(event) =>
                      setMotionStart(Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  {c.rangeEnd}
                  <input
                    type="number"
                    min={motionStart}
                    max={Math.max(0, project.frames.length - 1)}
                    value={motionEnd}
                    onChange={(event) =>
                      setMotionEnd(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  className="button button--primary"
                  onClick={() =>
                    updateProject((next) => {
                      next.motionRanges.push({
                        id: crypto.randomUUID(),
                        name: `Idle ${next.motionRanges.length + 1}`,
                        poseAnchorIds: [],
                        startFrame: motionStart,
                        endFrame: motionEnd,
                        playback: "forward",
                        speed: 1,
                        minimumDelayMs: 2500,
                        maximumDelayMs: 8000,
                      });
                      return next;
                    })
                  }
                >
                  {c.addMotion}
                </button>
              </div>
              <div className="motion-list">
                {project.motionRanges.map((motion) => (
                  <div key={motion.id} className="motion-card">
                    <input
                      aria-label="Motion name"
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
                      {motion.startFrame}–{motion.endFrame}
                    </span>
                    <label>
                      Playback
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
                        <option value="forward">Forward</option>
                        <option value="ping-pong">Ping-pong</option>
                      </select>
                    </label>
                    <label>
                      Speed
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
                            )!.speed = Number(event.target.value);
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
                    <button
                      className="icon-button"
                      onClick={() =>
                        updateProject((next) => {
                          next.motionRanges = next.motionRanges.filter(
                            (item) => item.id !== motion.id,
                          );
                          return next;
                        })
                      }
                    >
                      <Eraser size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {project.step === "test" && (
            <section className="creator-panel">
              <div className="creator-panel__intro">
                <CirclePlay size={20} />
                <div>
                  <h2>{c.steps.test}</h2>
                  <p>{c.testHelp}</p>
                </div>
              </div>
              <PointerTestStage
                frame={frames.find(
                  (item) =>
                    item.sourceIndex ===
                    project.frames[previewFrameIndex]?.sourceIndex,
                )}
                pointer={pointer}
                onPointer={setPointer}
                label={c.followPointer}
              />
              <div className="creator-form-grid">
                <label className="field-wide">
                  {c.name}
                  <input
                    value={project.name}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.name = event.target.value;
                        return next;
                      })
                    }
                  />
                </label>
                <label>
                  {c.author}
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                  />
                </label>
                <label>
                  {c.license}
                  <select
                    value={license}
                    onChange={(event) => setLicense(event.target.value)}
                  >
                    <option>CC-BY-4.0</option>
                    <option>CC0-1.0</option>
                    <option>MIT</option>
                    <option>Proprietary</option>
                  </select>
                </label>
                <label>
                  Follow smoothing
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
                <label>
                  Render cap
                  <select
                    value={project.preview.renderFps}
                    onChange={(event) =>
                      updateProject((next) => {
                        next.preview.renderFps = Number(event.target.value) as
                          24 | 30 | 60;
                        return next;
                      })
                    }
                  >
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </label>
              </div>
              <button
                className="button button--primary creator-primary-action"
                onClick={save}
                disabled={busy}
              >
                <Save size={17} /> {c.save}
              </button>
            </section>
          )}
        </main>

        {frames.length > 0 && (
          <aside className="creator-frame-strip">
            <div className="creator-frame-strip__header">
              <strong>{frames.length} frames</strong>
              <span>
                {c.frame} {currentFrame + 1}
              </span>
            </div>
            <div className="creator-frame-strip__items">
              {project.frames.map((logical, index) => {
                const frame = frames.find(
                  (item) => item.sourceIndex === logical.sourceIndex,
                );
                return (
                  <button
                    key={logical.id}
                    className={
                      currentFrame === index
                        ? "frame-thumb frame-thumb--active"
                        : logical.excluded
                          ? "frame-thumb frame-thumb--excluded"
                          : "frame-thumb"
                    }
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

      <footer className="creator-footer">
        <button
          className="button button--ghost"
          disabled={stepIndex === 0}
          onClick={() => setStep(stepOrder[stepIndex - 1]!)}
        >
          <ChevronLeft size={15} /> {c.previous}
        </button>
        <span>
          {project.updatedAt
            ? `Autosaved ${new Date(project.updatedAt).toLocaleTimeString(locale)}`
            : ""}
        </span>
        {project.step !== "test" && (
          <button
            className="button button--primary"
            disabled={
              !canContinue ||
              (project.step === "extract" && frames.length === 0)
            }
            onClick={() => setStep(stepOrder[stepIndex + 1]!)}
          >
            {c.next} <ChevronRight size={15} />
          </button>
        )}
      </footer>
    </div>
  );
}

function FrameStage({
  frame,
  project,
  currentFrame,
  overlay = false,
}: {
  frame?: ExtractedFrame;
  project: CompanionCreatorProject;
  currentFrame: number;
  overlay?: boolean;
}) {
  return (
    <div className="alignment-stage">
      {frame && <img src={frame.url} alt="" />}
      {overlay && project.sharedCrop && (
        <span
          className="shared-crop-box"
          style={{
            left: `${(project.sharedCrop.x / frame!.width) * 100}%`,
            top: `${(project.sharedCrop.y / frame!.height) * 100}%`,
            width: `${(project.sharedCrop.width / frame!.width) * 100}%`,
            height: `${(project.sharedCrop.height / frame!.height) * 100}%`,
          }}
        />
      )}
      {overlay && project.groundLine !== null && frame && (
        <span
          className="ground-line"
          style={{ top: `${(project.groundLine / frame.height) * 100}%` }}
        />
      )}
      <span className="stage-index">{currentFrame + 1}</span>
    </div>
  );
}

function DirectionTimeline({
  project,
  frames,
  currentFrame,
  onSelect,
}: {
  project: CompanionCreatorProject;
  frames: ExtractedFrame[];
  currentFrame: number;
  onSelect: (index: number) => void;
}) {
  const calibration = calibrateDirections(
    project.frames,
    project.directionAnchors,
  );
  const points = calibration.frameAngles
    .flatMap((angle, index) =>
      angle === null
        ? []
        : [
            `${(index / Math.max(1, project.frames.length - 1)) * 100},${100 - (angle / 360) * 100}`,
          ],
    )
    .join(" ");
  return (
    <div className="direction-timeline">
      <div className="direction-timeline__curve">
        <span>Direction</span>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Direction curve"
        >
          <polyline points={points} />
        </svg>
      </div>
      <div className="direction-timeline__track">
        <span>Idle motion</span>
        {project.motionRanges.map((motion) => (
          <i
            key={motion.id}
            style={{
              left: `${(motion.startFrame / project.frames.length) * 100}%`,
              width: `${((motion.endFrame - motion.startFrame + 1) / project.frames.length) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="direction-timeline__track direction-timeline__track--exclude">
        <span>Exclude</span>
        {project.frames.map(
          (frame, index) =>
            frame.excluded && (
              <i
                key={frame.id}
                style={{
                  left: `${(index / project.frames.length) * 100}%`,
                  width: `${100 / project.frames.length}%`,
                }}
              />
            ),
        )}
      </div>
      <div className="timeline-thumbs">
        {project.frames.map((logical, index) => {
          const frame = frames.find(
            (item) => item.sourceIndex === logical.sourceIndex,
          );
          const anchor = project.directionAnchors.find(
            (item) => item.frameIndex === index,
          );
          return (
            <button
              key={logical.id}
              className={
                index === currentFrame
                  ? "timeline-thumb timeline-thumb--active"
                  : "timeline-thumb"
              }
              onClick={() => onSelect(index)}
            >
              {frame && <img src={frame.url} alt="" />}
              {anchor && <span>{Math.round(anchor.angle)}°</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PointerTestStage({
  frame,
  pointer,
  onPointer,
  label,
}: {
  frame?: ExtractedFrame;
  pointer: { x: number; y: number };
  onPointer: (pointer: { x: number; y: number }) => void;
  label: string;
}) {
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPointer({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };
  return (
    <div
      className="pointer-test-stage"
      onPointerMove={update}
      aria-label={label}
    >
      <div className="mock-composer-edge">WORKSPACE COMPOSER</div>
      {frame && <img src={frame.url} alt="" />}
      <span
        className="pointer-dot"
        style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
      />
    </div>
  );
}

function CleanupBrushStage({
  frame,
  strokes,
  frameIndex,
  brushMode,
  brushSize,
  sampling,
  onStroke,
  onSample,
}: {
  frame?: ExtractedFrame;
  strokes: CompanionCreatorProject["cleanup"]["strokes"];
  frameIndex: number;
  brushMode: "keep" | "erase";
  brushSize: number;
  sampling: boolean;
  onStroke: (points: Array<{ x: number; y: number }>) => void;
  onSample: (point: { x: number; y: number }) => void;
}) {
  const [draft, setDraft] = useState<Array<{ x: number; y: number }>>([]);
  const pointForEvent = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          frame?.width ?? 1,
          ((event.clientX - rect.left) / rect.width) * (frame?.width ?? 1),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          frame?.height ?? 1,
          ((event.clientY - rect.top) / rect.height) * (frame?.height ?? 1),
        ),
      ),
    };
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (sampling) return;
    const points = [...draft, pointForEvent(event)];
    setDraft([]);
    onStroke(points);
  };
  const visible = strokes.filter(
    (stroke) => stroke.frame === "all" || stroke.frame === frameIndex,
  );
  const path = (points: Array<{ x: number; y: number }>) =>
    points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div
      className={
        "cleanup-brush-stage" +
        (sampling ? " cleanup-brush-stage--sampling" : "")
      }
    >
      {frame && <img src={frame.url} alt="" />}
      {frame && (
        <svg
          viewBox={`0 0 ${frame.width} ${frame.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={
            sampling ? "Pick background color" : `${brushMode} mask brush`
          }
          onPointerDown={(event) => {
            const point = pointForEvent(event);
            if (sampling) {
              onSample(point);
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            setDraft([point]);
          }}
          onPointerMove={(event) => {
            if (
              sampling ||
              !event.currentTarget.hasPointerCapture(event.pointerId)
            )
              return;
            const point = pointForEvent(event);
            setDraft((points) => {
              const previous = points.at(-1);
              if (
                previous &&
                Math.hypot(point.x - previous.x, point.y - previous.y) < 3
              )
                return points;
              return [...points, point];
            });
          }}
          onPointerUp={finish}
          onPointerCancel={() => setDraft([])}
        >
          {visible.map((stroke, index) => (
            <polyline
              key={`${stroke.mode}-${index}`}
              points={path(stroke.points)}
              className={`cleanup-stroke cleanup-stroke--${stroke.mode}`}
              style={{ strokeWidth: stroke.radius * 2 }}
            />
          ))}
          {draft.length > 0 && (
            <polyline
              points={path(draft)}
              className={`cleanup-stroke cleanup-stroke--${brushMode} cleanup-stroke--draft`}
              style={{ strokeWidth: brushSize * 2 }}
            />
          )}
        </svg>
      )}
      <span>{sampling ? "PICK" : brushMode.toUpperCase()}</span>
    </div>
  );
}

function AtlasGridPreview({
  file,
  settings,
}: {
  file?: File;
  settings: AtlasSliceSettings;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  const overflow = new Set(
    atlasOverflow(dimensions.width, dimensions.height, settings),
  );
  return (
    <div className="atlas-grid-preview">
      {url ? (
        <img
          src={url}
          alt="Sprite atlas source"
          onLoad={(event) =>
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
        />
      ) : (
        <span>Select an atlas image to preview its grid.</span>
      )}
      {dimensions.width > 0 &&
        Array.from(
          { length: Math.min(512, settings.columns * settings.rows) },
          (_, index) => {
            const rect = atlasCellRect(index, settings);
            return (
              <i
                key={index}
                className={overflow.has(index) ? "is-overflow" : ""}
                style={{
                  left: `${(rect.x / dimensions.width) * 100}%`,
                  top: `${(rect.y / dimensions.height) * 100}%`,
                  width: `${(rect.width / dimensions.width) * 100}%`,
                  height: `${(rect.height / dimensions.height) * 100}%`,
                }}
              >
                {index + 1}
              </i>
            );
          },
        )}
      {overflow.size > 0 && (
        <strong role="alert">
          {overflow.size} cells exceed the source image.
        </strong>
      )}
    </div>
  );
}

function CalibrationHealth({
  calibration,
  project,
}: {
  calibration: DirectionCalibration;
  project: CompanionCreatorProject;
}) {
  const activeDeltas = project.frames
    .filter((frame) => !frame.excluded)
    .map((frame) => frame.visualDelta)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const median = activeDeltas[Math.floor(activeDeltas.length / 2)] ?? 0;
  const jumpCount = project.frames.filter(
    (frame) => !frame.excluded && median > 0 && frame.visualDelta > median * 4,
  ).length;
  const sortedAnchors = [...project.directionAnchors].sort(
    (left, right) => left.frameIndex - right.frameIndex,
  );
  const first = sortedAnchors[0]?.angle;
  const last = sortedAnchors.at(-1)?.angle;
  const seam =
    first === undefined || last === undefined
      ? null
      : Math.abs(((last - first + 540) % 360) - 180);
  return (
    <div className="calibration-health" aria-live="polite">
      <span>
        <AlertTriangle size={14} />
        {calibration.warnings.length === 0
          ? "Direction range covered"
          : `${calibration.warnings.length} calibration warnings`}
      </span>
      <span>
        {jumpCount === 0
          ? "No large visual jumps"
          : `${jumpCount} possible skipped-frame jumps`}
      </span>
      <span>
        {seam === null
          ? "Add anchors to check the seam"
          : `0° / 360° seam: ${Math.round(seam)}°`}
      </span>
      {calibration.warnings.map((warning) => (
        <small key={warning}>{warning.replaceAll("-", " ")}</small>
      ))}
    </div>
  );
}
