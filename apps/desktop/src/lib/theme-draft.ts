import type {
  ThemeDefinition,
  ThemeVariantName,
} from "@codex-styler/theme-core";

export type EditableThemeVariantSection =
  "background" | "appearance" | "motion";

const paletteAnchorFields = new Set([
  "accent",
  "surface",
  "border",
  "text",
  "mutedText",
]);

/**
 * Updates a cloned draft in place. Detailed component colors are derived from
 * the five appearance anchors, so retaining them after an anchor edit would
 * leave Codex panels, controls, and status colors on the previous palette.
 */
export function assignThemeVariantField(
  theme: ThemeDefinition,
  variant: ThemeVariantName,
  section: EditableThemeVariantSection,
  key: string,
  value: number | string,
) {
  const target = theme.variants[variant][section] as unknown as Record<
    string,
    number | string | object | undefined
  >;
  target[key] = value;
  if (section === "appearance" && paletteAnchorFields.has(key)) {
    target.palette = undefined;
  }
}
