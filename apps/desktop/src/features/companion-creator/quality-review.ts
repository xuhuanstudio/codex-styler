import type { CompanionCreatorProject, EdgeReviewBackdrop } from "./model";

export const requiredEdgeReviewBackdrops = [
  "black",
  "white",
  "theme",
] as const satisfies readonly EdgeReviewBackdrop[];

export interface EdgeReviewSummary {
  reviewed: EdgeReviewBackdrop[];
  remaining: EdgeReviewBackdrop[];
  completed: number;
  total: number;
  complete: boolean;
  next: EdgeReviewBackdrop | null;
}

export function pendingEdgeReview(): EdgeReviewSummary {
  return {
    reviewed: [],
    remaining: [...requiredEdgeReviewBackdrops],
    completed: 0,
    total: requiredEdgeReviewBackdrops.length,
    complete: false,
    next: requiredEdgeReviewBackdrops[0],
  };
}

function compactFingerprint(value: unknown): string {
  const source = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function edgeReviewFingerprint(
  project: CompanionCreatorProject,
): string {
  return compactFingerprint({
    source: project.source?.files.map(({ name, size, lastModified }) => ({
      name,
      size,
      lastModified,
    })),
    cleanup: project.cleanup,
    crop: project.sharedCrop,
    groundLine: project.groundLine,
    contentScale: project.contentScale,
    frames: project.frames.map((frame) => ({
      id: frame.id,
      sourceIndex: frame.sourceIndex,
      excluded: frame.excluded,
      offset: frame.baselineOffset,
      bounds: frame.subjectBounds,
    })),
  });
}

export function summarizeEdgeReview(
  project: CompanionCreatorProject,
): EdgeReviewSummary {
  const reviewIsCurrent =
    project.qualityReview.edgeSignature === edgeReviewFingerprint(project);
  const reviewedSet = new Set(
    reviewIsCurrent ? project.qualityReview.edgeBackdrops : [],
  );
  const reviewed = requiredEdgeReviewBackdrops.filter((backdrop) =>
    reviewedSet.has(backdrop),
  );
  const remaining = requiredEdgeReviewBackdrops.filter(
    (backdrop) => !reviewedSet.has(backdrop),
  );
  return {
    reviewed,
    remaining,
    completed: reviewed.length,
    total: requiredEdgeReviewBackdrops.length,
    complete: remaining.length === 0,
    next: remaining[0] ?? null,
  };
}

export function markEdgeBackdropReviewed(
  project: CompanionCreatorProject,
  backdrop: EdgeReviewBackdrop,
): void {
  const signature = edgeReviewFingerprint(project);
  if (project.qualityReview.edgeSignature !== signature) {
    project.qualityReview.edgeBackdrops = [];
  }
  project.qualityReview.edgeSignature = signature;
  project.qualityReview.edgeBackdrops = [
    ...new Set([...project.qualityReview.edgeBackdrops, backdrop]),
  ];
}

export function resetEdgeReview(project: CompanionCreatorProject): void {
  project.qualityReview.edgeBackdrops = [];
  project.qualityReview.edgeSignature = null;
}
