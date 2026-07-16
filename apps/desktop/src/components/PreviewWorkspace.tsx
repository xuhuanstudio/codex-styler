import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  Check,
  ChevronDown,
  Command,
  GitBranch,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import {
  pointerDirectionFrame,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import type { Locale } from "../lib/i18n";

interface PreviewWorkspaceProps {
  theme: ThemeDefinition;
  variant: "light" | "dark";
  locale: Locale;
  reduceMotion: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  compact?: boolean;
}

export function PreviewWorkspace({
  theme,
  variant,
  locale,
  reduceMotion,
  resolveAsset,
  compact = false,
}: PreviewWorkspaceProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  const visual = theme.variants[variant];
  const entity = theme.scene.entities[0];
  const backgroundImage = visual.background.image
    ? resolveAsset(theme, visual.background.image)
    : undefined;
  const entityImage = entity
    ? resolveAsset(theme, entity.renderer.asset)
    : undefined;

  const style = useMemo(
    () =>
      ({
        "--preview-bg": visual.background.color,
        "--preview-image": backgroundImage ? "url(" + backgroundImage + ")" : "none",
        "--preview-image-x": visual.background.position.x + "%",
        "--preview-image-y": visual.background.position.y + "%",
        "--preview-brightness": visual.background.brightness,
        "--preview-blur": visual.background.blur + "px",
        "--preview-overlay": visual.background.overlay,
        "--preview-overlay-opacity": visual.background.overlayOpacity,
        "--preview-surface": visual.appearance.surface,
        "--preview-surface-opacity": visual.appearance.surfaceOpacity,
        "--preview-text": visual.appearance.text,
        "--preview-muted": visual.appearance.mutedText,
        "--preview-border": visual.appearance.border,
        "--preview-accent": visual.appearance.accent,
        "--preview-radius": visual.appearance.radius + "px",
      }) as CSSProperties,
    [backgroundImage, visual],
  );

  function handlePointer(event: MouseEvent<HTMLDivElement>) {
    if (!entity || reduceMotion || entity.renderer.type !== "sprite-atlas") return;
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const anchorX = bounds.left + (bounds.width * entity.anchor.x) / 100;
    const anchorY = bounds.top + (bounds.height * entity.anchor.y) / 100;
    setDirection(
      pointerDirectionFrame(
        event.clientX,
        event.clientY,
        anchorX,
        anchorY,
        entity.renderer.directions,
      ),
    );
  }

  const isChinese = locale === "zh-CN";
  const frameX = direction % 8;
  const frameY = Math.floor(direction / 8);
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
        "--entity-frame-x": frameX,
        "--entity-frame-y": frameY,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={previewRef}
      className={"workspace-preview" + (compact ? " workspace-preview--compact" : "")}
      style={style}
      onMouseMove={handlePointer}
      data-theme-variant={variant}
    >
      <div className="workspace-preview__backdrop" />
      <div className="workspace-preview__overlay" />
      <div className="workspace-preview__chrome">
        <aside className="workspace-sidebar">
          <div className="workspace-traffic" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <button className="workspace-switcher">
            <span className="workspace-mini-mark">
              <Command size={11} />
            </span>
            <span>{isChinese ? "我的工作区" : "My workspace"}</span>
            <ChevronDown size={11} />
          </button>
          <button className="workspace-new-task">
            <Plus size={12} />
            <span>{isChinese ? "新任务" : "New task"}</span>
          </button>
          <div className="workspace-section-label">
            {isChinese ? "最近" : "RECENT"}
          </div>
          <button className="workspace-task workspace-task--active">
            <span>{isChinese ? "主题架构与安全模型" : "Theme architecture & safety"}</span>
            <MoreHorizontal size={11} />
          </button>
          <button className="workspace-task">
            <span>{isChinese ? "文档站元数据" : "Documentation metadata"}</span>
          </button>
          <button className="workspace-task">
            <span>{isChinese ? "互动场景渲染器" : "Interactive scene renderer"}</span>
          </button>
          <div className="workspace-sidebar__footer">
            <Search size={12} />
            <span>{isChinese ? "搜索" : "Search"}</span>
          </div>
        </aside>

        <main className="workspace-main">
          <header className="workspace-header">
            <div>
              <strong>{isChinese ? "主题架构与安全模型" : "Theme architecture & safety"}</strong>
              <span className="workspace-branch">
                <GitBranch size={10} />
                main
              </span>
            </div>
            <button className="workspace-header-action">
              <Sparkles size={12} />
              {isChinese ? "本地预览" : "Local preview"}
            </button>
          </header>

          <section className="workspace-conversation">
            <div className="workspace-note">
              <div className="workspace-note__icon">
                <Check size={12} />
              </div>
              <div>
                <strong>{isChinese ? "方案已建立" : "Foundation is in place"}</strong>
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
          </section>

          <footer className="workspace-composer">
            <div className="workspace-composer__field">
              <span>
                {isChinese
                  ? "让 Codex 继续完善这个主题…"
                  : "Ask Codex to refine this theme…"}
              </span>
              <button>
                <Send size={12} />
              </button>
            </div>
          </footer>
        </main>

        {entity && (
          <div
            className={
              "scene-entity" + (reduceMotion ? " scene-entity--reduced" : "")
            }
            style={entityStyle}
            aria-label={entity.name}
          >
            <div className="scene-entity__sprite" />
            <div className="scene-entity__fallback">
              <span className="scene-gecko__tail" />
              <span className="scene-gecko__body">
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
