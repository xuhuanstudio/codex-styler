import type { ErrorObject, ValidateFunction } from "ajv";
import generatedCompanionValidator from "./generated/companion-validator";
import type {
  CompanionPackageDefinition,
  ThemeValidationIssue,
  ThemeValidationResult,
} from "./types";

const validateCompanionSchema =
  generatedCompanionValidator as ValidateFunction<CompanionPackageDefinition>;

function issueFromAjv(error: ErrorObject): ThemeValidationIssue {
  return {
    path: error.instancePath || "/",
    message: error.message ?? "Invalid value",
  };
}

function relationshipIssues(
  companion: CompanionPackageDefinition,
): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];
  const assetPaths = new Set<string>();
  const assetIds = new Set<string>();
  for (const [index, asset] of companion.assets.entries()) {
    if (assetPaths.has(asset.path)) {
      issues.push({
        path: `/assets/${index}/path`,
        message: "Asset paths must be unique",
      });
    }
    if (assetIds.has(asset.id)) {
      issues.push({
        path: `/assets/${index}/id`,
        message: "Asset ids must be unique",
      });
    }
    assetPaths.add(asset.path);
    assetIds.add(asset.id);
  }

  const renderer = companion.entity.renderer;
  const referenced = new Set<string>([renderer.asset]);
  if (renderer.type === "sprite-atlas") {
    for (const page of renderer.pages ?? []) referenced.add(page);
  }
  if (companion.metadata.preview) referenced.add(companion.metadata.preview);
  for (const path of referenced) {
    if (!assetPaths.has(path)) {
      issues.push({
        path: "/assets",
        message: `Referenced asset is not declared: ${path}`,
      });
    }
  }

  if (renderer.type !== "sprite-atlas") {
    if (companion.entity.behaviors.includes("look-at-pointer")) {
      issues.push({
        path: "/entity/behaviors",
        message: "A static image cannot use look-at-pointer",
      });
    }
    return issues;
  }

  const frameCount = renderer.frameCount ?? renderer.directions;
  if (renderer.directions !== frameCount) {
    issues.push({
      path: "/entity/renderer/directions",
      message: "directions must equal frameCount for companion v1 packages",
    });
  }
  const capacity =
    (renderer.framesPerPage ?? renderer.columns * renderer.rows) *
    (renderer.pages?.length ?? 1);
  if (frameCount > capacity) {
    issues.push({
      path: "/entity/renderer/frameCount",
      message: "frameCount exceeds the declared atlas page capacity",
    });
  }

  const poses = renderer.poses ?? [];
  const poseIds = new Set<string>();
  let previousAngle = -1;
  for (const [index, pose] of poses.entries()) {
    if (poseIds.has(pose.id)) {
      issues.push({
        path: `/entity/renderer/poses/${index}/id`,
        message: "Pose ids must be unique",
      });
    }
    if (pose.angle <= previousAngle) {
      issues.push({
        path: `/entity/renderer/poses/${index}/angle`,
        message: "Pose angles must be unique and strictly increasing",
      });
    }
    if (pose.frame >= frameCount) {
      issues.push({
        path: `/entity/renderer/poses/${index}/frame`,
        message: "Pose frame exceeds frameCount",
      });
    }
    poseIds.add(pose.id);
    previousAngle = pose.angle;
  }

  const clipIds = new Set<string>();
  for (const [index, clip] of (renderer.idleClips ?? []).entries()) {
    if (clipIds.has(clip.id)) {
      issues.push({
        path: `/entity/renderer/idleClips/${index}/id`,
        message: "Idle clip ids must be unique",
      });
    }
    clipIds.add(clip.id);
    if (clip.minimumDelayMs > clip.maximumDelayMs) {
      issues.push({
        path: `/entity/renderer/idleClips/${index}`,
        message: "minimumDelayMs cannot exceed maximumDelayMs",
      });
    }
    for (const poseId of clip.poseIds) {
      if (!poseIds.has(poseId)) {
        issues.push({
          path: `/entity/renderer/idleClips/${index}/poseIds`,
          message: `Unknown pose id: ${poseId}`,
        });
      }
    }
    for (const [frameIndex, frame] of clip.frames.entries()) {
      if (frame.frame >= frameCount) {
        issues.push({
          path: `/entity/renderer/idleClips/${index}/frames/${frameIndex}/frame`,
          message: "Idle frame exceeds frameCount",
        });
      }
    }
  }

  for (const [key, value] of [
    ["neutralFrame", renderer.neutralFrame],
    ["reducedMotionFrame", renderer.reducedMotionFrame],
  ] as const) {
    if (value !== undefined && value >= frameCount) {
      issues.push({
        path: `/entity/renderer/${key}`,
        message: `${key} exceeds frameCount`,
      });
    }
  }
  return issues;
}

export function validateCompanion(input: unknown): ThemeValidationResult {
  const valid = validateCompanionSchema(input);
  const issues = valid
    ? relationshipIssues(input as CompanionPackageDefinition)
    : (validateCompanionSchema.errors ?? []).map(issueFromAjv);
  return { ok: issues.length === 0, issues };
}

export function assertCompanion(
  input: unknown,
): asserts input is CompanionPackageDefinition {
  const result = validateCompanion(input);
  if (!result.ok) {
    throw new Error(
      result.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("\n"),
    );
  }
}
