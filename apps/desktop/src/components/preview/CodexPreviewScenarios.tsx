import {
  AlertTriangle,
  Check,
  CircleX,
  FileDiff,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { PreviewScenario } from "../../lib/storage";
import { ChangeReviewPreview } from "./ChangeReviewPreview";
import { TaskActivityPreview } from "./TaskActivityPreview";
import { TerminalActivityPreview } from "./TerminalActivityPreview";

export function CodexPreviewScenario({
  scenario,
  isChinese,
}: {
  scenario: PreviewScenario;
  isChinese: boolean;
}) {
  if (scenario === "home") {
    return (
      <div className="workspace-home-state">
        <Sparkles size={17} />
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
    );
  }

  if (scenario === "settings") {
    return (
      <div className="workspace-settings-state">
        <nav>
          <span className="is-active">
            <Settings size={10} />
            {isChinese ? "通用" : "General"}
          </span>
          <span>
            <SlidersHorizontal size={10} />
            {isChinese ? "外观" : "Appearance"}
          </span>
          <span>
            <Sparkles size={10} />
            {isChinese ? "个性化" : "Personalization"}
          </span>
        </nav>
        <div>
          <strong>{isChinese ? "应用设置" : "Application settings"}</strong>
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
              <small>{isChinese ? "关闭位移动画" : "Limit movement"}</small>
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
    );
  }

  if (scenario === "components") {
    return <ComponentTestBench isChinese={isChinese} />;
  }
  if (scenario === "changes")
    return <ChangeReviewPreview isChinese={isChinese} />;
  if (scenario === "terminal")
    return <TerminalActivityPreview isChinese={isChinese} />;
  return <TaskActivityPreview isChinese={isChinese} />;
}

function ComponentTestBench({ isChinese }: { isChinese: boolean }) {
  return (
    <div className="workspace-components-state">
      <div className="workspace-components-state__heading">
        <span>
          <strong>
            {isChinese ? "界面状态检查" : "Interface state check"}
          </strong>
          <small>
            {isChinese
              ? "主题编辑器专用测试台，不代表 Codex 页面。"
              : "An editor test bench, not a Codex page."}
          </small>
        </span>
        <em>{isChinese ? "测试台" : "TEST BENCH"}</em>
      </div>
      <div className="workspace-component-grid">
        <section className="workspace-component-card">
          <strong>{isChinese ? "操作与输入" : "Actions & input"}</strong>
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
            <Search size={9} />
            <span>{isChinese ? "搜索更改…" : "Search changes…"}</span>
            <i className="workspace-component-caret" aria-hidden="true" />
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
            <Check size={9} />
            <span>{isChinese ? "主题已应用" : "Theme applied"}</span>
          </div>
          <div className="workspace-component-status is-warning">
            <AlertTriangle size={9} />
            <span>{isChinese ? "需要检查" : "Review needed"}</span>
          </div>
          <div className="workspace-component-status is-danger">
            <CircleX size={9} />
            <span>{isChinese ? "连接失败" : "Connection failed"}</span>
          </div>
        </section>
        <section className="workspace-component-card workspace-component-depth">
          <div className="workspace-component-depth__heading">
            <strong>{isChinese ? "表面层级" : "Surface hierarchy"}</strong>
            <small>{isChinese ? "自动协调" : "Auto coordinated"}</small>
          </div>
          <div className="workspace-component-depth__stack">
            <span data-surface="canvas">{isChinese ? "画布" : "Canvas"}</span>
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
              <FileDiff size={10} />
              <strong>{isChinese ? "更改预览" : "Change preview"}</strong>
            </span>
            <small>theme.json</small>
          </div>
          <code data-change="added">
            + &quot;surface&quot;: &quot;adaptive&quot;
          </code>
          <code data-change="modified">~ &quot;radius&quot;: 14</code>
          <code data-change="deleted">− &quot;legacyColor&quot;: true</code>
        </section>
      </div>
    </div>
  );
}
