import { calibrateDirections, normalizeAngle } from "./calibration";
import type {
  CompanionCreatorProject,
  DirectionAnchor,
  LogicalFrame,
} from "./model";

export type MotionPlayback = "forward" | "ping-pong";

export interface MotionRangeDiagnostics {
  startFrame: number;
  endFrame: number;
  includedFrames: number[];
  excludedCount: number;
  durationMs: number;
  angleDrift: number;
  overlappingMotionIds: string[];
  recommendedPoseAnchorId: string | null;
  recommendedPoseAngle: number | null;
  canPreview: boolean;
  hasDirectionDrift: boolean;
}

export interface MotionAuditionOption {
  id: string;
  name: string;
  frames: number[];
  frameDurationMs: number;
  durationMs: number;
}

export interface MotionAuditionPlan {
  activeAnchor: DirectionAnchor | null;
  motions: MotionAuditionOption[];
}

export interface DirectionalPoseReference {
  id: string;
  angle: number;
}

export function clampMotionRange(
  startFrame: number,
  endFrame: number,
  frameCount: number,
): { startFrame: number; endFrame: number } {
  const lastFrame = Math.max(0, frameCount - 1);
  const start = Math.max(0, Math.min(lastFrame, Math.round(startFrame)));
  const end = Math.max(0, Math.min(lastFrame, Math.round(endFrame)));
  return start <= end
    ? { startFrame: start, endFrame: end }
    : { startFrame: end, endFrame: start };
}

export function motionRangeSignature(
  startFrame: number,
  endFrame: number,
  playback: MotionPlayback,
  frames: LogicalFrame[],
): string {
  const range = clampMotionRange(startFrame, endFrame, frames.length);
  const exclusions = frames
    .slice(range.startFrame, range.endFrame + 1)
    .map((frame) => (frame.excluded ? "1" : "0"))
    .join("");
  return `${range.startFrame}:${range.endFrame}:${playback}:${exclusions}`;
}

export function motionPreviewFrames(
  frames: LogicalFrame[],
  startFrame: number,
  endFrame: number,
  playback: MotionPlayback,
): number[] {
  const range = clampMotionRange(startFrame, endFrame, frames.length);
  const included = frames.flatMap((frame, index) =>
    index >= range.startFrame && index <= range.endFrame && !frame.excluded
      ? [index]
      : [],
  );
  if (playback === "ping-pong" && included.length > 2) {
    return [...included, ...included.slice(1, -1).reverse()];
  }
  return included;
}

function circularAngleDistance(left: number, right: number): number {
  const distance = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(distance, 360 - distance);
}

function nearestAnchor(
  anchors: DirectionAnchor[],
  angle: number,
): DirectionAnchor | null {
  return anchors.reduce<DirectionAnchor | null>((closest, anchor) => {
    if (!closest) return anchor;
    return circularAngleDistance(anchor.angle, angle) <
      circularAngleDistance(closest.angle, angle)
      ? anchor
      : closest;
  }, null);
}

/**
 * Expands an anchor assignment across every compiled pose in that anchor's
 * angular sector. This keeps creator wording, the final audition and runtime
 * behavior aligned even when calibration produces many interpolated poses.
 */
export function assignedPoseIdsForMotion(
  poses: DirectionalPoseReference[],
  anchors: DirectionAnchor[],
  assignedAnchorIds: string[],
): string[] {
  const assigned = new Set(assignedAnchorIds);
  return poses.flatMap((pose) => {
    const anchor = nearestAnchor(anchors, pose.angle);
    return anchor && assigned.has(anchor.id) ? [pose.id] : [];
  });
}

/**
 * Builds the same pose-scoped idle sequence the compiled runtime can play.
 * The final creator stage uses this plan to audition direction selection and
 * saved idle motion together instead of testing them as unrelated features.
 */
export function resolveMotionAudition(
  project: CompanionCreatorProject,
  pointerAngle: number,
): MotionAuditionPlan {
  const activeAnchors = project.directionAnchors.filter(
    (anchor) =>
      anchor.frameIndex >= 0 &&
      anchor.frameIndex < project.frames.length &&
      !project.frames[anchor.frameIndex]?.excluded,
  );
  const activeAnchor = nearestAnchor(activeAnchors, pointerAngle);
  if (!activeAnchor) return { activeAnchor: null, motions: [] };

  const motions = project.motionRanges.flatMap<MotionAuditionOption>(
    (motion) => {
      if (!motion.poseAnchorIds.includes(activeAnchor.id)) return [];
      const frames = motionPreviewFrames(
        project.frames,
        motion.startFrame,
        motion.endFrame,
        motion.playback,
      );
      if (frames.length < 2) return [];
      const safeSpeed = Number.isFinite(motion.speed)
        ? Math.min(4, Math.max(0.1, motion.speed))
        : 1;
      const frameDurationMs = Math.max(16, Math.round(1000 / (24 * safeSpeed)));
      return [
        {
          id: motion.id,
          name: motion.name.trim() || "Idle motion",
          frames,
          frameDurationMs,
          durationMs: frames.length * frameDurationMs,
        },
      ];
    },
  );

  return { activeAnchor, motions };
}

function circularDistance(left: number, right: number): number {
  const delta = Math.abs(left - right) % 360;
  return Math.min(delta, 360 - delta);
}

function maximumAngleDrift(angles: number[]): number {
  let maximum = 0;
  for (let left = 0; left < angles.length; left += 1) {
    for (let right = left + 1; right < angles.length; right += 1) {
      maximum = Math.max(
        maximum,
        circularDistance(angles[left]!, angles[right]!),
      );
    }
  }
  return maximum;
}

export function nearestMotionPose(
  anchors: DirectionAnchor[],
  includedFrames: number[],
): DirectionAnchor | null {
  if (anchors.length === 0 || includedFrames.length === 0) return null;
  const center =
    includedFrames.reduce((total, frame) => total + frame, 0) /
    includedFrames.length;
  return [...anchors].sort(
    (left, right) =>
      Math.abs(left.frameIndex - center) - Math.abs(right.frameIndex - center),
  )[0]!;
}

export function diagnoseMotionRange(
  project: CompanionCreatorProject,
  startFrame: number,
  endFrame: number,
): MotionRangeDiagnostics {
  const range = clampMotionRange(startFrame, endFrame, project.frames.length);
  const includedFrames = project.frames.flatMap((frame, index) =>
    index >= range.startFrame && index <= range.endFrame && !frame.excluded
      ? [index]
      : [],
  );
  const excludedCount = Math.max(
    0,
    range.endFrame - range.startFrame + 1 - includedFrames.length,
  );
  const calibration = calibrateDirections(
    project.frames,
    project.directionAnchors,
  );
  const angles = includedFrames.flatMap((index) => {
    const angle = calibration.frameAngles[index];
    return angle === null ? [] : [angle];
  });
  const angleDrift = maximumAngleDrift(angles);
  const recommended = nearestMotionPose(
    project.directionAnchors,
    includedFrames,
  );
  const overlappingMotionIds = project.motionRanges.flatMap((motion) =>
    motion.startFrame <= range.endFrame && motion.endFrame >= range.startFrame
      ? [motion.id]
      : [],
  );
  const frameRate = Math.max(1, project.preview.frameRate);
  return {
    ...range,
    includedFrames,
    excludedCount,
    durationMs: Math.round((includedFrames.length / frameRate) * 1000),
    angleDrift,
    overlappingMotionIds,
    recommendedPoseAnchorId: recommended?.id ?? null,
    recommendedPoseAngle: recommended?.angle ?? null,
    canPreview: includedFrames.length >= 2,
    hasDirectionDrift: angleDrift > 30,
  };
}

export function validateMotionRanges(
  project: CompanionCreatorProject,
): string[] {
  const anchorIds = new Set(
    project.directionAnchors.map((anchor) => anchor.id),
  );
  return project.motionRanges.flatMap((motion, index) => {
    const label = motion.name.trim() || `Motion ${index + 1}`;
    const issues: string[] = [];
    if (
      motion.startFrame < 0 ||
      motion.endFrame < motion.startFrame ||
      motion.endFrame >= project.frames.length
    ) {
      issues.push(`${label} has an invalid frame range`);
    } else {
      const includedCount = project.frames
        .slice(motion.startFrame, motion.endFrame + 1)
        .filter((frame) => !frame.excluded).length;
      if (includedCount < 2)
        issues.push(`${label} needs at least two included frames`);
    }
    if (
      motion.poseAnchorIds.length === 0 ||
      motion.poseAnchorIds.some((id) => !anchorIds.has(id))
    ) {
      issues.push(
        `${label} must reference at least one existing direction pose`,
      );
    }
    if (
      !Number.isFinite(motion.speed) ||
      motion.speed < 0.1 ||
      motion.speed > 4
    )
      issues.push(`${label} speed must be between 0.1 and 4`);
    if (
      !Number.isFinite(motion.minimumDelayMs) ||
      !Number.isFinite(motion.maximumDelayMs) ||
      motion.minimumDelayMs < 250 ||
      motion.maximumDelayMs > 120_000 ||
      motion.maximumDelayMs < motion.minimumDelayMs
    ) {
      issues.push(`${label} has an invalid idle delay range`);
    }
    return issues;
  });
}
