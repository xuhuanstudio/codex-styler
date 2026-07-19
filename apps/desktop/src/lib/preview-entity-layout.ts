const CODEX_REFERENCE_VIEWPORT_HEIGHT = 760;
const MINIMUM_PREVIEW_SCALE = 0.2;

/**
 * Companion sizes are authored in Codex pixels. Manager previews render a
 * miniature Codex viewport, so raw package pixels must be scaled against the
 * same 1280 x 760 reference used by the editor's 100% preview.
 */
export function resolvePreviewEntityScale(viewportHeight: number) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 1;
  return Math.min(
    1,
    Math.max(
      MINIMUM_PREVIEW_SCALE,
      viewportHeight / CODEX_REFERENCE_VIEWPORT_HEIGHT,
    ),
  );
}

export function previewEntityDimensions(
  sourceWidth: number,
  sourceHeight: number,
  viewportHeight: number,
) {
  const scale = resolvePreviewEntityScale(viewportHeight);
  return {
    scale,
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}
