import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  Check,
  ChevronDown,
  Command,
  GitBranch,
  MoreHorizontal,
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

interface PreviewWorkspaceProps {
  theme: ThemeDefinition;
  variant: "light" | "dark";
  locale: Locale;
  reduceMotion: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  compact?: boolean;
  scenario?: PreviewScenario;
  onEntityAnchorChange?: (anchor: { x: number; y: number }) => void;
  onEntityAttachmentChange?: (attachment: EntityAttachment | null) => void;
}

export function PreviewWorkspace({
  theme,
  variant,
  locale,
  reduceMotion,
  resolveAsset,
  compact = false,
  scenario = "task",
  onEntityAnchorChange,
  onEntityAttachmentChange,
}: PreviewWorkspaceProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef<HTMLDivElement>(null);
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImageRefs = useRef<HTMLImageElement[]>([]);
  const [direction, setDirection] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [spriteReady, setSpriteReady] = useState(0);
  const interactive = Boolean(onEntityAnchorChange || onEntityAttachmentChange);
  const visual = theme.variants[variant];
  const entity = theme.scene.entities[0];
  const backgroundImage = visual.background.image
    ? resolveAsset(theme, visual.background.image)
    : undefined;
  const backgroundLayer = theme.scene.layers.find(
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
    previewRef.current
      ?.querySelectorAll<HTMLElement>("[data-scene-parallax]")
      .forEach((layer) => layer.style.removeProperty("transform"));
  }, [reduceMotion, visual.motion.intensity, visual.motion.parallax]);

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

  const style = useMemo(
    () =>
      ({
        "--preview-bg": visual.background.color,
        "--preview-image": backgroundImage
          ? "url(" + backgroundImage + ")"
          : "none",
        "--preview-image-x": visual.background.position.x + "%",
        "--preview-image-y": visual.background.position.y + "%",
        "--preview-brightness": visual.background.brightness,
        "--preview-blur": visual.background.blur + "px",
        "--preview-overlay": visual.background.overlay,
        "--preview-overlay-opacity": visual.background.overlayOpacity,
        "--preview-surface": visual.appearance.surface,
        "--preview-surface-opacity": contrastSystem.quietSurfaceOpacity,
        "--preview-surface-strong-opacity": contrastSystem.strongSurfaceOpacity,
        "--preview-text": contrastSystem.textPrimary,
        "--preview-muted": contrastSystem.textSecondary,
        "--preview-border": visual.appearance.border,
        "--preview-accent": visual.appearance.accent,
        "--preview-radius": visual.appearance.radius + "px",
        "--preview-focus-blur": visual.appearance.focusBlur + "px",
      }) as CSSProperties,
    [backgroundImage, contrastSystem, visual],
  );

  function handlePointer(event: MouseEvent<HTMLDivElement>) {
    const previewBounds = previewRef.current?.getBoundingClientRect();
    if (previewBounds && !reduceMotion) {
      const x =
        (event.clientX - previewBounds.left) /
          Math.max(1, previewBounds.width) -
        0.5;
      const y =
        (event.clientY - previewBounds.top) /
          Math.max(1, previewBounds.height) -
        0.5;
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
          layer.style.transform = `translate(${-x * depth}px, ${-y * depth}px) scale(1.015)`;
        });
    }
    if (
      !entity ||
      dragging ||
      reduceMotion ||
      entity.renderer.type !== "sprite-atlas"
    )
      return;
    const bounds = entityRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const anchorX = bounds.left + bounds.width / 2;
    const anchorY = bounds.top + bounds.height / 2;
    setDirection(
      pointerDirectionFrame(
        event.clientX,
        event.clientY,
        anchorX,
        anchorY,
        entity.renderer.directions,
        entity.renderer.frameAngles,
      ),
    );
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
      data-layout={visual.appearance.layout ?? "native"}
      data-icon-style={visual.appearance.iconStyle ?? "native"}
      data-decorations={visual.appearance.decorations ?? "none"}
      data-contrast-tone={contrastSystem.tone}
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
      {theme.scene.layers.map((layer) => {
        if (layer.type === "image" && layer.asset === visual.background.image) {
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
                backgroundImage: layerImage ? `url(${layerImage})` : undefined,
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
                  <span />
                  <span />
                  <span />
                </div>
              </div>
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
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {scenario !== "settings" && (
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
              <div>
                <PanelRight size={12} />
                <strong>{isChinese ? "更改" : "Changes"}</strong>
              </div>
              <span />
              <span />
              <span />
              <span />
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
              <span>
                <i />
                <i />
              </span>
            </div>
          </div>
        )}

        {entity && (
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
