import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { MousePointer2 } from "lucide-react";
import {
  pointerDirectionFrame,
  type EntityAttachment,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import type { Locale } from "../lib/i18n";
import type { PreviewScenario } from "../lib/storage";
import {
  resolveAttachedEntityPosition,
  resolveFreeEntityAnchor,
  resolveFreeEntityPosition,
} from "../lib/entity-placement";
import { previewEntityDimensions } from "../lib/preview-entity-layout";
import { drawSpriteFrame } from "../lib/sprite-normalization";
import { resolveThemeContrast } from "../lib/theme-contrast";
import {
  resolveThemeMotionProfile,
  resolveThemeVisualPersonality,
} from "../lib/theme-effects";
import { resolveThemePreviewPalette } from "../lib/theme-preview-palette";
import { CodexPreviewShell } from "./preview/CodexPreviewShell";

interface PreviewWorkspaceProps {
  theme: ThemeDefinition;
  variant: "light" | "dark";
  locale: Locale;
  reduceMotion: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  presentation?: "styled" | "official";
  compact?: boolean;
  scenario?: PreviewScenario;
  onScenarioChange?: (scenario: PreviewScenario) => void;
  onEntityAnchorChange?: (anchor: { x: number; y: number }) => void;
  onEntityAttachmentChange?: (attachment: EntityAttachment | null) => void;
  motionPreviewRevision?: number;
}

export function PreviewWorkspace({
  theme,
  variant,
  locale,
  reduceMotion,
  resolveAsset,
  presentation = "styled",
  compact = false,
  scenario = "task",
  onScenarioChange,
  onEntityAnchorChange,
  onEntityAttachmentChange,
  motionPreviewRevision = 0,
}: PreviewWorkspaceProps) {
  const officialPreview = presentation === "official";
  const previewRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef<HTMLDivElement>(null);
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
  const motionCursorRef = useRef<HTMLDivElement>(null);
  const motionPreviewFrameRef = useRef<number | null>(null);
  const motionPreviewHandledRevisionRef = useRef(0);
  const spriteImageRefs = useRef<HTMLImageElement[]>([]);
  const [direction, setDirection] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [spriteReady, setSpriteReady] = useState(0);
  const [previewViewport, setPreviewViewport] = useState({
    width: 0,
    height: 0,
  });
  const interactive = Boolean(
    onScenarioChange || onEntityAnchorChange || onEntityAttachmentChange,
  );
  const visual = theme.variants[variant];
  const visualPersonality = useMemo(
    () => resolveThemeVisualPersonality(theme, variant),
    [theme, variant],
  );
  const motionProfile = useMemo(
    () =>
      resolveThemeMotionProfile(
        officialPreview || reduceMotion ? 0 : visual.motion.intensity,
      ),
    [officialPreview, reduceMotion, visual.motion.intensity],
  );
  const entity = officialPreview ? undefined : theme.scene.entities[0];
  const backgroundImage =
    !officialPreview && visual.background.image
      ? resolveAsset(theme, visual.background.image)
      : undefined;
  const backgroundLayer = officialPreview
    ? undefined
    : theme.scene.layers.find(
        (layer) =>
          layer.type === "image" && layer.asset === visual.background.image,
      );
  const entityImage = entity
    ? resolveAsset(theme, entity.renderer.asset)
    : undefined;
  const entityPageImages =
    entity?.renderer.type === "sprite-atlas"
      ? (entity.renderer.pages ?? [entity.renderer.asset]).map((path) =>
          resolveAsset(theme, path),
        )
      : [];
  const entityPageImagesKey = entityPageImages.join("\n");
  const contrastSystem = useMemo(
    () => resolveThemeContrast(theme, variant),
    [theme, variant],
  );
  const semanticPalette = useMemo(
    () =>
      resolveThemePreviewPalette(
        visual.appearance,
        visual.background.color,
        contrastSystem,
      ),
    [contrastSystem, visual.appearance, visual.background.color],
  );
  const sourceEntityHeight = entity
    ? entity.renderer.type === "sprite-atlas"
      ? entity.size * (entity.renderer.frameHeight / entity.renderer.frameWidth)
      : entity.size
    : 0;
  const previewEntity = entity
    ? previewEntityDimensions(
        entity.size,
        sourceEntityHeight,
        previewViewport.height,
      )
    : null;

  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const update = () => {
      const nextViewport = {
        width: preview.clientWidth,
        height: preview.clientHeight,
      };
      if (nextViewport.width > 0 && nextViewport.height > 0) {
        setPreviewViewport((current) =>
          current.width === nextViewport.width &&
          current.height === nextViewport.height
            ? current
            : nextViewport,
        );
      }
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  const clearSceneParallax = useCallback(() => {
    previewRef.current
      ?.querySelectorAll<HTMLElement>("[data-scene-parallax]")
      .forEach((layer) => layer.style.removeProperty("transform"));
  }, []);

  const applySceneParallax = useCallback(
    (x: number, y: number) => {
      previewRef.current
        ?.querySelectorAll<HTMLElement>("[data-scene-parallax]")
        .forEach((layer) => {
          const authoredDepth = Number(layer.dataset.sceneParallax || 0);
          const cappedDepth =
            Math.sign(authoredDepth) *
            Math.min(
              Math.abs(authoredDepth),
              Math.max(0, visual.motion.parallax ?? 0),
            );
          const depth = cappedDepth * visual.motion.intensity;
          if (depth === 0) {
            layer.style.removeProperty("transform");
            return;
          }
          layer.style.transform = `translate(${-x * depth}px, ${-y * depth}px) scale(var(--preview-parallax-scale, 1.015))`;
        });
    },
    [visual.motion.intensity, visual.motion.parallax],
  );

  const applyEntityDirection = useCallback(
    (clientX: number, clientY: number) => {
      if (
        !entity ||
        dragging ||
        reduceMotion ||
        entity.renderer.type !== "sprite-atlas"
      ) {
        return;
      }
      const bounds = entityRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setDirection(
        pointerDirectionFrame(
          clientX,
          clientY,
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2,
          entity.renderer.directions,
          entity.renderer.frameAngles,
        ),
      );
    },
    [dragging, entity, reduceMotion],
  );

  const stopMotionPreview = useCallback(
    (clearParallax = true) => {
      if (motionPreviewFrameRef.current !== null) {
        window.cancelAnimationFrame(motionPreviewFrameRef.current);
        motionPreviewFrameRef.current = null;
      }
      previewRef.current?.removeAttribute("data-motion-preview");
      motionCursorRef.current?.style.removeProperty("left");
      motionCursorRef.current?.style.removeProperty("top");
      if (clearParallax) clearSceneParallax();
    },
    [clearSceneParallax],
  );

  useEffect(() => {
    if (!entityPageImages.length || entity?.renderer.type !== "sprite-atlas") {
      spriteImageRefs.current = [];
      return;
    }
    const images = entityPageImages.map((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => setSpriteReady((value) => value + 1);
      image.src = source;
      return image;
    });
    spriteImageRefs.current = images;
    return () => {
      images.forEach((image) => {
        image.onload = null;
      });
      if (spriteImageRefs.current === images) spriteImageRefs.current = [];
    };
  }, [entity?.renderer.type, entityPageImagesKey]);

  useEffect(() => {
    if (
      !entity ||
      entity.renderer.type !== "sprite-atlas" ||
      !spriteCanvasRef.current
    )
      return;
    const framesPerPage =
      entity.renderer.framesPerPage ??
      entity.renderer.columns * entity.renderer.rows;
    const pageIndex = Math.floor(direction / framesPerPage);
    const image = spriteImageRefs.current[pageIndex];
    if (!image?.complete || !image.naturalWidth) return;
    const width = previewEntity?.width ?? entity.size;
    const height = previewEntity?.height ?? sourceEntityHeight;
    drawSpriteFrame(
      spriteCanvasRef.current,
      image,
      entity.renderer,
      direction % framesPerPage,
      width,
      height,
    );
  }, [
    direction,
    entity,
    previewEntity?.height,
    previewEntity?.width,
    sourceEntityHeight,
    spriteReady,
  ]);

  useEffect(() => {
    if (
      !reduceMotion &&
      visual.motion.intensity > 0 &&
      (visual.motion.parallax ?? 0) > 0
    ) {
      return;
    }
    stopMotionPreview();
  }, [
    reduceMotion,
    stopMotionPreview,
    visual.motion.intensity,
    visual.motion.parallax,
  ]);

  useEffect(() => {
    if (
      motionPreviewRevision <= 0 ||
      motionPreviewRevision <= motionPreviewHandledRevisionRef.current ||
      reduceMotion ||
      officialPreview ||
      visual.motion.intensity <= 0 ||
      (visual.motion.parallax ?? 0) <= 0
    ) {
      return;
    }

    motionPreviewHandledRevisionRef.current = motionPreviewRevision;
    stopMotionPreview();
    const preview = previewRef.current;
    if (!preview) return;
    preview.dataset.motionPreview = "playing";
    const duration = 1_450;
    const keyframes = [
      { at: 0, x: 0, y: 0 },
      { at: 0.3, x: 0.46, y: -0.32 },
      { at: 0.7, x: -0.42, y: 0.28 },
      { at: 1, x: 0, y: 0 },
    ];
    let startedAt: number | null = null;

    const animate = (timestamp: number) => {
      if (startedAt === null) startedAt = timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      let nextIndex = keyframes.findIndex((frame) => progress <= frame.at);
      if (nextIndex < 0) nextIndex = keyframes.length - 1;
      const to = keyframes[nextIndex];
      const from = keyframes[Math.max(0, nextIndex - 1)];
      const interval = Math.max(0.001, to.at - from.at);
      const localProgress = Math.min(
        1,
        Math.max(0, (progress - from.at) / interval),
      );
      const eased = localProgress * localProgress * (3 - 2 * localProgress);
      const x = from.x + (to.x - from.x) * eased;
      const y = from.y + (to.y - from.y) * eased;
      applySceneParallax(x, y);
      if (motionCursorRef.current) {
        motionCursorRef.current.style.left = `${(x + 0.5) * 100}%`;
        motionCursorRef.current.style.top = `${(y + 0.5) * 100}%`;
      }
      const bounds = preview.getBoundingClientRect();
      applyEntityDirection(
        bounds.left + (x + 0.5) * bounds.width,
        bounds.top + (y + 0.5) * bounds.height,
      );

      if (progress < 1) {
        motionPreviewFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        stopMotionPreview();
      }
    };

    motionPreviewFrameRef.current = window.requestAnimationFrame(animate);
    return () => stopMotionPreview();
  }, [
    applyEntityDirection,
    applySceneParallax,
    motionPreviewRevision,
    officialPreview,
    reduceMotion,
    stopMotionPreview,
    visual.motion.intensity,
    visual.motion.parallax,
  ]);

  useEffect(() => {
    const element = entityRef.current;
    const preview = previewRef.current;
    const attachment = entity?.attachment;
    if (!element || !preview || !attachment) return;
    const target =
      attachment.target === "composer"
        ? composerRef.current
        : attachment.target === "main-surface"
          ? mainRef.current
          : null;
    if (!target) return;

    const update = () => {
      const previewBounds = preview.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const scaleX = preview.clientWidth
        ? previewBounds.width / preview.clientWidth
        : 1;
      const scaleY = preview.clientHeight
        ? previewBounds.height / preview.clientHeight
        : 1;
      const position = resolveAttachedEntityPosition(
        {
          x: (targetBounds.left - previewBounds.left) / scaleX,
          y: (targetBounds.top - previewBounds.top) / scaleY,
          width: targetBounds.width / scaleX,
          height: targetBounds.height / scaleY,
        },
        {
          ...attachment,
          offset: {
            x: attachment.offset.x * (previewEntity?.scale ?? 1),
            y: attachment.offset.y * (previewEntity?.scale ?? 1),
          },
        },
        {
          width: previewEntity?.width ?? entity.size,
          height: previewEntity?.height ?? sourceEntityHeight,
        },
        {
          width: preview.clientWidth,
          height: preview.clientHeight,
        },
      );
      element.style.left = `${position.x}px`;
      element.style.top = `${position.y}px`;
    };
    update();
    let settleFrame = window.requestAnimationFrame(() => {
      update();
      settleFrame = window.requestAnimationFrame(update);
    });
    window.addEventListener("resize", update);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(preview);
    observer?.observe(target);
    if (mainRef.current) observer?.observe(mainRef.current);
    return () => {
      window.cancelAnimationFrame(settleFrame);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [entity, previewEntity?.scale]);

  const style = useMemo(() => {
    const officialPalette =
      variant === "dark"
        ? {
            background: "#17181b",
            surface: "#202226",
            text: "#f4f4f3",
            muted: "#a0a3aa",
            border: "#35383e",
            accent: "#747980",
          }
        : {
            background: "#f4f5f6",
            surface: "#ffffff",
            text: "#202226",
            muted: "#6e7279",
            border: "#d9dce1",
            accent: "#666c74",
          };
    return {
      "--preview-bg": officialPreview
        ? officialPalette.background
        : visual.background.color,
      "--preview-image": backgroundImage
        ? "url(" + backgroundImage + ")"
        : "none",
      "--preview-image-x": visual.background.position.x + "%",
      "--preview-image-y": visual.background.position.y + "%",
      "--preview-brightness": visual.background.brightness,
      "--preview-blur": visual.background.blur + "px",
      "--preview-overlay": visual.background.overlay,
      "--preview-overlay-opacity": officialPreview
        ? 0
        : visual.background.overlayOpacity,
      "--preview-surface": officialPreview
        ? officialPalette.surface
        : semanticPalette.surface,
      "--preview-surface-raised": officialPreview
        ? officialPalette.surface
        : semanticPalette.surfaceRaised,
      "--preview-surface-overlay": officialPreview
        ? officialPalette.surface
        : semanticPalette.surfaceOverlay,
      "--preview-surface-sunken": officialPreview
        ? officialPalette.background
        : semanticPalette.surfaceSunken,
      "--preview-control": officialPreview
        ? officialPalette.surface
        : semanticPalette.control,
      "--preview-control-hover": officialPreview
        ? officialPalette.border
        : semanticPalette.controlHover,
      "--preview-control-active": officialPreview
        ? officialPalette.accent
        : semanticPalette.controlActive,
      "--preview-surface-opacity": officialPreview
        ? 1
        : contrastSystem.quietSurfaceOpacity,
      "--preview-surface-strong-opacity": officialPreview
        ? 1
        : contrastSystem.strongSurfaceOpacity,
      "--preview-text": officialPreview
        ? officialPalette.text
        : semanticPalette.textPrimary,
      "--preview-muted": officialPreview
        ? officialPalette.muted
        : semanticPalette.textSecondary,
      "--preview-tertiary": officialPreview
        ? officialPalette.muted
        : semanticPalette.textTertiary,
      "--preview-icon": officialPreview
        ? officialPalette.muted
        : semanticPalette.icon,
      "--preview-icon-emphasis": officialPreview
        ? officialPalette.text
        : semanticPalette.iconEmphasis,
      "--preview-border": officialPreview
        ? officialPalette.border
        : semanticPalette.border,
      "--preview-border-subtle": officialPreview
        ? `color-mix(in srgb, ${officialPalette.border} 60%, transparent)`
        : semanticPalette.borderSubtle,
      "--preview-border-strong": officialPreview
        ? officialPalette.border
        : semanticPalette.borderStrong,
      "--preview-accent": officialPreview
        ? officialPalette.accent
        : semanticPalette.accent,
      "--preview-on-accent": officialPreview
        ? variant === "dark"
          ? "#ffffff"
          : "#17181b"
        : semanticPalette.onAccent,
      "--preview-focus": officialPreview
        ? officialPalette.accent
        : semanticPalette.focus,
      "--preview-success": officialPreview
        ? variant === "dark"
          ? "#77c894"
          : "#287a48"
        : semanticPalette.success,
      "--preview-warning": officialPreview
        ? variant === "dark"
          ? "#d2aa60"
          : "#8c641d"
        : semanticPalette.warning,
      "--preview-danger": officialPreview
        ? variant === "dark"
          ? "#dc7c79"
          : "#a94242"
        : semanticPalette.danger,
      "--preview-info": officialPreview
        ? officialPalette.accent
        : semanticPalette.info,
      "--preview-added": officialPreview
        ? variant === "dark"
          ? "#77c894"
          : "#287a48"
        : semanticPalette.added,
      "--preview-modified": officialPreview
        ? variant === "dark"
          ? "#d2aa60"
          : "#8c641d"
        : semanticPalette.modified,
      "--preview-deleted": officialPreview
        ? variant === "dark"
          ? "#dc7c79"
          : "#a94242"
        : semanticPalette.deleted,
      "--preview-radius": officialPreview
        ? "10px"
        : visual.appearance.radius + "px",
      "--preview-focus-blur": officialPreview
        ? "0px"
        : visual.appearance.focusBlur + "px",
      "--preview-motion-duration": motionProfile.durationMs + "ms",
      "--preview-motion-lift": motionProfile.hoverLiftPx + "px",
      "--preview-motion-press-scale": motionProfile.pressScale,
      "--preview-motion-overlay-opacity": motionProfile.overlayOpacity,
      "--preview-motion-overlay-offset": motionProfile.overlayOffsetPx + "px",
      "--preview-motion-overlay-scale": motionProfile.overlayScale,
    } as CSSProperties;
  }, [
    backgroundImage,
    contrastSystem,
    officialPreview,
    motionProfile,
    semanticPalette,
    variant,
    visual,
  ]);

  function handlePointer(event: MouseEvent<HTMLDivElement>) {
    const previewBounds = previewRef.current?.getBoundingClientRect();
    if (previewBounds && !reduceMotion) {
      stopMotionPreview(false);
      const x =
        (event.clientX - previewBounds.left) /
          Math.max(1, previewBounds.width) -
        0.5;
      const y =
        (event.clientY - previewBounds.top) /
          Math.max(1, previewBounds.height) -
        0.5;
      applySceneParallax(x, y);
    }
    applyEntityDirection(event.clientX, event.clientY);
  }

  function handleEntityPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!entity || (!onEntityAnchorChange && !onEntityAttachmentChange)) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handleEntityPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || !entity) return;
    const preview = previewRef.current;
    const bounds = preview?.getBoundingClientRect();
    if (!preview || !bounds) return;
    const composerBounds = composerRef.current?.getBoundingClientRect();
    if (
      composerBounds &&
      onEntityAttachmentChange &&
      Math.abs(event.clientY - composerBounds.top) <= 52
    ) {
      onEntityAttachmentChange({
        target: "composer",
        edge: "top",
        align: Math.max(
          0.08,
          Math.min(
            0.92,
            (event.clientX - composerBounds.left) / composerBounds.width,
          ),
        ),
        offset: { x: 0, y: 3 },
      });
      return;
    }
    onEntityAttachmentChange?.(null);
    if (!onEntityAnchorChange) return;
    const scaleX = bounds.width / Math.max(1, preview.clientWidth);
    const scaleY = bounds.height / Math.max(1, preview.clientHeight);
    onEntityAnchorChange(
      resolveFreeEntityAnchor(
        {
          x: (event.clientX - bounds.left) / scaleX,
          y: (event.clientY - bounds.top) / scaleY,
        },
        {
          width: previewEntity?.width ?? entity.size,
          height: previewEntity?.height ?? sourceEntityHeight,
        },
        {
          width: preview.clientWidth,
          height: preview.clientHeight,
        },
      ),
    );
  }

  function handleEntityPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  const isChinese = locale === "zh-CN";
  const safeFreePosition =
    entity && previewEntity && previewViewport.width > 0
      ? resolveFreeEntityPosition(
          {
            x: (entity.anchor.x / 100) * previewViewport.width,
            y: (entity.anchor.y / 100) * previewViewport.height,
          },
          previewEntity,
          previewViewport,
        )
      : null;
  const entityStyle = entity
    ? ({
        "--entity-image": entityImage ? "url(" + entityImage + ")" : "none",
        "--entity-x": safeFreePosition
          ? `${safeFreePosition.x}px`
          : entity.anchor.x + "%",
        "--entity-y": safeFreePosition
          ? `${safeFreePosition.y}px`
          : entity.anchor.y + "%",
        "--entity-size": (previewEntity?.width ?? entity.size) + "px",
        "--entity-height": (previewEntity?.height ?? sourceEntityHeight) + "px",
        "--entity-opacity": entity.opacity,
      } as CSSProperties)
    : undefined;
  const entityOverlay = entity && scenario !== "components" && (
    <div
      ref={entityRef}
      className={
        "scene-entity" + (reduceMotion ? " scene-entity--reduced" : "")
      }
      style={entityStyle}
      aria-label={entity.name}
      data-draggable={Boolean(onEntityAnchorChange || onEntityAttachmentChange)}
      data-dragging={dragging}
      data-attached={Boolean(entity.attachment)}
      data-attachment-edge={entity.attachment?.edge}
      data-preview-scale={previewEntity?.scale.toFixed(3)}
      onPointerDown={handleEntityPointerDown}
      onPointerMove={handleEntityPointerMove}
      onPointerUp={handleEntityPointerUp}
      onPointerCancel={handleEntityPointerUp}
    >
      {entityImage && entity.renderer.type === "sprite-atlas" ? (
        <canvas
          ref={spriteCanvasRef}
          className="scene-entity__sprite"
          data-ready={spriteReady > 0 ? "true" : "false"}
          style={{ width: "100%", height: "100%" }}
        />
      ) : entityImage ? (
        <div className="scene-entity__image" />
      ) : (
        <div className="scene-entity__fallback">
          <span className="scene-gecko__tail" />
          <span className="scene-gecko__body">
            <i />
            <i />
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={previewRef}
      className={
        "workspace-preview" + (compact ? " workspace-preview--compact" : "")
      }
      style={style}
      onMouseMove={handlePointer}
      data-theme-variant={variant}
      data-layout={
        officialPreview ? "native" : (visual.appearance.layout ?? "native")
      }
      data-icon-style={
        officialPreview ? "native" : (visual.appearance.iconStyle ?? "native")
      }
      data-decorations={
        officialPreview ? "none" : (visual.appearance.decorations ?? "none")
      }
      data-geometry={officialPreview ? "native" : visualPersonality.geometry}
      data-material={officialPreview ? undefined : visualPersonality.material}
      data-typography={
        officialPreview ? undefined : visualPersonality.typography
      }
      data-motion-character={motionProfile.character}
      data-contrast-tone={officialPreview ? variant : contrastSystem.tone}
      data-preview-presentation={presentation}
      data-preview-scenario={scenario}
      role={interactive ? "group" : undefined}
      aria-label={
        interactive
          ? isChinese
            ? "Codex 主题预览"
            : "Codex theme preview"
          : undefined
      }
      aria-hidden={interactive ? undefined : true}
      inert={interactive ? undefined : true}
    >
      <div
        ref={motionCursorRef}
        className="workspace-motion-cursor"
        aria-hidden="true"
      >
        <MousePointer2 size={13} />
      </div>
      <div
        className="workspace-preview__backdrop"
        data-layer-id={backgroundLayer?.id}
        data-scene-parallax={backgroundLayer?.parallax}
        style={
          backgroundLayer
            ? ({
                opacity: backgroundLayer.opacity,
                mixBlendMode: backgroundLayer.blendMode,
              } as CSSProperties)
            : undefined
        }
      />
      {!officialPreview &&
        theme.scene.layers.map((layer) => {
          if (
            layer.type === "image" &&
            layer.asset === visual.background.image
          ) {
            return null;
          }
          const layerImage =
            layer.type === "image" && layer.asset
              ? resolveAsset(theme, layer.asset)
              : undefined;
          return (
            <div
              key={layer.id}
              className={`workspace-preview__scene-layer workspace-preview__scene-layer--${layer.type}`}
              data-layer-id={layer.id}
              data-scene-parallax={layer.parallax}
              style={
                {
                  opacity: layer.opacity,
                  mixBlendMode: layer.blendMode,
                  backgroundImage: layerImage
                    ? `url(${layerImage})`
                    : undefined,
                } as CSSProperties
              }
            />
          );
        })}
      <div className="workspace-preview__overlay" />
      <CodexPreviewShell
        locale={locale}
        scenario={scenario}
        mainRef={mainRef}
        composerRef={composerRef}
        onScenarioChange={onScenarioChange}
        entityOverlay={entityOverlay}
      />
    </div>
  );
}
