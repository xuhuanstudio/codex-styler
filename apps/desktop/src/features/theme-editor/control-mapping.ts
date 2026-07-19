import type { PreviewScenario } from "../../lib/storage";

export type ThemeEditorSectionId =
  "background" | "scene" | "surfaces" | "motion" | "pairing";

export type ThemeEditorRuntimeMode = "isolated" | "semantic" | "metadata";

export type ThemeEditorControlId =
  | "background.import-image"
  | "background.adaptive-scheme"
  | "background.overlay-color"
  | "background.brightness"
  | "background.blur"
  | "background.overlay-opacity"
  | "scene.opacity"
  | "scene.blend-mode"
  | "scene.parallax"
  | "scene.add-layer"
  | "scene.remove-layer"
  | "surfaces.treatment"
  | "surfaces.material"
  | "surfaces.layout"
  | "surfaces.icon-style"
  | "surfaces.decorations"
  | "surfaces.accent"
  | "surfaces.surface-color"
  | "surfaces.border-color"
  | "surfaces.color-harmony"
  | "surfaces.opacity"
  | "surfaces.focus-opacity"
  | "surfaces.focus-blur"
  | "surfaces.radius"
  | "motion.recipe"
  | "motion.intensity"
  | "motion.parallax"
  | "pairing.recommended-companion";

export interface ThemeEditorControlMapping {
  id: ThemeEditorControlId;
  section: ThemeEditorSectionId;
  mode: ThemeEditorRuntimeMode;
  scenarios: readonly PreviewScenario[];
  recommendedScenario: PreviewScenario | null;
  runtimeSignal: string;
}

const allPreviewScenarios = [
  "home",
  "task",
  "changes",
  "terminal",
  "settings",
  "components",
  "dialog",
  "right-panel",
] as const satisfies readonly PreviewScenario[];

const isolated = (
  id: ThemeEditorControlId,
  section: "background" | "scene" | "motion",
  recommendedScenario: PreviewScenario,
  runtimeSignal: string,
): ThemeEditorControlMapping => ({
  id,
  section,
  mode: "isolated",
  scenarios: allPreviewScenarios,
  recommendedScenario,
  runtimeSignal,
});

const semantic = (
  id: ThemeEditorControlId,
  recommendedScenario: PreviewScenario,
  runtimeSignal: string,
): ThemeEditorControlMapping => ({
  id,
  section: "surfaces",
  mode: "semantic",
  scenarios: allPreviewScenarios,
  recommendedScenario,
  runtimeSignal,
});

export const themeEditorControlMappings: Readonly<
  Record<ThemeEditorControlId, ThemeEditorControlMapping>
> = {
  "background.import-image": isolated(
    "background.import-image",
    "background",
    "home",
    "theme.background.image+adaptiveScheme",
  ),
  "background.adaptive-scheme": isolated(
    "background.adaptive-scheme",
    "background",
    "home",
    "theme.background+appearance+motion",
  ),
  "background.overlay-color": isolated(
    "background.overlay-color",
    "background",
    "home",
    "#codex-styler-scene-root .cs-overlay/background",
  ),
  "background.brightness": isolated(
    "background.brightness",
    "background",
    "home",
    "#codex-styler-scene-root .cs-background/filter",
  ),
  "background.blur": isolated(
    "background.blur",
    "background",
    "home",
    "#codex-styler-scene-root .cs-background/filter",
  ),
  "background.overlay-opacity": isolated(
    "background.overlay-opacity",
    "background",
    "home",
    "#codex-styler-scene-root .cs-overlay/opacity",
  ),
  "scene.opacity": isolated(
    "scene.opacity",
    "scene",
    "home",
    "#codex-styler-scene-root [data-layer-id]/opacity",
  ),
  "scene.blend-mode": isolated(
    "scene.blend-mode",
    "scene",
    "home",
    "#codex-styler-scene-root [data-layer-id]/mixBlendMode",
  ),
  "scene.parallax": isolated(
    "scene.parallax",
    "scene",
    "home",
    "#codex-styler-scene-root [data-layer-id]/transform",
  ),
  "scene.add-layer": isolated(
    "scene.add-layer",
    "scene",
    "home",
    "#codex-styler-scene-root [data-layer-id]",
  ),
  "scene.remove-layer": isolated(
    "scene.remove-layer",
    "scene",
    "home",
    "#codex-styler-scene-root [data-layer-id]",
  ),
  "surfaces.treatment": semantic(
    "surfaces.treatment",
    "components",
    "html[data-codex-styler-layout]+html[data-codex-styler-icons]+html[data-codex-styler-decorations]",
  ),
  "surfaces.material": semantic(
    "surfaces.material",
    "dialog",
    "theme.appearance/surfaceOpacity+focusOpacity+focusBlur",
  ),
  "surfaces.layout": semantic(
    "surfaces.layout",
    "task",
    "html[data-codex-styler-layout]+html[data-codex-styler-typography]",
  ),
  "surfaces.icon-style": semantic(
    "surfaces.icon-style",
    "right-panel",
    "html[data-codex-styler-icons]",
  ),
  "surfaces.decorations": semantic(
    "surfaces.decorations",
    "dialog",
    "html[data-codex-styler-decorations]",
  ),
  "surfaces.accent": semantic(
    "surfaces.accent",
    "components",
    "--codex-styler-accent",
  ),
  "surfaces.surface-color": semantic(
    "surfaces.surface-color",
    "components",
    "--codex-styler-surface",
  ),
  "surfaces.border-color": semantic(
    "surfaces.border-color",
    "components",
    "--codex-styler-border",
  ),
  "surfaces.color-harmony": semantic(
    "surfaces.color-harmony",
    "components",
    "theme.appearance.palette/semantic component roles",
  ),
  "surfaces.opacity": semantic(
    "surfaces.opacity",
    "settings",
    "--codex-styler-surface/quietSurfaceOpacity",
  ),
  "surfaces.focus-opacity": semantic(
    "surfaces.focus-opacity",
    "dialog",
    "--codex-styler-surface/strongSurfaceOpacity",
  ),
  "surfaces.focus-blur": semantic(
    "surfaces.focus-blur",
    "dialog",
    "[role=dialog]/backdrop-filter",
  ),
  "surfaces.radius": semantic(
    "surfaces.radius",
    "dialog",
    "[role=dialog]/border-radius",
  ),
  "motion.recipe": isolated(
    "motion.recipe",
    "motion",
    "task",
    "theme.motion/intensity+parallax+targetFps",
  ),
  "motion.intensity": isolated(
    "motion.intensity",
    "motion",
    "task",
    "#codex-styler-scene-root [data-parallax]/transform",
  ),
  "motion.parallax": isolated(
    "motion.parallax",
    "motion",
    "task",
    "#codex-styler-scene-root [data-parallax]/transform",
  ),
  "pairing.recommended-companion": {
    id: "pairing.recommended-companion",
    section: "pairing",
    mode: "metadata",
    scenarios: [],
    recommendedScenario: null,
    runtimeSignal: "theme.metadata.recommendedCompanionId",
  },
};

export interface ThemeEditorSectionCoverage {
  section: ThemeEditorSectionId;
  mode: ThemeEditorRuntimeMode;
  scenarios: readonly PreviewScenario[];
  recommendedScenario: PreviewScenario | null;
  controlIds: readonly ThemeEditorControlId[];
}

export function themeEditorSectionCoverage(
  section: ThemeEditorSectionId,
): ThemeEditorSectionCoverage {
  const controls = Object.values(themeEditorControlMappings).filter(
    (mapping) => mapping.section === section,
  );
  return {
    section,
    mode: controls[0]?.mode ?? "metadata",
    scenarios: controls[0]?.scenarios ?? [],
    recommendedScenario: controls[0]?.recommendedScenario ?? null,
    controlIds: controls.map((mapping) => mapping.id),
  };
}
