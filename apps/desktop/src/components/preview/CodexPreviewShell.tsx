import type { ReactNode, RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock3,
  Folder,
  GitBranch,
  GitPullRequest,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  UserRound,
} from "lucide-react";
import type { Locale } from "../../lib/i18n";
import type { PreviewScenario } from "../../lib/storage";
import { CodexPreviewScenario } from "./CodexPreviewScenarios";

export const CODEX_PREVIEW_SHELL_VERSION = "2026-07";

interface CodexPreviewShellProps {
  locale: Locale;
  scenario: PreviewScenario;
  mainRef: RefObject<HTMLElement | null>;
  composerRef: RefObject<HTMLDivElement | null>;
  onScenarioChange?: (scenario: PreviewScenario) => void;
  entityOverlay?: ReactNode;
}

const taskScenarios = ["task", "changes", "terminal", "right-panel"] as const;

function scenarioTitle(scenario: PreviewScenario, isChinese: boolean) {
  if (scenario === "home") return isChinese ? "新任务" : "New task";
  if (scenario === "settings") return isChinese ? "设置" : "Settings";
  if (scenario === "components") {
    return isChinese ? "界面状态检查" : "Interface state check";
  }
  if (scenario === "changes") return isChinese ? "审查更改" : "Review changes";
  if (scenario === "terminal") return isChinese ? "终端" : "Terminal";
  return isChinese ? "主题架构与安全模型" : "Theme architecture & safety";
}

export function CodexPreviewShell({
  locale,
  scenario,
  mainRef,
  composerRef,
  onScenarioChange,
  entityOverlay,
}: CodexPreviewShellProps) {
  const isChinese = locale === "zh-CN";
  const showsComposer = scenario !== "settings" && scenario !== "components";
  const showsEditorTabs =
    Boolean(onScenarioChange) &&
    taskScenarios.includes(scenario as (typeof taskScenarios)[number]);

  return (
    <div
      className="workspace-preview__chrome"
      data-codex-preview-shell={CODEX_PREVIEW_SHELL_VERSION}
    >
      <aside className="workspace-sidebar">
        <div className="workspace-traffic" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div className="workspace-sidebar__brand">
          <strong>Codex</strong>
          <ChevronDown size={9} />
        </div>

        <nav className="workspace-sidebar__primary" aria-hidden="true">
          <span className="is-active">
            <SquarePen size={11} />
            {isChinese ? "新任务" : "New task"}
          </span>
          <span>
            <GitPullRequest size={11} />
            {isChinese ? "拉取请求" : "Pull requests"}
          </span>
          <span>
            <Clock3 size={11} />
            {isChinese ? "已安排" : "Scheduled"}
          </span>
        </nav>

        <div className="workspace-section-label">
          {isChinese ? "聊天" : "CHATS"}
        </div>
        <button className="workspace-task workspace-task--active" tabIndex={-1}>
          <span>
            {isChinese ? "主题架构与安全模型" : "Theme architecture & safety"}
          </span>
          <MoreHorizontal size={10} />
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
          <span className="workspace-sidebar__user">
            <UserRound size={9} />
          </span>
          <span>{isChinese ? "本地用户" : "Local user"}</span>
          <Search size={10} />
        </div>
      </aside>

      <main className="workspace-main" ref={mainRef}>
        <header className="workspace-header">
          <div className="workspace-header__navigation" aria-hidden="true">
            <span>
              <PanelLeft size={11} />
            </span>
            <span>
              <ArrowLeft size={11} />
            </span>
            <span>
              <ArrowRight size={11} />
            </span>
          </div>
          <div className="workspace-header__title">
            <Folder size={10} />
            <strong>{scenarioTitle(scenario, isChinese)}</strong>
            {scenario !== "home" && (
              <span className="workspace-branch">
                <GitBranch size={8} />
                main
              </span>
            )}
            <MoreHorizontal size={10} />
          </div>
          <div className="workspace-header__actions" aria-hidden="true">
            <span className="workspace-header-action">
              <Sparkles size={9} />
              {isChinese ? "本地预览" : "Local preview"}
            </span>
            <span>
              <SlidersHorizontal size={11} />
            </span>
            <span>
              <PanelRight size={11} />
            </span>
          </div>
        </header>

        <div
          className={
            "workspace-content-shell" +
            (scenario === "right-panel"
              ? " workspace-content-shell--with-panel"
              : "")
          }
        >
          <div
            className="workspace-primary-surface"
            data-has-context-tabs={showsEditorTabs || undefined}
          >
            {showsEditorTabs && (
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
                  return (
                    <button
                      key={tabScenario}
                      type="button"
                      role="tab"
                      className={
                        activeScenario === tabScenario ? "is-active" : undefined
                      }
                      aria-selected={activeScenario === tabScenario}
                      onClick={() => onScenarioChange?.(tabScenario)}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            )}

            <section
              className="workspace-conversation"
              data-scenario={scenario}
            >
              <CodexPreviewScenario scenario={scenario} isChinese={isChinese} />
            </section>
          </div>

          {scenario === "right-panel" && (
            <aside className="workspace-right-panel">
              <div className="workspace-right-panel__heading">
                <PanelRight size={11} />
                <strong>{isChinese ? "环境信息" : "Environment"}</strong>
              </div>
              <div className="workspace-right-panel__tabs">
                <span className="is-active">
                  {isChinese ? "更改" : "Changes"}
                </span>
                <span>{isChinese ? "检查" : "Checks"}</span>
              </div>
              {[
                ["runtime.js", "+18 −4"],
                ["theme.json", "+8 −2"],
                ["README.md", "+4"],
              ].map(([file, change]) => (
                <span className="workspace-right-panel__row" key={file}>
                  <i>{file}</i>
                  <small>{change}</small>
                </span>
              ))}
            </aside>
          )}
        </div>

        {showsComposer && (
          <footer className="workspace-composer">
            <div className="workspace-composer__field" ref={composerRef}>
              <button
                className="workspace-composer__add"
                tabIndex={-1}
                aria-label="Add"
              >
                <Plus size={10} />
              </button>
              <span>
                {isChinese ? "向 Codex 描述任务…" : "Ask Codex anything…"}
              </span>
              <button tabIndex={-1} aria-label={isChinese ? "发送" : "Send"}>
                <Send size={11} />
              </button>
            </div>
          </footer>
        )}
      </main>

      {scenario === "dialog" && (
        <div className="workspace-dialog-layer">
          <div>
            <Settings size={15} />
            <strong>{isChinese ? "确认应用主题" : "Apply this theme?"}</strong>
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

      {entityOverlay}
    </div>
  );
}
