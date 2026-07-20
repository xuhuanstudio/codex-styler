import {
  COMPANION_FORMAT,
  companionFromPackage,
  validateCompanion,
  type CompanionDefinition,
  type CompanionIdleClip,
  type CompanionPackageDefinition,
  type CompanionPose,
} from "@codex-styler/theme-core";
import { calibrateDirections, normalizeAngle } from "./calibration";
import { companionPackageId, companionSlug } from "./companion-id";
import { drawLogicalFrame } from "./frame-renderer";
import type { ExtractedFrame } from "./media";
import type {
  CompanionCreatorProject,
  FrameBounds,
  LogicalFrame,
} from "./model";
import { assignedPoseIdsForMotion, validateMotionRanges } from "./motions";

export const decodedPageLimit = 48 * 1024 * 1024;
export const encodedFileLimit = 20 * 1024 * 1024;
export const atlasPageLimit = 8;
export const rasterDimensionLimit = 8192;

export function assertEncodedFileSize(size: number): void {
  if (size > encodedFileLimit) {
    throw new Error(
      "A generated companion asset exceeds the 20 MiB package limit",
    );
  }
}

export function assertOutputCanvasSize(width: number, height: number): void {
  if (
    width < 1 ||
    height < 1 ||
    width > rasterDimensionLimit ||
    height > rasterDimensionLimit
  ) {
    throw new Error(
      `The shared canvas must be between 1 and ${rasterDimensionLimit} pixels on each side`,
    );
  }
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/webp",
  quality = 0.94,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not encode companion asset")),
      type,
      quality,
    );
  });
}

function bytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read encoded image bytes"));
    reader.readAsArrayBuffer(blob);
  });
}

type RasterExtension = "png" | "jpg" | "webp";

interface EncodedCanvasAsset {
  bytes: Uint8Array;
  extension: RasterExtension;
}

export function rasterExtensionForBytes(
  value: Uint8Array,
): RasterExtension | null {
  if (
    value.length > 8 &&
    value[0] === 0x89 &&
    value[1] === 0x50 &&
    value[2] === 0x4e &&
    value[3] === 0x47
  ) {
    return "png";
  }
  if (value.length > 3 && value[0] === 0xff && value[1] === 0xd8) {
    return "jpg";
  }
  if (
    value.length > 12 &&
    String.fromCharCode(...value.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...value.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

async function encodedCanvasAsset(
  canvas: HTMLCanvasElement,
): Promise<EncodedCanvasAsset> {
  const encoded = await bytes(await canvasBlob(canvas));
  assertEncodedFileSize(encoded.byteLength);
  const extension = rasterExtensionForBytes(encoded);
  if (!extension) {
    throw new Error("The locally encoded companion image has an unknown type");
  }
  return { bytes: encoded, extension };
}

function nearestPackedFrame(
  sourceFrame: number,
  packedIndexes: Map<number, number>,
): number {
  const exact = packedIndexes.get(sourceFrame);
  if (exact !== undefined) return exact;
  const candidates = [...packedIndexes.entries()];
  candidates.sort(
    ([left], [right]) =>
      Math.abs(left - sourceFrame) - Math.abs(right - sourceFrame),
  );
  return candidates[0]?.[1] ?? 0;
}

export function atlasPackLayout(
  frameWidth: number,
  frameHeight: number,
  count: number,
) {
  assertOutputCanvasSize(frameWidth, frameHeight);
  const cellBytes = frameWidth * frameHeight * 4;
  const byMemory = Math.max(1, Math.floor(decodedPageLimit / cellBytes));
  const maxColumns = Math.max(
    1,
    Math.min(16, Math.floor(rasterDimensionLimit / frameWidth)),
  );
  const maxRows = Math.max(
    1,
    Math.min(16, Math.floor(rasterDimensionLimit / frameHeight)),
  );
  const pageCapacity = Math.max(
    1,
    Math.min(256, byMemory, maxColumns * maxRows),
  );
  const columns = Math.min(
    maxColumns,
    Math.max(1, Math.ceil(Math.sqrt(pageCapacity))),
  );
  const rows = Math.min(
    maxRows,
    Math.max(1, Math.floor(pageCapacity / columns)),
  );
  const framesPerPage = Math.max(1, columns * rows);
  const pages = Math.ceil(count / framesPerPage);
  if (pages > atlasPageLimit) {
    throw new Error(
      "The shared canvas is too large for eight safe atlas pages. Reduce empty canvas area or exclude frames.",
    );
  }
  return { columns, rows, framesPerPage, pages };
}

export function expandMotionFrames<T>(
  frames: T[],
  playback: "forward" | "ping-pong",
): T[] {
  return playback === "ping-pong" && frames.length > 2
    ? [...frames, ...frames.slice(1, -1).reverse()]
    : frames;
}

async function portraitAsset(
  frame: ExtractedFrame,
  logical: LogicalFrame,
  crop: FrameBounds,
  groundLine: number | null,
  contentScale: number,
): Promise<EncodedCanvasAsset> {
  const bitmap = await createImageBitmap(frame.blob);
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = Math.ceil(crop.width);
  frameCanvas.height = Math.ceil(crop.height);
  const frameContext = frameCanvas.getContext("2d");
  if (!frameContext) throw new Error("Canvas 2D is unavailable");
  drawLogicalFrame(
    frameContext,
    bitmap,
    logical,
    crop,
    groundLine,
    contentScale,
    0,
    0,
    frameCanvas.width,
    frameCanvas.height,
  );
  bitmap.close();

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const scale =
    Math.min(size / frameCanvas.width, size / frameCanvas.height) * 0.9;
  const width = frameCanvas.width * scale;
  const height = frameCanvas.height * scale;
  context.drawImage(
    frameCanvas,
    0,
    0,
    frameCanvas.width,
    frameCanvas.height,
    (size - width) / 2,
    size - height,
    width,
    height,
  );
  return encodedCanvasAsset(canvas);
}

export interface CompiledCompanion {
  companion: CompanionDefinition;
  files: Map<string, Uint8Array>;
}

export async function compileCompanion(
  project: CompanionCreatorProject,
  extractedFrames: ExtractedFrame[],
): Promise<CompiledCompanion> {
  const author = project.author.trim();
  const license = project.license.trim();
  const crop = project.sharedCrop;
  if (!crop || crop.width < 1 || crop.height < 1) {
    throw new Error("Set a shared crop before saving the companion");
  }
  const frameBySource = new Map(
    extractedFrames.map((frame) => [frame.sourceIndex, frame]),
  );
  const activeLogicalFrames = project.frames.filter(
    (frame) => !frame.excluded && frameBySource.has(frame.sourceIndex),
  );
  if (activeLogicalFrames.length === 0) {
    throw new Error("No included frames are available");
  }
  if (activeLogicalFrames.length > 512) {
    throw new Error("A companion can contain at most 512 logical frames");
  }
  const width = Math.ceil(crop.width);
  const height = Math.ceil(crop.height);
  assertOutputCanvasSize(width, height);

  const id = companionPackageId(project);
  const entityId = companionSlug(project.name);
  const files = new Map<string, Uint8Array>();
  const portrait = await portraitAsset(
    frameBySource.get(activeLogicalFrames[0]!.sourceIndex)!,
    activeLogicalFrames[0]!,
    crop,
    project.groundLine,
    project.contentScale,
  );
  const previewPath = `previews/portrait.${portrait.extension}`;
  files.set(previewPath, portrait.bytes);

  if (activeLogicalFrames.length === 1) {
    const frame = frameBySource.get(activeLogicalFrames[0]!.sourceIndex)!;
    const bitmap = await createImageBitmap(frame.blob);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    drawLogicalFrame(
      context,
      bitmap,
      activeLogicalFrames[0]!,
      crop,
      project.groundLine,
      project.contentScale,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    bitmap.close();
    const encoded = await encodedCanvasAsset(canvas);
    const path = `assets/companion.${encoded.extension}`;
    files.set(path, encoded.bytes);
    const definition: CompanionPackageDefinition = {
      format: COMPANION_FORMAT,
      id,
      version: "0.2.0-beta.8",
      metadata: {
        name: project.name,
        description: project.description.trim(),
        author,
        license,
        tags: ["companion", "static"],
        preview: previewPath,
      },
      compatibility: { styler: { minimumVersion: "0.2.0" } },
      entity: {
        id: entityId,
        name: project.name,
        renderer: { type: "image", asset: path, normalization: "preserve" },
        behaviors: ["idle", "reduce-motion-fallback"],
        anchor: { x: project.placement.align * 100, y: 70 },
        attachment: {
          target: "composer",
          edge: "top",
          align: project.placement.align,
          offset: {
            x: project.placement.offsetX,
            y: project.placement.offsetY,
          },
        },
        size: project.placement.size,
        opacity: 1,
      },
      assets: [
        { id: "companion-image", path, type: "image", license },
        { id: "portrait", path: previewPath, type: "preview", license },
      ],
      locales: {},
    };
    const validation = validateCompanion(definition);
    if (!validation.ok) {
      throw new Error(
        validation.issues.map((issue) => issue.message).join("; "),
      );
    }
    return { companion: companionFromPackage(definition), files };
  }

  const layout = atlasPackLayout(width, height, activeLogicalFrames.length);
  const packedIndexes = new Map<number, number>();
  activeLogicalFrames.forEach((frame, index) => {
    packedIndexes.set(project.frames.indexOf(frame), index);
  });
  const pagePaths: string[] = [];
  for (let page = 0; page < layout.pages; page += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = layout.columns * width;
    canvas.height = layout.rows * height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    const first = page * layout.framesPerPage;
    const last = Math.min(
      first + layout.framesPerPage,
      activeLogicalFrames.length,
    );
    for (let packedIndex = first; packedIndex < last; packedIndex += 1) {
      const logical = activeLogicalFrames[packedIndex]!;
      const frame = frameBySource.get(logical.sourceIndex)!;
      const bitmap = await createImageBitmap(frame.blob);
      const cell = packedIndex - first;
      const x = (cell % layout.columns) * width;
      const y = Math.floor(cell / layout.columns) * height;
      drawLogicalFrame(
        context,
        bitmap,
        logical,
        crop,
        project.groundLine,
        project.contentScale,
        x,
        y,
        width,
        height,
      );
      bitmap.close();
    }
    const encoded = await encodedCanvasAsset(canvas);
    const path = `assets/atlas-${page + 1}.${encoded.extension}`;
    pagePaths.push(path);
    files.set(path, encoded.bytes);
  }

  const direction = calibrateDirections(
    project.frames,
    project.directionAnchors,
  );
  if (activeLogicalFrames.length > 1 && !direction.ready) {
    throw new Error(
      "Complete direction calibration before building this companion",
    );
  }
  const motionIssues = validateMotionRanges(project);
  if (motionIssues.length > 0) throw new Error(motionIssues.join("; "));
  const motionFrames = new Set<number>();
  for (const motion of project.motionRanges) {
    for (let index = motion.startFrame; index <= motion.endFrame; index += 1) {
      motionFrames.add(index);
    }
  }
  const poseCandidates = direction.frameAngles.flatMap((angle, frameIndex) => {
    const packed = packedIndexes.get(frameIndex);
    if (angle === null || packed === undefined || motionFrames.has(frameIndex))
      return [];
    return [{ frameIndex, frame: packed, angle }];
  });
  const angleKeys = new Set<string>();
  const poses: CompanionPose[] = poseCandidates
    .sort((left, right) => left.angle - right.angle)
    .flatMap((pose) => {
      const key = pose.angle.toFixed(4);
      if (angleKeys.has(key)) return [];
      angleKeys.add(key);
      return [
        {
          id: `pose-${String(pose.frame).padStart(3, "0")}`,
          angle: normalizeAngle(Number(key)),
          frame: pose.frame,
        },
      ];
    });
  if (poses.length < 4) {
    throw new Error(
      "Add at least four distinct direction anchors before saving",
    );
  }

  const activeDirectionAnchors = project.directionAnchors.filter(
    (anchor) =>
      anchor.frameIndex >= 0 &&
      anchor.frameIndex < project.frames.length &&
      !project.frames[anchor.frameIndex]?.excluded,
  );
  const idleClips: CompanionIdleClip[] = project.motionRanges.flatMap(
    (motion) => {
      let clipFrames = activeLogicalFrames.flatMap((logical) => {
        const sourceIndex = project.frames.indexOf(logical);
        const packed = packedIndexes.get(sourceIndex);
        if (
          packed === undefined ||
          sourceIndex < motion.startFrame ||
          sourceIndex > motion.endFrame
        ) {
          return [];
        }
        return [
          {
            frame: packed,
            durationMs: Math.max(16, Math.round(1000 / (24 * motion.speed))),
          },
        ];
      });
      if (clipFrames.length === 0) return [];
      clipFrames = expandMotionFrames(clipFrames, motion.playback);
      const allowed = assignedPoseIdsForMotion(
        poses,
        activeDirectionAnchors,
        motion.poseAnchorIds,
      );
      return [
        {
          id: companionSlug(motion.name) + `-${motion.id.slice(-4)}`,
          poseIds: [...new Set(allowed)],
          frames: clipFrames,
          minimumDelayMs: motion.minimumDelayMs,
          maximumDelayMs: motion.maximumDelayMs,
        },
      ];
    },
  );

  const definition: CompanionPackageDefinition = {
    format: COMPANION_FORMAT,
    id,
    version: "0.2.0-beta.8",
    metadata: {
      name: project.name,
      description: project.description.trim(),
      author,
      license,
      tags: ["companion", "pointer-aware"],
      preview: previewPath,
    },
    compatibility: { styler: { minimumVersion: "0.2.0" } },
    entity: {
      id: entityId,
      name: project.name,
      renderer: {
        type: "sprite-atlas",
        asset: pagePaths[0]!,
        pages: pagePaths,
        columns: layout.columns,
        rows: layout.rows,
        framesPerPage: layout.framesPerPage,
        frameWidth: width,
        frameHeight: height,
        directions: activeLogicalFrames.length,
        frameCount: activeLogicalFrames.length,
        poses,
        idleClips,
        neutralFrame: nearestPackedFrame(project.neutralFrame, packedIndexes),
        reducedMotionFrame: nearestPackedFrame(
          project.reducedMotionFrame,
          packedIndexes,
        ),
        transitionFps: project.preview.renderFps,
        followSmoothing: project.preview.followSmoothing,
        normalization: "preserve",
        alphaThreshold: 12,
      },
      behaviors: ["idle", "look-at-pointer", "reduce-motion-fallback"],
      anchor: { x: project.placement.align * 100, y: 70 },
      attachment: {
        target: "composer",
        edge: "top",
        align: project.placement.align,
        offset: {
          x: project.placement.offsetX,
          y: project.placement.offsetY,
        },
      },
      size: project.placement.size,
      opacity: 1,
    },
    assets: [
      ...pagePaths.map((path, index) => ({
        id: `atlas-${index + 1}`,
        path,
        type: "sprite-atlas" as const,
        license,
      })),
      { id: "portrait", path: previewPath, type: "preview", license },
    ],
    locales: {},
  };
  const validation = validateCompanion(definition);
  if (!validation.ok) {
    throw new Error(
      validation.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; "),
    );
  }
  return { companion: companionFromPackage(definition), files };
}
