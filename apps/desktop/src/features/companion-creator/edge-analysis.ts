import { renderLogicalFramePixels } from "./frame-renderer";
import type { ExtractedFrame } from "./media";
import type { CleanupSettings, CompanionCreatorProject } from "./model";
import type { PixelBuffer } from "./pixel-processing";

export type EdgeAnalysisIssueKind =
  "background-retained" | "edge-contact" | "floating-pixels" | "color-spill";

export interface EdgeAnalysisIssue {
  kind: EdgeAnalysisIssueKind;
  frameIndexes: number[];
}

export interface EdgeAnalysisResult {
  scannedFrameIndexes: number[];
  issues: EdgeAnalysisIssue[];
}

export type EdgeAnalysisState =
  | { status: "idle" | "running" }
  | { status: "ready"; result: EdgeAnalysisResult }
  | { status: "error"; message: string };

const maximumScannedFrames = 24;
const alphaThreshold = 12;

function addIncluded(
  result: Set<number>,
  included: Set<number>,
  value: number,
): void {
  if (included.has(value)) result.add(value);
}

function addEvenly(
  result: Set<number>,
  included: Set<number>,
  values: number[],
  limit: number,
): void {
  const candidates = [...new Set(values)].filter(
    (value) => included.has(value) && !result.has(value),
  );
  const available = Math.max(0, limit - result.size);
  if (available === 0 || candidates.length === 0) return;
  if (candidates.length <= available) {
    for (const value of candidates) result.add(value);
    return;
  }
  for (let slot = 0; slot < available; slot += 1) {
    const position =
      available === 1
        ? Math.floor(candidates.length / 2)
        : Math.round((slot / (available - 1)) * (candidates.length - 1));
    result.add(candidates[position]!);
  }
}

/**
 * Keeps the scan bounded while prioritizing neutral states and then sampling
 * behavior-defining frames before the remaining sequence.
 */
export function representativeEdgeFrameIndexes(
  project: CompanionCreatorProject,
  limit = maximumScannedFrames,
): number[] {
  const includedIndexes = project.frames.flatMap((frame, index) =>
    frame.excluded ? [] : [index],
  );
  if (includedIndexes.length <= limit) return includedIndexes;
  const included = new Set(includedIndexes);
  const selected = new Set<number>();
  addIncluded(selected, included, project.neutralFrame);
  addIncluded(selected, included, project.reducedMotionFrame);
  addIncluded(selected, included, includedIndexes[0]!);
  addIncluded(selected, included, includedIndexes.at(-1)!);
  addEvenly(
    selected,
    included,
    [
      ...project.directionAnchors.map((anchor) => anchor.frameIndex),
      ...project.motionRanges.flatMap((motion) => [
        motion.startFrame,
        motion.endFrame,
      ]),
    ],
    limit,
  );
  addEvenly(selected, included, includedIndexes, limit);
  return [...selected].sort((left, right) => left - right);
}

function rgbDistance(
  red: number,
  green: number,
  blue: number,
  target: [number, number, number],
): number {
  return Math.sqrt(
    (red - target[0]) ** 2 + (green - target[1]) ** 2 + (blue - target[2]) ** 2,
  );
}

function parseHex(value: string): [number, number, number] {
  const normalized = value.replace(/^#/u, "");
  if (!/^[0-9a-f]{6}$/iu.test(normalized)) return [255, 255, 255];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function disconnectedPixelCount(buffer: PixelBuffer): number {
  const { data, width, height } = buffer;
  const visited = new Uint8Array(width * height);
  let visible = 0;
  let largest = 0;
  const neighbors = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ] as const;
  for (let seed = 0; seed < width * height; seed += 1) {
    if (visited[seed] || data[seed * 4 + 3]! < alphaThreshold) continue;
    let component = 0;
    const queue = [seed];
    visited[seed] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]!;
      component += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      for (const [dx, dy] of neighbors) {
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height)
          continue;
        const next = nextY * width + nextX;
        if (visited[next] || data[next * 4 + 3]! < alphaThreshold) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }
    visible += component;
    largest = Math.max(largest, component);
  }
  return visible - largest;
}

function yieldToInterface(): Promise<void> {
  if (typeof requestAnimationFrame === "function") {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  return Promise.resolve();
}

export function analyzeEdgePixels(
  buffer: PixelBuffer,
  cleanup: CleanupSettings,
): EdgeAnalysisIssueKind[] {
  const { data, width, height } = buffer;
  const pixels = width * height;
  const background = parseHex(cleanup.sampledColor);
  const edgeBand = Math.max(1, Math.round(Math.min(width, height) * 0.006));
  let visible = 0;
  let opaque = 0;
  let translucent = 0;
  let backgroundLikeTranslucent = 0;
  let topOrSideContact = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3]!;
      if (alpha < alphaThreshold) continue;
      visible += 1;
      if (alpha >= 245) opaque += 1;
      else {
        translucent += 1;
        if (
          cleanup.mode === "sampled-color" &&
          rgbDistance(
            data[offset]!,
            data[offset + 1]!,
            data[offset + 2]!,
            background,
          ) < Math.max(18, (cleanup.tolerance + cleanup.feather) * 1.5)
        ) {
          backgroundLikeTranslucent += 1;
        }
      }
      if (y < edgeBand || x < edgeBand || x >= width - edgeBand) {
        topOrSideContact += 1;
      }
    }
  }

  const issues: EdgeAnalysisIssueKind[] = [];
  const backgroundRetained =
    visible / Math.max(1, pixels) > 0.92 && opaque / Math.max(1, pixels) > 0.82;
  if (backgroundRetained) issues.push("background-retained");
  const edgeThreshold = Math.max(12, Math.round((width + height) * 0.012));
  if (!backgroundRetained && topOrSideContact > edgeThreshold)
    issues.push("edge-contact");
  if (!backgroundRetained) {
    const disconnected = disconnectedPixelCount(buffer);
    if (disconnected > Math.max(12, visible * 0.0015)) {
      issues.push("floating-pixels");
    }
  }
  if (
    translucent > 0 &&
    backgroundLikeTranslucent > Math.max(12, visible * 0.0015) &&
    backgroundLikeTranslucent / translucent > 0.24
  ) {
    issues.push("color-spill");
  }
  return issues;
}

export async function analyzeCompanionEdges(
  project: CompanionCreatorProject,
  frames: ExtractedFrame[],
  signal?: AbortSignal,
): Promise<EdgeAnalysisResult> {
  if (!project.sharedCrop) {
    return { scannedFrameIndexes: [], issues: [] };
  }
  const frameBySource = new Map(
    frames.map((frame) => [frame.sourceIndex, frame]),
  );
  const selected = representativeEdgeFrameIndexes(project);
  const issues = new Map<EdgeAnalysisIssueKind, number[]>();
  const scannedFrameIndexes: number[] = [];
  for (const [scanIndex, frameIndex] of selected.entries()) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const logical = project.frames[frameIndex];
    const frame = logical ? frameBySource.get(logical.sourceIndex) : undefined;
    if (!logical || !frame) continue;
    const pixels = await renderLogicalFramePixels(
      frame,
      logical,
      project.sharedCrop,
      project.groundLine,
      project.contentScale,
    );
    scannedFrameIndexes.push(frameIndex);
    for (const kind of analyzeEdgePixels(pixels, project.cleanup)) {
      issues.set(kind, [...(issues.get(kind) ?? []), frameIndex]);
    }
    if ((scanIndex + 1) % 2 === 0) await yieldToInterface();
  }
  if (selected.length > 0 && scannedFrameIndexes.length === 0) {
    throw new Error("No compiled companion frames were available to scan");
  }
  return {
    scannedFrameIndexes,
    issues: [...issues].map(([kind, frameIndexes]) => ({
      kind,
      frameIndexes,
    })),
  };
}
