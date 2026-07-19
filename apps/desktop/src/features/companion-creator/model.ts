export const COMPANION_PROJECT_FORMAT =
  "codex-styler-companion-project-v1" as const;

export const DEFAULT_CONTENT_SCALE = 1;
export const MIN_CONTENT_SCALE = 0.25;
export const MAX_CONTENT_SCALE = 1.5;

export type CompanionImportKind = "image" | "sequence" | "video" | "atlas";
export type EdgeReviewBackdrop = "black" | "white" | "theme";
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
  /** Cached extracted source frame for fast local draft restoration. */
  storedPath?: string;
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
  description: string;
  author: string;
  license: string;
  updatedAt: string;
  step: CreatorStep;
  source: SourceDescriptor | null;
  frames: LogicalFrame[];
  sharedCrop: FrameBounds | null;
  groundLine: number | null;
  /** Uniform project-space scale applied around the crop center and ground line. */
  contentScale: number;
  cleanup: CleanupSettings;
  directionAnchors: DirectionAnchor[];
  motionRanges: MotionRange[];
  neutralFrame: number;
  reducedMotionFrame: number;
  placement: {
    align: number;
    offsetX: number;
    offsetY: number;
    size: number;
  };
  preview: {
    background: "transparent" | "black" | "white" | "theme";
    frameRate: number;
    followSmoothing: number;
    renderFps: 24 | 30 | 60;
  };
  qualityReview: {
    /** Backdrops explicitly inspected against the latest compiled pixels. */
    edgeBackdrops: EdgeReviewBackdrop[];
    /** Fingerprint of the pixels, crop and alignment that were inspected. */
    edgeSignature: string | null;
  };
}

export function suggestedCompanionName(fileName: string): string {
  const words = fileName
    .replace(/\.[^.]+$/u, "")
    .replace(/([\p{Ll}\d])(\p{Lu})/gu, "$1 $2")
    .replace(/[_\-.]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  while (
    words.length > 1 &&
    /^(?:portrait|sprite|spritesheet|atlas|frames?|sequence|cutout|transparent)$/iu.test(
      words.at(-1) ?? "",
    )
  ) {
    words.pop();
  }
  const name = words
    .map((word) =>
      /^[a-z]/u.test(word)
        ? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
        : word,
    )
    .join(" ")
    .slice(0, 64)
    .trim();
  return name || "Untitled companion";
}

export function createCompanionProject(
  id = `companion-${crypto.randomUUID()}`,
): CompanionCreatorProject {
  return {
    format: COMPANION_PROJECT_FORMAT,
    id,
    name: "Untitled companion",
    description: "",
    author: "",
    license: "",
    updatedAt: new Date().toISOString(),
    step: "import",
    source: null,
    frames: [],
    sharedCrop: null,
    groundLine: null,
    contentScale: DEFAULT_CONTENT_SCALE,
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
    placement: {
      align: 0.82,
      offsetX: 0,
      offsetY: 2,
      size: 120,
    },
    preview: {
      background: "transparent",
      frameRate: 24,
      followSmoothing: 0.18,
      renderFps: 60,
    },
    qualityReview: {
      edgeBackdrops: [],
      edgeSignature: null,
    },
  };
}

export function resetCompanionProjectDerivedState(
  project: CompanionCreatorProject,
): void {
  const defaults = createCompanionProject(project.id);
  project.frames = [];
  project.sharedCrop = null;
  project.groundLine = null;
  project.contentScale = defaults.contentScale;
  project.cleanup = structuredClone(defaults.cleanup);
  project.directionAnchors = [];
  project.motionRanges = [];
  project.qualityReview = structuredClone(defaults.qualityReview);
  project.neutralFrame = 0;
  project.reducedMotionFrame = 0;
  project.step = "import";
}

/**
 * A newly opened studio should not become a visible draft until the user has
 * imported media or changed meaningful project data. `updatedAt` and `id` are
 * intentionally ignored because both are generated when the studio opens.
 */
export function companionProjectIsPristine(
  project: CompanionCreatorProject,
): boolean {
  const defaults = createCompanionProject(project.id);
  return (
    project.step === defaults.step &&
    (project.source === null || project.source.files.length === 0) &&
    project.frames.length === 0 &&
    project.sharedCrop === null &&
    project.groundLine === null &&
    project.contentScale === defaults.contentScale &&
    project.directionAnchors.length === 0 &&
    project.motionRanges.length === 0 &&
    project.name === defaults.name &&
    project.description === defaults.description &&
    project.author === defaults.author &&
    project.license === defaults.license
  );
}

export function normalizeCompanionProject(
  project: CompanionCreatorProject,
): CompanionCreatorProject {
  const defaults = createCompanionProject(project.id);
  const directionAnchors = structuredClone(project.directionAnchors ?? []);
  const anchorIds = new Set(directionAnchors.map((anchor) => anchor.id));
  return {
    ...defaults,
    ...structuredClone(project),
    description: project.description ?? defaults.description,
    author: project.author ?? defaults.author,
    license: project.license ?? defaults.license,
    contentScale: Math.max(
      MIN_CONTENT_SCALE,
      Math.min(
        MAX_CONTENT_SCALE,
        Number.isFinite(project.contentScale)
          ? project.contentScale
          : defaults.contentScale,
      ),
    ),
    placement: {
      ...defaults.placement,
      ...(project.placement ?? {}),
    },
    preview: {
      ...defaults.preview,
      ...project.preview,
    },
    qualityReview: {
      edgeBackdrops: [
        ...new Set(
          (project.qualityReview?.edgeBackdrops ?? []).filter(
            (backdrop): backdrop is EdgeReviewBackdrop =>
              backdrop === "black" ||
              backdrop === "white" ||
              backdrop === "theme",
          ),
        ),
      ],
      edgeSignature:
        typeof project.qualityReview?.edgeSignature === "string"
          ? project.qualityReview.edgeSignature
          : null,
    },
    directionAnchors,
    motionRanges: (project.motionRanges ?? []).map((motion) => {
      const validPoseIds = (motion.poseAnchorIds ?? []).filter((id) =>
        anchorIds.has(id),
      );
      return {
        ...structuredClone(motion),
        poseAnchorIds:
          validPoseIds.length > 0
            ? validPoseIds
            : directionAnchors.map((anchor) => anchor.id),
      };
    }),
  };
}
