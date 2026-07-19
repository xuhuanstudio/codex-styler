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
  | "surfaces.layout"
  | "surfaces.icon-style"
  | "surfaces.decorations"
  | "surfaces.accent"
  | "surfaces.opacity"
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
  "settings",
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
  "surfaces.layout": semantic(
    "surfaces.layout",
    "task",
    "html[data-codex-styler-layout]",
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
    "settings",
    "--codex-styler-accent",
  ),
  "surfaces.opacity": semantic(
    "surfaces.opacity",
    "settings",
    "--codex-styler-surface/quietSurfaceOpacity",
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
