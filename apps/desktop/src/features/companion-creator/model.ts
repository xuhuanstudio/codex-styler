export const COMPANION_PROJECT_FORMAT =
  "codex-styler-companion-project-v1" as const;

export type CompanionImportKind = "image" | "sequence" | "video" | "atlas";
export type CreatorStep =
  "import" | "extract" | "cleanup" | "align" | "calibrate" | "motions" | "test";

export interface SourceDescriptor {
  kind: CompanionImportKind;
  files: Array<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
    storedPath?: string;
  }>;
  videoRange?: { startMs: number; endMs: number };
  extractionFps?: number;
  atlas?: AtlasSliceSettings;
}

export interface AtlasSliceSettings {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  order: "row-major" | "column-major";
  page: number;
}

export interface FrameBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LogicalFrame {
  id: string;
  sourceIndex: number;
  sourceTimeMs?: number;
  excluded: boolean;
  visualDelta: number;
  baselineOffset: { x: number; y: number };
  subjectBounds?: FrameBounds;
}

export interface DirectionAnchor {
  id: string;
  frameIndex: number;
  /** 0° is up and values increase clockwise. */
  angle: number;
}

export interface MotionRange {
  id: string;
  name: string;
  poseAnchorIds: string[];
  startFrame: number;
  endFrame: number;
  playback: "forward" | "ping-pong";
  speed: number;
  minimumDelayMs: number;
  maximumDelayMs: number;
}

export interface CleanupSettings {
  mode: "preserve-alpha" | "sampled-color";
  sampledColor: string;
  tolerance: number;
  feather: number;
  despill: number;
  connectedSubject: boolean;
  cornerMasks: Array<{
    corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    width: number;
    height: number;
  }>;
  strokes: Array<{
    frame: number | "all";
    mode: "keep" | "erase";
    points: Array<{ x: number; y: number }>;
    radius: number;
  }>;
}

export interface CompanionCreatorProject {
  format: typeof COMPANION_PROJECT_FORMAT;
  id: string;
  name: string;
  updatedAt: string;
  step: CreatorStep;
  source: SourceDescriptor | null;
  frames: LogicalFrame[];
  sharedCrop: FrameBounds | null;
  groundLine: number | null;
  cleanup: CleanupSettings;
  directionAnchors: DirectionAnchor[];
  motionRanges: MotionRange[];
  neutralFrame: number;
  reducedMotionFrame: number;
  preview: {
    background: "transparent" | "black" | "white" | "theme";
    frameRate: number;
    followSmoothing: number;
    renderFps: 24 | 30 | 60;
  };
}

export function createCompanionProject(
  id = `companion-${crypto.randomUUID()}`,
): CompanionCreatorProject {
  return {
    format: COMPANION_PROJECT_FORMAT,
    id,
    name: "Untitled companion",
    updatedAt: new Date().toISOString(),
    step: "import",
    source: null,
    frames: [],
    sharedCrop: null,
    groundLine: null,
    cleanup: {
      mode: "preserve-alpha",
      sampledColor: "#ffffff",
      tolerance: 18,
      feather: 2,
      despill: 35,
      connectedSubject: true,
      cornerMasks: [],
      strokes: [],
    },
    directionAnchors: [],
    motionRanges: [],
    neutralFrame: 0,
    reducedMotionFrame: 0,
    preview: {
      background: "transparent",
      frameRate: 24,
      followSmoothing: 0.18,
      renderFps: 60,
    },
  };
}
