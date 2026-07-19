import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleX,
  Command,
  FileDiff,
  GitBranch,
  MoreHorizontal,
  MousePointer2,
  PanelRight,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  pointerDirectionFrame,
  type EntityAttachment,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import type { Locale } from "../lib/i18n";
import type { PreviewScenario } from "../lib/storage";
import { drawSpriteFrame } from "../lib/sprite-normalization";
import { resolveThemeContrast } from "../lib/theme-contrast";
import { resolveThemeVisualPersonality } from "../lib/theme-effects";
import { resolveThemePreviewPalette } from "../lib/theme-preview-palette";
import { ChangeReviewPreview } from "./preview/ChangeReviewPreview";
import { TaskActivityPreview } from "./preview/TaskActivityPreview";
import { TerminalActivityPreview } from "./preview/TerminalActivityPreview";

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
  const interactive = Boolean(
    onScenarioChange || onEntityAnchorChange || onEntityAttachmentChange,
  );
  const visual = theme.variants[variant];
  const visualPersonality = useMemo(
    () => resolveThemeVisualPersonality(theme, variant),
    [theme, variant],
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
    const height =
      entity.size * (entity.renderer.frameHeight / entity.renderer.frameWidth);
    drawSpriteFrame(
      spriteCanvasRef.current,
      image,
      entity.renderer,
      direction % framesPerPage,
      entity.size,
      height,
    );
  }, [direction, entity, spriteReady]);

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
      const edgeY =
        attachment.edge === "bottom" ? targetBounds.bottom : targetBounds.top;
      element.style.left =
        targetBounds.left -
        previewBounds.left +
        targetBounds.width * attachment.align +
        attachment.offset.x +
        "px";
      element.style.top =
        edgeY - previewBounds.top + attachment.offset.y + "px";
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(preview);
    observer.observe(target);
    return () => observer.disconnect();
  }, [entity]);

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
        : visual.appearance.surface,
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
        : contrastSystem.textPrimary,
      "--preview-muted": officialPreview
        ? officialPalette.muted
        : contrastSystem.textSecondary,
      "--preview-border": officialPreview
        ? officialPalette.border
        : visual.appearance.border,
      "--preview-accent": officialPreview
        ? officialPalette.accent
        : visual.appearance.accent,
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
      "--preview-motion-duration": reduceMotion
        ? "0ms"
        : Math.round(120 + visual.motion.intensity * 110) + "ms",
    } as CSSProperties;
  }, [
    backgroundImage,
    contrastSystem,
    officialPreview,
    reduceMotion,
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
    if (!dragging) return;
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;
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
    onEntityAnchorChange({
      x: Math.max(
        4,
        Math.min(96, ((event.clientX - bounds.left) / bounds.width) * 100),
      ),
      y: Math.max(
        6,
        Math.min(94, ((event.clientY - bounds.top) / bounds.height) * 100),
      ),
    });
  }

  function handleEntityPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  const isChinese = locale === "zh-CN";
  const entityStyle = entity
    ? ({
        "--entity-image": entityImage ? "url(" + entityImage + ")" : "none",
        "--entity-x": entity.anchor.x + "%",
        "--entity-y": entity.anchor.y + "%",
        "--entity-size": entity.size + "px",
        "--entity-height":
          entity.renderer.type === "sprite-atlas"
            ? entity.size *
                (entity.renderer.frameHeight / entity.renderer.frameWidth) +
              "px"
            : entity.size + "px",
        "--entity-opacity": entity.opacity,
      } as CSSProperties)
    : undefined;

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
      data-motion-character={
        officialPreview ? "still" : visualPersonality.motion
      }
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
      <div className="workspace-preview__chrome">
        <aside className="workspace-sidebar">
          <div className="workspace-traffic" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <button className="workspace-switcher" tabIndex={-1}>
            <span className="workspace-mini-mark">
              <Command size={11} />
            </span>
            <span>{isChinese ? "我的工作区" : "My workspace"}</span>
            <ChevronDown size={11} />
          </button>
          <button className="workspace-new-task" tabIndex={-1}>
            <Plus size={12} />
            <span>{isChinese ? "新任务" : "New task"}</span>
          </button>
          <div className="workspace-section-label">
            {isChinese ? "最近" : "RECENT"}
          </div>
          <button
            className="workspace-task workspace-task--active"
            tabIndex={-1}
          >
            <span>
              {isChinese ? "主题架构与安全模型" : "Theme architecture & safety"}
            </span>
            <MoreHorizontal size={11} />
          </button>
          <button className="workspace-task" tabIndex={-1}>
            <span>{isChinese ? "文档站元数据" : "Documentation metadata"}</span>
          </button>
          <button className="workspace-task" tabIndex={-1}>
            <span>
              {isChinese ? "互动场景渲染器" : "Interactive scene renderer"}
            </span>
          </button>
          <div className="workspace-sidebar__footer">
            <Search size={12} />
            <span>{isChinese ? "搜索" : "Search"}</span>
          </div>
        </aside>

        <main className="workspace-main" ref={mainRef}>
          <header className="workspace-header">
            <div>
              <strong>
                {scenario === "home"
                  ? isChinese
                    ? "新任务"
                    : "New task"
                  : scenario === "settings"
                    ? isChinese
                      ? "设置"
                      : "Settings"
                    : scenario === "components"
                      ? isChinese
                        ? "组件与状态"
                        : "Components & states"
                      : scenario === "changes"
                        ? isChinese
                          ? "审查更改"
                          : "Review changes"
                        : scenario === "terminal"
                          ? isChinese
                            ? "终端"
                            : "Terminal"
                          : scenario === "dialog"
                            ? isChinese
                              ? "工作区"
                              : "Workspace"
                            : scenario === "right-panel"
                              ? isChinese
                                ? "审查更改"
                                : "Review changes"
                              : isChinese
                                ? "主题架构与安全模型"
                                : "Theme architecture & safety"}
              </strong>
              <span className="workspace-branch">
                <GitBranch size={10} />
                main
              </span>
            </div>
            <button className="workspace-header-action" tabIndex={-1}>
              <Sparkles size={12} />
              {isChinese ? "本地预览" : "Local preview"}
            </button>
          </header>

          {(["task", "changes", "terminal", "right-panel"] as const).includes(
            scenario as "task" | "changes" | "terminal" | "right-panel",
          ) && (
            <nav
              className="workspace-context-tabs"
              aria-label={isChinese ? "任务视图" : "Task views"}
            >
              {(
                [
                  ["task", isChinese ? "对话" : "Conversation"],
                  ["changes", isChinese ? "更改" : "Changes"],
                  ["terminal", isChinese ? "终端" : "Terminal"],
                ] as const
              ).map(([tabScenario, label]) => {
                const activeScenario =
                  scenario === "right-panel" ? "task" : scenario;
                const className =
                  activeScenario === tabScenario ? "is-active" : undefined;
                return onScenarioChange ? (
                  <button
                    key={tabScenario}
                    type="button"
                    role="tab"
                    className={className}
                    aria-selected={activeScenario === tabScenario}
                    onClick={() => onScenarioChange(tabScenario)}
                  >
                    {label}
                  </button>
                ) : (
                  <span key={tabScenario} className={className}>
                    {label}
                  </span>
                );
              })}
            </nav>
          )}

          <section className="workspace-conversation" data-scenario={scenario}>
            {scenario === "home" ? (
              <div className="workspace-home-state">
                <Sparkles size={18} />
                <strong>
                  {isChinese ? "我们应该构建什么？" : "What should we build?"}
                </strong>
                <div className="workspace-home-grid">
                  {[
                    isChinese ? "探索代码" : "Explore code",
                    isChinese ? "构建功能" : "Build feature",
                    isChinese ? "审查更改" : "Review changes",
                    isChinese ? "修复问题" : "Fix issue",
                  ].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            ) : scenario === "settings" ? (
              <div className="workspace-settings-state">
                <nav>
                  <span className="is-active">
                    <Settings size={11} />
                    {isChinese ? "通用" : "General"}
                  </span>
                  <span>
                    <SlidersHorizontal size={11} />
                    {isChinese ? "外观" : "Appearance"}
                  </span>
                  <span>
                    <Sparkles size={11} />
                    {isChinese ? "个性化" : "Personalization"}
                  </span>
                </nav>
                <div>
                  <strong>
                    {isChinese ? "应用设置" : "Application settings"}
                  </strong>
                  <span className="workspace-setting-row">
                    <i>
                      <b>{isChinese ? "外观" : "Appearance"}</b>
                      <small>{isChinese ? "跟随系统" : "Follow system"}</small>
                    </i>
                    <em>{isChinese ? "系统" : "System"}</em>
                  </span>
                  <span className="workspace-setting-row">
                    <i>
                      <b>{isChinese ? "减少动态" : "Reduce motion"}</b>
                      <small>
                        {isChinese ? "关闭位移动画" : "Limit movement"}
                      </small>
                    </i>
                    <em className="is-switch" />
                  </span>
                  <span className="workspace-setting-row">
                    <i>
                      <b>{isChinese ? "语言" : "Language"}</b>
                      <small>{isChinese ? "简体中文" : "English"}</small>
                    </i>
                    <em>{isChinese ? "简中" : "EN"}</em>
                  </span>
                </div>
              </div>
            ) : scenario === "components" ? (
              <div className="workspace-components-state">
                <div className="workspace-components-state__heading">
                  <span>
                    <strong>
                      {isChinese ? "界面状态检查" : "Interface state check"}
                    </strong>
                    <small>
                      {isChinese
                        ? "验证主题在真实控件和反馈中的表现"
                        : "Verify the theme across real controls and feedback"}
                    </small>
                  </span>
                  <em>{isChinese ? "语义主题" : "SEMANTIC"}</em>
                </div>
                <div className="workspace-component-tabs">
                  <span className="is-active">
                    {isChinese ? "概览" : "Overview"}
                  </span>
                  <span>{isChinese ? "更改" : "Changes"}</span>
                  <span>{isChinese ? "终端" : "Terminal"}</span>
                </div>
                <div className="workspace-component-grid">
                  <section className="workspace-component-card">
                    <strong>
                      {isChinese ? "操作与输入" : "Actions & input"}
                    </strong>
                    <div className="workspace-component-actions">
                      <button className="is-primary" tabIndex={-1}>
                        <Sparkles size={9} />
                        {isChinese ? "运行" : "Run"}
                      </button>
                      <button tabIndex={-1}>
                        <FileDiff size={9} />
                        {isChinese ? "审查" : "Review"}
                      </button>
                      <button disabled tabIndex={-1}>
                        <CircleX size={9} />
                        {isChinese ? "不可用" : "Disabled"}
                      </button>
                    </div>
                    <div className="workspace-component-input">
                      <Search size={10} />
                      <span>{isChinese ? "搜索更改…" : "Search changes…"}</span>
                      <i
                        className="workspace-component-caret"
                        aria-hidden="true"
                      />
                      <kbd>⌘ K</kbd>
                    </div>
                    <div className="workspace-component-interactions">
                      <span className="workspace-component-selection">
                        {isChinese ? "已选择文字" : "Selected text"}
                      </span>
                      <span className="workspace-component-link">
                        {isChinese ? "查看说明" : "View guide"}
                      </span>
                      <span className="workspace-component-scroll-sample">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </section>
                  <section className="workspace-component-card">
                    <strong>{isChinese ? "运行状态" : "Runtime health"}</strong>
                    <div className="workspace-component-status is-success">
                      <Check size={10} />
                      <span>{isChinese ? "主题已应用" : "Theme applied"}</span>
                    </div>
                    <div className="workspace-component-status is-warning">
                      <AlertTriangle size={10} />
                      <span>{isChinese ? "需要检查" : "Review needed"}</span>
                    </div>
                    <div className="workspace-component-status is-danger">
                      <CircleX size={10} />
                      <span>
                        {isChinese ? "连接失败" : "Connection failed"}
                      </span>
                    </div>
                  </section>
                  <section className="workspace-component-card workspace-component-depth">
                    <div className="workspace-component-depth__heading">
                      <strong>
                        {isChinese ? "表面层级" : "Surface hierarchy"}
                      </strong>
                      <small>
                        {isChinese ? "自动协调" : "Auto coordinated"}
                      </small>
                    </div>
                    <div className="workspace-component-depth__stack">
                      <span data-surface="canvas">
                        {isChinese ? "画布" : "Canvas"}
                      </span>
                      <span data-surface="raised">
                        {isChinese ? "抬升面板" : "Raised"}
                      </span>
                      <span data-surface="overlay">
                        {isChinese ? "聚焦浮层" : "Overlay"}
                      </span>
                    </div>
                  </section>
                  <section className="workspace-component-card workspace-component-diff">
                    <div className="workspace-component-diff__heading">
                      <span>
                        <FileDiff size={11} />
                        <strong>
                          {isChinese ? "更改预览" : "Change preview"}
                        </strong>
                      </span>
                      <small>theme.json</small>
                    </div>
                    <code data-change="added">
                      + &quot;surface&quot;: &quot;adaptive&quot;
                    </code>
                    <code data-change="modified">~ &quot;radius&quot;: 14</code>
                    <code data-change="deleted">
                      − &quot;legacyColor&quot;: true
                    </code>
                  </section>
                </div>
              </div>
            ) : scenario === "task" ? (
              <TaskActivityPreview isChinese={isChinese} />
            ) : scenario === "changes" ? (
              <ChangeReviewPreview isChinese={isChinese} />
            ) : scenario === "terminal" ? (
              <TerminalActivityPreview isChinese={isChinese} />
            ) : scenario === "right-panel" ? (
              <TaskActivityPreview isChinese={isChinese} />
            ) : (
              <>
                <div className="workspace-note">
                  <div className="workspace-note__icon">
                    <Check size={12} />
                  </div>
                  <div>
                    <strong>
                      {isChinese ? "方案已建立" : "Foundation is in place"}
                    </strong>
                    <p>
                      {isChinese
                        ? "主题保持纯数据，互动层不会接管任何点击事件。"
                        : "Themes remain data-only and the scene never captures clicks."}
                    </p>
                  </div>
                  <span className="workspace-note__status">
                    {isChinese ? "已验证" : "Verified"}
                  </span>
                </div>
                <div className="workspace-message">
                  <span className="workspace-avatar">CS</span>
                  <div>
                    <strong>Codex Styler</strong>
                    <p>
                      {isChinese
                        ? "接下来把背景、表面和行为组合成可恢复的运行时。"
                        : "Next, compose background, surfaces, and behavior into a reversible runtime."}
                    </p>
                    <div className="workspace-code-lines" aria-hidden="true">
                      <span className="workspace-code-lines__header">
                        <code>theme.json</code>
                        <small>{isChinese ? "语义样式" : "semantic"}</small>
                      </span>
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {scenario !== "settings" && scenario !== "components" && (
            <footer className="workspace-composer">
              <div className="workspace-composer__field" ref={composerRef}>
                <span>
                  {isChinese
                    ? "让 Codex 继续完善这个主题…"
                    : "Ask Codex to refine this theme…"}
                </span>
                <button tabIndex={-1} aria-label={isChinese ? "发送" : "Send"}>
                  <Send size={12} />
                </button>
              </div>
            </footer>
          )}

          {scenario === "right-panel" && (
            <aside className="workspace-right-panel">
              <div className="workspace-right-panel__heading">
                <PanelRight size={12} />
                <strong>{isChinese ? "更改" : "Changes"}</strong>
              </div>
              <div className="workspace-right-panel__tabs">
                <span className="is-active">
                  3 {isChinese ? "文件" : "Files"}
                </span>
                <span>{isChinese ? "摘要" : "Summary"}</span>
              </div>
              {["runtime.js", "theme.json", "README.md"].map((file, index) => (
                <span className="workspace-right-panel__row" key={file}>
                  <i>{file}</i>
                  <small>{index === 1 ? "+8 −2" : "+4"}</small>
                </span>
              ))}
            </aside>
          )}
        </main>

        {scenario === "dialog" && (
          <div className="workspace-dialog-layer">
            <div>
              <Settings size={16} />
              <strong>
                {isChinese ? "确认应用主题" : "Apply this theme?"}
              </strong>
              <p>
                {isChinese
                  ? "当前 Codex 会话将立即更新。"
                  : "The current Codex session will update immediately."}
              </p>
              <span className="workspace-dialog-actions">
                <button tabIndex={-1}>{isChinese ? "取消" : "Cancel"}</button>
                <button tabIndex={-1}>{isChinese ? "应用" : "Apply"}</button>
              </span>
            </div>
          </div>
        )}

        {entity && scenario !== "components" && (
          <div
            ref={entityRef}
            className={
              "scene-entity" + (reduceMotion ? " scene-entity--reduced" : "")
            }
            style={entityStyle}
            aria-label={entity.name}
            data-draggable={Boolean(
              onEntityAnchorChange || onEntityAttachmentChange,
            )}
            data-dragging={dragging}
            data-attached={Boolean(entity.attachment)}
            data-attachment-edge={entity.attachment?.edge}
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
        )}
      </div>
    </div>
  );
}
