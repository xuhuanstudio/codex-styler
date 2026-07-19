import {
  MAX_CONTENT_SCALE,
  MIN_CONTENT_SCALE,
  type AtlasSliceSettings,
  type DirectionAnchor,
  type FrameBounds,
  type LogicalFrame,
} from "./model";

export function naturalFileOrder(files: File[]): File[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return [...files].sort((left, right) =>
    collator.compare(left.name, right.name),
  );
}

export function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function pointerAngle(
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number,
): number {
  return normalizeAngle(
    (Math.atan2(pointerX - centerX, centerY - pointerY) * 180) / Math.PI,
  );
}

export interface DirectionCalibration {
  frameAngles: Array<number | null>;
  warnings: Array<
    | "not-enough-anchors"
    | "duplicate-directions"
    | "reverse-segment"
    | "missing-leading-range"
    | "missing-trailing-range"
  >;
  activeFrameCount: number;
  mappedFrameCount: number;
  coverageRatio: number;
  validAnchorCount: number;
  distinctDirectionCount: number;
  firstActiveFrame: number | null;
  lastActiveFrame: number | null;
  maximumDirectionGap: number | null;
  seamGap: number | null;
  reverseSegments: Array<{ startFrame: number; endFrame: number }>;
  unmappedRanges: Array<{ startFrame: number; endFrame: number }>;
  ready: boolean;
}

function contiguousRanges(indexes: number[]): Array<{
  startFrame: number;
  endFrame: number;
}> {
  if (indexes.length === 0) return [];
  const ranges: Array<{ startFrame: number; endFrame: number }> = [];
  let startFrame = indexes[0]!;
  let endFrame = startFrame;
  for (const index of indexes.slice(1)) {
    if (index === endFrame + 1) {
      endFrame = index;
      continue;
    }
    ranges.push({ startFrame, endFrame });
    startFrame = index;
    endFrame = index;
  }
  ranges.push({ startFrame, endFrame });
  return ranges;
}

function largestCircularGap(angles: number[]): number | null {
  const unique = [
    ...new Set(angles.map((angle) => normalizeAngle(angle))),
  ].sort((left, right) => left - right);
  if (unique.length < 2) return null;
  let maximum = 0;
  for (let index = 0; index < unique.length; index += 1) {
    const current = unique[index]!;
    const next = unique[(index + 1) % unique.length]!;
    maximum = Math.max(maximum, normalizeAngle(next - current));
  }
  return maximum;
}

/**
 * Interpolates direction using cumulative visible change, not frame count.
 * `visualDelta` describes the change from the preceding logical frame. This
 * keeps a slow part of a non-uniform video from consuming the same angle as a
 * visibly large turn.
 */
export function calibrateDirections(
  frames: LogicalFrame[],
  anchors: DirectionAnchor[],
): DirectionCalibration {
  const warnings = new Set<DirectionCalibration["warnings"][number]>();
  const active = frames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame }) => !frame.excluded);
  const sorted = [...anchors]
    .filter(
      (anchor) =>
        anchor.frameIndex >= 0 &&
        anchor.frameIndex < frames.length &&
        !frames[anchor.frameIndex]?.excluded,
    )
    .sort((left, right) => left.frameIndex - right.frameIndex);

  const normalizedDirections = sorted.map((anchor) =>
    normalizeAngle(anchor.angle),
  );
  const distinctDirectionCount = new Set(
    normalizedDirections.map((angle) => angle.toFixed(4)),
  ).size;
  if (sorted.length < 4) warnings.add("not-enough-anchors");
  if (sorted.length >= 4 && distinctDirectionCount < 4) {
    warnings.add("duplicate-directions");
  }
  const frameAngles = frames.map<number | null>(() => null);
  const base = {
    activeFrameCount: active.length,
    validAnchorCount: sorted.length,
    distinctDirectionCount,
    firstActiveFrame: active[0]?.index ?? null,
    lastActiveFrame: active.at(-1)?.index ?? null,
    maximumDirectionGap: largestCircularGap(normalizedDirections),
    seamGap:
      sorted.length < 2
        ? null
        : Math.abs(
            ((sorted.at(-1)!.angle - sorted[0]!.angle + 540) % 360) - 180,
          ),
  };
  if (sorted.length === 0 || active.length === 0) {
    const unmappedRanges = contiguousRanges(active.map(({ index }) => index));
    return {
      frameAngles,
      warnings: [...warnings],
      ...base,
      mappedFrameCount: 0,
      coverageRatio: active.length === 0 ? 1 : 0,
      reverseSegments: [],
      unmappedRanges,
      ready: active.length <= 1,
    };
  }

  if (sorted[0]!.frameIndex > active[0]!.index) {
    warnings.add("missing-leading-range");
  }
  if (sorted.at(-1)!.frameIndex < active.at(-1)!.index) {
    warnings.add("missing-trailing-range");
  }

  const reverseSegments: DirectionCalibration["reverseSegments"] = [];
  for (let anchorIndex = 0; anchorIndex < sorted.length - 1; anchorIndex += 1) {
    const start = sorted[anchorIndex]!;
    const end = sorted[anchorIndex + 1]!;
    const startAngle = normalizeAngle(start.angle);
    let endAngle = normalizeAngle(end.angle);
    while (endAngle < startAngle) endAngle += 360;
    if (endAngle - startAngle > 180) {
      warnings.add("reverse-segment");
      reverseSegments.push({
        startFrame: start.frameIndex,
        endFrame: end.frameIndex,
      });
    }

    const indices = active
      .map(({ index }) => index)
      .filter((index) => index >= start.frameIndex && index <= end.frameIndex);
    const totalChange = indices
      .slice(1)
      .reduce(
        (total, index) => total + Math.max(0.0001, frames[index]!.visualDelta),
        0,
      );
    let accumulated = 0;
    for (const [offset, frameIndex] of indices.entries()) {
      if (offset > 0) {
        accumulated += Math.max(0.0001, frames[frameIndex]!.visualDelta);
      }
      const progress = totalChange === 0 ? 0 : accumulated / totalChange;
      frameAngles[frameIndex] = normalizeAngle(
        startAngle + (endAngle - startAngle) * progress,
      );
    }
  }

  for (const anchor of sorted) {
    frameAngles[anchor.frameIndex] = normalizeAngle(anchor.angle);
  }
  const unmappedRanges = contiguousRanges(
    active
      .filter(({ index }) => frameAngles[index] === null)
      .map(({ index }) => index),
  );
  const mappedFrameCount =
    active.length -
    unmappedRanges.reduce(
      (count, range) => count + range.endFrame - range.startFrame + 1,
      0,
    );
  const resultWarnings = [...warnings];
  return {
    frameAngles,
    warnings: resultWarnings,
    ...base,
    mappedFrameCount,
    coverageRatio: active.length === 0 ? 1 : mappedFrameCount / active.length,
    reverseSegments,
    unmappedRanges,
    ready: active.length <= 1 || resultWarnings.length === 0,
  };
}

export function nearestDirectionFrame(
  frameAngles: Array<number | null>,
  angle: number,
  fallbackFrame = 0,
): number {
  const target = normalizeAngle(angle);
  let nearestFrame = fallbackFrame;
  let nearestDistance = Number.POSITIVE_INFINITY;
  frameAngles.forEach((frameAngle, frameIndex) => {
    if (frameAngle === null) return;
    const distance = Math.abs(
      ((normalizeAngle(frameAngle) - target + 540) % 360) - 180,
    );
    if (distance < nearestDistance) {
      nearestFrame = frameIndex;
      nearestDistance = distance;
    }
  });
  return nearestFrame;
}

export function commonSubjectCrop(
  frames: LogicalFrame[],
  padding = 0,
): FrameBounds | null {
  const bounds = frames
    .filter((frame) => !frame.excluded && frame.subjectBounds)
    .map((frame) => frame.subjectBounds!);
  if (bounds.length === 0) return null;
  const left = Math.min(...bounds.map((bound) => bound.x));
  const top = Math.min(...bounds.map((bound) => bound.y));
  const right = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const bottom = Math.max(...bounds.map((bound) => bound.y + bound.height));
  return {
    x: Math.max(0, left - padding),
    y: Math.max(0, top - padding),
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
  };
}

export interface AlignmentFrameDiagnostic {
  frameIndex: number;
  baselineDelta: number | null;
  centerDelta: number | null;
  outsideCrop: boolean;
  missingBounds: boolean;
}

export interface AlignmentDiagnostics {
  includedFrames: number;
  boundedFrames: number;
  missingBounds: number;
  outsideCrop: number;
  baselineOutliers: number;
  centerOutliers: number;
  maximumBaselineDelta: number;
  maximumCenterDelta: number;
  ready: boolean;
  frames: AlignmentFrameDiagnostic[];
}

export interface SuggestedSharedAlignment {
  crop: FrameBounds;
  groundLine: number;
  offsets: Array<{ x: number; y: number } | null>;
}

export function translatedSubjectBounds(
  frame: LogicalFrame,
): FrameBounds | null {
  if (!frame.subjectBounds) return null;
  return {
    x: frame.subjectBounds.x + frame.baselineOffset.x,
    y: frame.subjectBounds.y + frame.baselineOffset.y,
    width: frame.subjectBounds.width,
    height: frame.subjectBounds.height,
  };
}

export function sharedTransformPivot(
  crop: FrameBounds,
  groundLine: number | null,
): { x: number; y: number } {
  return {
    x: crop.x + crop.width / 2,
    y: groundLine ?? crop.y + crop.height,
  };
}

export function scaleBoundsAroundPivot(
  bounds: FrameBounds,
  scale: number,
  pivot: { x: number; y: number },
): FrameBounds {
  return {
    x: pivot.x + (bounds.x - pivot.x) * scale,
    y: pivot.y + (bounds.y - pivot.y) * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
  };
}

export function transformedSubjectBounds(
  frame: LogicalFrame,
  crop: FrameBounds,
  groundLine: number | null,
  contentScale = 1,
): FrameBounds | null {
  const bounds = translatedSubjectBounds(frame);
  if (!bounds) return null;
  return scaleBoundsAroundPivot(
    bounds,
    contentScale,
    sharedTransformPivot(crop, groundLine),
  );
}

/**
 * Finds one uniform scale that keeps every included subject inside the shared
 * canvas. The bottom stays on the ground line while the top and sides retain
 * a small safety margin. Source pixels and per-frame proportions are untouched.
 */
export function fitSharedContentScale(
  frames: LogicalFrame[],
  crop: FrameBounds | null,
  groundLine: number | null,
  paddingRatio = 0.04,
): number | null {
  if (!crop || groundLine === null) return null;
  const bounds = frames.flatMap((frame) => {
    if (frame.excluded) return [];
    const translated = translatedSubjectBounds(frame);
    return translated ? [translated] : [];
  });
  if (bounds.length === 0) return null;

  const pivot = sharedTransformPivot(crop, groundLine);
  const left = crop.x + crop.width * paddingRatio;
  const right = crop.x + crop.width * (1 - paddingRatio);
  const top = crop.y + crop.height * paddingRatio;
  const bottom = crop.y + crop.height;
  let maximumScale = 1;
  const constrain = (distance: number, available: number) => {
    if (distance <= 0) return;
    maximumScale = Math.min(maximumScale, available / distance);
  };

  for (const bound of bounds) {
    constrain(pivot.x - bound.x, pivot.x - left);
    constrain(bound.x + bound.width - pivot.x, right - pivot.x);
    constrain(pivot.y - bound.y, pivot.y - top);
    constrain(bound.y + bound.height - pivot.y, bottom - pivot.y);
  }

  if (!Number.isFinite(maximumScale) || maximumScale <= 0) return null;
  return Math.max(
    MIN_CONTENT_SCALE,
    Math.min(1, MAX_CONTENT_SCALE, maximumScale),
  );
}

export interface ExpandedSharedCanvas {
  crop: FrameBounds;
  groundLine: number;
  offsetDelta: { x: number; y: number };
}

/**
 * Expands the crop around the existing transform pivot. When the crop reaches
 * a source edge, the crop, ground line and every frame shift together so the
 * visual alignment remains unchanged.
 */
export function expandSharedCanvasToContent(
  frames: LogicalFrame[],
  crop: FrameBounds | null,
  groundLine: number | null,
  contentScale: number,
  canvas?: { width: number; height: number },
  paddingRatio = 0.04,
): ExpandedSharedCanvas | null {
  if (!crop || groundLine === null || !canvas) return null;
  const bounds = frames.flatMap((frame) => {
    if (frame.excluded) return [];
    const transformed = transformedSubjectBounds(
      frame,
      crop,
      groundLine,
      contentScale,
    );
    return transformed ? [transformed] : [];
  });
  if (bounds.length === 0) return null;

  const pivot = sharedTransformPivot(crop, groundLine);
  const minimumX = Math.min(...bounds.map((bound) => bound.x));
  const maximumX = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const minimumY = Math.min(...bounds.map((bound) => bound.y));
  const maximumY = Math.max(...bounds.map((bound) => bound.y + bound.height));
  const padding = Math.max(8, Math.min(crop.width, crop.height) * paddingRatio);
  const halfWidth = Math.max(
    crop.width / 2,
    pivot.x - minimumX + padding,
    maximumX - pivot.x + padding,
  );
  const width = halfWidth * 2;
  const rawX = pivot.x - halfWidth;
  const rawY = Math.min(crop.y, minimumY - padding);
  const rawBottom = Math.max(crop.y + crop.height, maximumY);
  const height = rawBottom - rawY;
  if (width > canvas.width || height > canvas.height) return null;

  const x = Math.max(0, Math.min(canvas.width - width, rawX));
  const y = Math.max(0, Math.min(canvas.height - height, rawY));
  const offsetDelta = { x: x - rawX, y: y - rawY };
  const expanded = {
    x,
    y,
    width,
    height,
  };
  const changed =
    Math.abs(expanded.x - crop.x) > 0.01 ||
    Math.abs(expanded.y - crop.y) > 0.01 ||
    Math.abs(expanded.width - crop.width) > 0.01 ||
    Math.abs(expanded.height - crop.height) > 0.01 ||
    Math.abs(offsetDelta.x) > 0.01 ||
    Math.abs(offsetDelta.y) > 0.01;
  if (!changed) return null;
  return {
    crop: expanded,
    groundLine: groundLine + offsetDelta.y,
    offsetDelta,
  };
}

/**
 * Builds a stable shared canvas without scaling individual frames. Subjects
 * are centered on one vertical axis and their detected bottoms meet the same
 * ground line. Excluded and transparent frames remain untouched.
 */
export function suggestSharedAlignment(
  frames: LogicalFrame[],
  padding = 8,
  canvas?: { width: number; height: number },
): SuggestedSharedAlignment | null {
  const included = frames
    .map((frame, frameIndex) => ({ frame, frameIndex }))
    .filter(({ frame }) => !frame.excluded && frame.subjectBounds);
  if (included.length === 0) return null;

  const left = Math.min(...included.map(({ frame }) => frame.subjectBounds!.x));
  const right = Math.max(
    ...included.map(
      ({ frame }) => frame.subjectBounds!.x + frame.subjectBounds!.width,
    ),
  );
  const targetCenter = (left + right) / 2;
  const targetGround = Math.max(
    ...included.map(
      ({ frame }) => frame.subjectBounds!.y + frame.subjectBounds!.height,
    ),
  );
  const offsets: SuggestedSharedAlignment["offsets"] = frames.map(() => null);
  const translated: FrameBounds[] = [];

  for (const { frame, frameIndex } of included) {
    const bounds = frame.subjectBounds!;
    const offset = {
      x: targetCenter - (bounds.x + bounds.width / 2),
      y: targetGround - (bounds.y + bounds.height),
    };
    offsets[frameIndex] = offset;
    translated.push({
      x: bounds.x + offset.x,
      y: bounds.y + offset.y,
      width: bounds.width,
      height: bounds.height,
    });
  }

  const translatedLeft = Math.min(...translated.map((bound) => bound.x));
  const translatedTop = Math.min(...translated.map((bound) => bound.y));
  const translatedRight = Math.max(
    ...translated.map((bound) => bound.x + bound.width),
  );
  const translatedBottom = Math.max(
    ...translated.map((bound) => bound.y + bound.height),
  );
  const rawCrop = {
    x: translatedLeft - padding,
    y: translatedTop - padding,
    width: translatedRight - translatedLeft + padding * 2,
    height: translatedBottom - translatedTop + padding * 2,
  };
  if (!canvas) {
    return { crop: rawCrop, groundLine: targetGround, offsets };
  }

  // Preserve the common crop size when it meets a canvas edge. Clipping the
  // crop alone moves its center, leaving otherwise aligned subjects marked as
  // drifted. Shift every frame and the ground line by the same amount instead.
  const cropWidth = Math.min(canvas.width, rawCrop.width);
  const cropHeight = Math.min(canvas.height, rawCrop.height);
  const crop = {
    x: Math.max(0, Math.min(canvas.width - cropWidth, rawCrop.x)),
    y: Math.max(0, Math.min(canvas.height - cropHeight, rawCrop.y)),
    width: cropWidth,
    height: cropHeight,
  };
  const shiftX = crop.x + crop.width / 2 - targetCenter;
  const shiftY = crop.y - rawCrop.y;
  offsets.forEach((offset) => {
    if (!offset) return;
    offset.x += shiftX;
    offset.y += shiftY;
  });

  return {
    crop,
    groundLine: Math.max(0, Math.min(canvas.height, targetGround + shiftY)),
    offsets,
  };
}

export function diagnoseSharedAlignment(
  frames: LogicalFrame[],
  crop: FrameBounds | null,
  groundLine: number | null,
  contentScale = 1,
  tolerance = 2,
): AlignmentDiagnostics {
  const diagnostics: AlignmentFrameDiagnostic[] = [];
  let boundedFrames = 0;
  let missingBounds = 0;
  let outsideCrop = 0;
  let baselineOutliers = 0;
  let centerOutliers = 0;
  let maximumBaselineDelta = 0;
  let maximumCenterDelta = 0;
  const includedFrames = frames.filter((frame) => !frame.excluded).length;

  frames.forEach((frame, frameIndex) => {
    if (frame.excluded) return;
    const bounds = crop
      ? transformedSubjectBounds(frame, crop, groundLine, contentScale)
      : translatedSubjectBounds(frame);
    if (!bounds || !crop || groundLine === null) {
      missingBounds += bounds ? 0 : 1;
      diagnostics.push({
        frameIndex,
        baselineDelta: null,
        centerDelta: null,
        outsideCrop: false,
        missingBounds: !bounds,
      });
      return;
    }
    boundedFrames += 1;
    const baselineDelta = bounds.y + bounds.height - groundLine;
    const centerDelta = bounds.x + bounds.width / 2 - (crop.x + crop.width / 2);
    const frameOutsideCrop =
      bounds.x < crop.x - tolerance ||
      bounds.y < crop.y - tolerance ||
      bounds.x + bounds.width > crop.x + crop.width + tolerance ||
      bounds.y + bounds.height > crop.y + crop.height + tolerance;
    if (frameOutsideCrop) outsideCrop += 1;
    if (Math.abs(baselineDelta) > tolerance) baselineOutliers += 1;
    if (Math.abs(centerDelta) > tolerance) centerOutliers += 1;
    maximumBaselineDelta = Math.max(
      maximumBaselineDelta,
      Math.abs(baselineDelta),
    );
    maximumCenterDelta = Math.max(maximumCenterDelta, Math.abs(centerDelta));
    diagnostics.push({
      frameIndex,
      baselineDelta,
      centerDelta,
      outsideCrop: frameOutsideCrop,
      missingBounds: false,
    });
  });

  return {
    includedFrames,
    boundedFrames,
    missingBounds,
    outsideCrop,
    baselineOutliers,
    centerOutliers,
    maximumBaselineDelta,
    maximumCenterDelta,
    ready:
      includedFrames > 0 &&
      Boolean(crop) &&
      groundLine !== null &&
      missingBounds === 0 &&
      outsideCrop === 0 &&
      baselineOutliers === 0 &&
      centerOutliers === 0,
    frames: diagnostics,
  };
}

export function atlasCellRect(
  frameIndex: number,
  settings: AtlasSliceSettings,
): FrameBounds {
  const row =
    settings.order === "row-major"
      ? Math.floor(frameIndex / settings.columns)
      : frameIndex % settings.rows;
  const column =
    settings.order === "row-major"
      ? frameIndex % settings.columns
      : Math.floor(frameIndex / settings.rows);
  return {
    x: settings.marginX + column * (settings.cellWidth + settings.gapX),
    y: settings.marginY + row * (settings.cellHeight + settings.gapY),
    width: settings.cellWidth,
    height: settings.cellHeight,
  };
}

export function atlasOverflow(
  imageWidth: number,
  imageHeight: number,
  settings: AtlasSliceSettings,
): number[] {
  return Array.from({ length: settings.columns * settings.rows }, (_, index) =>
    atlasCellRect(index, settings),
  )
    .map((rect, index) => ({ rect, index }))
    .filter(
      ({ rect }) =>
        rect.x < 0 ||
        rect.y < 0 ||
        rect.x + rect.width > imageWidth ||
        rect.y + rect.height > imageHeight,
    )
    .map(({ index }) => index);
}
