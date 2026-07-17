import type {
  AtlasSliceSettings,
  DirectionAnchor,
  FrameBounds,
  LogicalFrame,
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
    | "reverse-segment"
    | "missing-leading-range"
    | "missing-trailing-range"
  >;
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

  if (sorted.length < 4) warnings.add("not-enough-anchors");
  const frameAngles = frames.map<number | null>(() => null);
  if (sorted.length === 0 || active.length === 0) {
    return { frameAngles, warnings: [...warnings] };
  }

  if (sorted[0]!.frameIndex > active[0]!.index) {
    warnings.add("missing-leading-range");
  }
  if (sorted.at(-1)!.frameIndex < active.at(-1)!.index) {
    warnings.add("missing-trailing-range");
  }

  for (let anchorIndex = 0; anchorIndex < sorted.length - 1; anchorIndex += 1) {
    const start = sorted[anchorIndex]!;
    const end = sorted[anchorIndex + 1]!;
    const startAngle = normalizeAngle(start.angle);
    let endAngle = normalizeAngle(end.angle);
    while (endAngle < startAngle) endAngle += 360;
    if (endAngle - startAngle > 180) {
      warnings.add("reverse-segment");
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
  return { frameAngles, warnings: [...warnings] };
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
