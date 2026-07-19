import type { DirectionCalibration } from "./calibration";
import {
  atlasPackLayout,
  atlasPageLimit,
  decodedPageLimit,
  encodedFileLimit,
  rasterDimensionLimit,
} from "./compiler";
import { CREATOR_INPUT_LIMITS } from "./media";
import type { CompanionCreatorProject } from "./model";

export interface CompanionOutputSummary {
  canvas: { width: number; height: number } | null;
  includedFrames: number;
  excludedFrames: number;
  directionCoverage: number;
  directionPoses: number;
  idleClips: number;
  assetKind: "image" | "atlas" | null;
  atlasPages: number;
  decodedPageBytes: number;
  withinLimits: boolean;
  issue:
    | "missing-crop"
    | "missing-frames"
    | "frame-limit"
    | "canvas-limit"
    | "atlas-limit"
    | null;
}

export const companionOutputLimits = {
  frames: CREATOR_INPUT_LIMITS.frameCount,
  atlasPages: atlasPageLimit,
  decodedPageBytes: decodedPageLimit,
  encodedAssetBytes: encodedFileLimit,
  rasterDimension: rasterDimensionLimit,
} as const;

export function summarizeCompanionOutput(
  project: CompanionCreatorProject,
  calibration: DirectionCalibration,
): CompanionOutputSummary {
  const includedFrames = project.frames.filter(
    (frame) => !frame.excluded,
  ).length;
  const excludedFrames = project.frames.length - includedFrames;
  const canvas = project.sharedCrop
    ? {
        width: Math.max(1, Math.ceil(project.sharedCrop.width)),
        height: Math.max(1, Math.ceil(project.sharedCrop.height)),
      }
    : null;
  const motionFrames = new Set<number>();
  for (const motion of project.motionRanges) {
    for (let index = motion.startFrame; index <= motion.endFrame; index += 1) {
      motionFrames.add(index);
    }
  }
  const compiledPoseAngles = new Set(
    calibration.frameAngles.flatMap((angle, frameIndex) => {
      if (
        angle === null ||
        project.frames[frameIndex]?.excluded ||
        motionFrames.has(frameIndex)
      ) {
        return [];
      }
      return [angle.toFixed(4)];
    }),
  );
  const base = {
    canvas,
    includedFrames,
    excludedFrames,
    directionCoverage: includedFrames <= 1 ? 1 : calibration.coverageRatio,
    directionPoses:
      includedFrames <= 1
        ? Math.min(1, includedFrames)
        : compiledPoseAngles.size,
    idleClips: project.motionRanges.length,
  };

  if (!canvas || includedFrames === 0) {
    return {
      ...base,
      assetKind: null,
      atlasPages: 0,
      decodedPageBytes: 0,
      withinLimits: false,
      issue: !canvas ? "missing-crop" : "missing-frames",
    };
  }

  if (includedFrames > companionOutputLimits.frames) {
    return {
      ...base,
      assetKind: includedFrames === 1 ? "image" : "atlas",
      atlasPages: 0,
      decodedPageBytes: 0,
      withinLimits: false,
      issue: "frame-limit",
    };
  }

  if (
    canvas.width > companionOutputLimits.rasterDimension ||
    canvas.height > companionOutputLimits.rasterDimension
  ) {
    return {
      ...base,
      assetKind: includedFrames === 1 ? "image" : "atlas",
      atlasPages: 0,
      decodedPageBytes: 0,
      withinLimits: false,
      issue: "canvas-limit",
    };
  }

  if (includedFrames === 1) {
    return {
      ...base,
      assetKind: "image",
      atlasPages: 0,
      decodedPageBytes: canvas.width * canvas.height * 4,
      withinLimits: true,
      issue: null,
    };
  }

  try {
    const layout = atlasPackLayout(canvas.width, canvas.height, includedFrames);
    return {
      ...base,
      assetKind: "atlas",
      atlasPages: layout.pages,
      decodedPageBytes:
        layout.columns * canvas.width * layout.rows * canvas.height * 4,
      withinLimits: true,
      issue: null,
    };
  } catch {
    return {
      ...base,
      assetKind: "atlas",
      atlasPages: 0,
      decodedPageBytes: 0,
      withinLimits: false,
      issue: "atlas-limit",
    };
  }
}
