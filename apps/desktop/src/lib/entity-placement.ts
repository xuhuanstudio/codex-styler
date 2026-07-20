import type { EntityAttachment } from "@codex-styler/theme-core";

export interface EntityDimensions {
  width: number;
  height: number;
}

export interface EntityViewport {
  width: number;
  height: number;
}

export interface EntityPoint {
  x: number;
  y: number;
}

export interface EntityTargetRect extends EntityPoint {
  width: number;
  height: number;
}

export const ENTITY_SAFE_INSET = 8;

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function clampEntityCenter(
  value: number,
  extent: number,
  viewportExtent: number,
  inset = ENTITY_SAFE_INSET,
) {
  const viewport = Math.max(0, finiteOr(viewportExtent, 0));
  const halfExtent = Math.max(0, finiteOr(extent, 0)) / 2;
  const safeInset = Math.max(0, finiteOr(inset, ENTITY_SAFE_INSET));
  const minimum = safeInset + halfExtent;
  const maximum = viewport - safeInset - halfExtent;

  if (minimum > maximum) return viewport / 2;
  return Math.max(minimum, Math.min(maximum, finiteOr(value, viewport / 2)));
}

export function resolveFreeEntityPosition(
  point: EntityPoint,
  entity: EntityDimensions,
  viewport: EntityViewport,
  inset = ENTITY_SAFE_INSET,
): EntityPoint {
  return {
    x: clampEntityCenter(point.x, entity.width, viewport.width, inset),
    y: clampEntityCenter(point.y, entity.height, viewport.height, inset),
  };
}

export function resolveFreeEntityAnchor(
  point: EntityPoint,
  entity: EntityDimensions,
  viewport: EntityViewport,
  inset = ENTITY_SAFE_INSET,
): EntityPoint {
  const safe = resolveFreeEntityPosition(point, entity, viewport, inset);
  return {
    x: viewport.width > 0 ? (safe.x / viewport.width) * 100 : 50,
    y: viewport.height > 0 ? (safe.y / viewport.height) * 100 : 50,
  };
}

function clampAttachedEdge(
  value: number,
  entityHeight: number,
  viewportHeight: number,
  edge: EntityAttachment["edge"],
  inset: number,
) {
  const height = Math.max(0, finiteOr(entityHeight, 0));
  const viewport = Math.max(0, finiteOr(viewportHeight, 0));
  const safeInset = Math.max(0, finiteOr(inset, ENTITY_SAFE_INSET));
  const minimum = edge === "top" ? safeInset + height : safeInset;
  const maximum =
    edge === "top" ? viewport - safeInset : viewport - safeInset - height;

  if (minimum > maximum) {
    return edge === "top" ? viewport - safeInset : safeInset;
  }
  return Math.max(minimum, Math.min(maximum, finiteOr(value, minimum)));
}

export function resolveAttachedEntityPosition(
  target: EntityTargetRect,
  attachment: EntityAttachment,
  entity: EntityDimensions,
  viewport: EntityViewport,
  inset = ENTITY_SAFE_INSET,
): EntityPoint {
  const edgeY =
    attachment.edge === "bottom" ? target.y + target.height : target.y;
  return {
    x: clampEntityCenter(
      target.x + target.width * attachment.align + attachment.offset.x,
      entity.width,
      viewport.width,
      inset,
    ),
    y: clampAttachedEdge(
      edgeY + attachment.offset.y,
      entity.height,
      viewport.height,
      attachment.edge,
      inset,
    ),
  };
}
