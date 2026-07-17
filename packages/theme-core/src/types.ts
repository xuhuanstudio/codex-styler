export const THEME_FORMAT = "codex-styler-theme-v1" as const;

export type ThemeFormat = typeof THEME_FORMAT;
export type ThemeVariantName = "light" | "dark";
export type AssetType = "background" | "sprite-atlas" | "preview";
export type RendererType = "image" | "sprite-atlas";
export type BehaviorType =
  "idle" | "parallax" | "look-at-pointer" | "reduce-motion-fallback";

export interface ThemeMetadata {
  name: string;
  description: string;
  author: string;
  license: string;
  tags: string[];
  homepage?: string;
  preview?: string;
}

export interface ThemeCompatibility {
  styler: {
    minimumVersion: string;
  };
  codex: {
    mode: "safe" | "semantic";
    testedVersions: string[];
  };
}

export interface ThemeBackground {
  color: string;
  image?: string;
  position: {
    x: number;
    y: number;
  };
  brightness: number;
  blur: number;
  overlay: string;
  overlayOpacity: number;
}

/**
 * Stable semantic color roles exposed to theme authors. Codex-specific CSS
 * variables stay inside the compatibility adapter and are never part of a
 * portable theme package.
 */
export interface ThemeSemanticPalette {
  canvas?: string;
  surfaceRaised?: string;
  surfaceOverlay?: string;
  surfaceSunken?: string;
  control?: string;
  controlHover?: string;
  controlActive?: string;
  textTertiary?: string;
  onAccent?: string;
  borderSubtle?: string;
  borderStrong?: string;
  focus?: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  added?: string;
  modified?: string;
  deleted?: string;
}

export interface ThemeAppearance {
  accent: string;
  surface: string;
  surfaceOpacity: number;
  text: string;
  mutedText: string;
  border: string;
  radius: number;
  focusOpacity: number;
  focusBlur: number;
  layout?: "native" | "editorial" | "immersive";
  iconStyle?: "native" | "contained" | "themed";
  decorations?: "none" | "subtle" | "expressive";
  palette?: ThemeSemanticPalette;
}

export interface ThemeMotion {
  intensity: number;
  parallax: number;
  targetFps: 24 | 30 | 60;
}

export interface ThemeVariant {
  background: ThemeBackground;
  appearance: ThemeAppearance;
  motion: ThemeMotion;
}

export interface SceneLayer {
  id: string;
  type: "image" | "gradient" | "vignette";
  asset?: string;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light";
  parallax: number;
}

export interface SpriteAtlasRenderer {
  type: "sprite-atlas";
  asset: string;
  pages?: string[];
  columns: number;
  rows: number;
  framesPerPage?: number;
  frameWidth: number;
  frameHeight: number;
  directions: number;
  frameAngles?: number[];
  transitionFps?: number;
  normalization?: "preserve" | "grounded";
  alphaThreshold?: number;
}

export interface ImageRenderer {
  type: "image";
  asset: string;
  normalization?: "preserve" | "grounded";
  alphaThreshold?: number;
}

export interface EntityAttachment {
  target: "composer" | "main-surface" | "thread-summary";
  edge: "top" | "bottom";
  align: number;
  offset: {
    x: number;
    y: number;
  };
}

export interface SceneEntity {
  id: string;
  name: string;
  renderer: SpriteAtlasRenderer | ImageRenderer;
  behaviors: BehaviorType[];
  anchor: {
    x: number;
    y: number;
  };
  attachment?: EntityAttachment;
  size: number;
  opacity: number;
}

export interface ThemeAsset {
  id: string;
  path: string;
  type: AssetType;
  license: string;
}

export interface ThemeDefinition {
  format: ThemeFormat;
  id: string;
  version: string;
  metadata: ThemeMetadata;
  compatibility: ThemeCompatibility;
  variants: Record<ThemeVariantName, ThemeVariant>;
  scene: {
    layers: SceneLayer[];
    entities: SceneEntity[];
  };
  assets: ThemeAsset[];
  locales: Record<string, { name: string; description: string }>;
}

export interface ThemePackage {
  theme: ThemeDefinition;
  files: Map<string, Uint8Array>;
}

export interface ThemeValidationIssue {
  path: string;
  message: string;
}

export interface ThemeValidationResult {
  ok: boolean;
  issues: ThemeValidationIssue[];
}
