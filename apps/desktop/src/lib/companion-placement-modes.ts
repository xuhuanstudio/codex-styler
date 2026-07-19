import type { EntityAttachment } from "@codex-styler/theme-core";

export type CompanionPlacementMode = "composer" | "free" | "custom";
export type SelectableCompanionPlacementMode = Exclude<
  CompanionPlacementMode,
  "custom"
>;

export interface CompanionPlacementValue {
  anchor: { x: number; y: number };
  attachment: EntityAttachment | null;
}

const defaultComposerAttachment: EntityAttachment = {
  target: "composer",
  edge: "top",
  align: 0.82,
  offset: { x: 0, y: 3 },
};

export function resolveCompanionPlacementMode(
  attachment: EntityAttachment | null | undefined,
): CompanionPlacementMode {
  if (!attachment) return "free";
  return attachment.target === "composer" ? "composer" : "custom";
}

export function applyCompanionPlacementMode(
  mode: SelectableCompanionPlacementMode,
  current: CompanionPlacementValue,
  packageAttachment?: EntityAttachment,
): CompanionPlacementValue {
  if (mode === "free") {
    return {
      anchor: { ...current.anchor },
      attachment: null,
    };
  }

  const preferredAttachment =
    current.attachment?.target === "composer"
      ? current.attachment
      : packageAttachment?.target === "composer"
        ? packageAttachment
        : defaultComposerAttachment;

  return {
    anchor: { ...current.anchor },
    attachment: structuredClone(preferredAttachment),
  };
}
