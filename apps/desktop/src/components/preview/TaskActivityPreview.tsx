import { Check, CircleDot, FileDiff, Terminal, Wrench } from "lucide-react";

interface TaskActivityPreviewProps {
  isChinese: boolean;
}

export function TaskActivityPreview({ isChinese }: TaskActivityPreviewProps) {
  return (
    <div className="workspace-task-activity" aria-hidden="true">
      <article
        className="workspace-task-prompt"
        data-message-author-role="user"
      >
        <span>{isChinese ? "你" : "YOU"}</span>
        <p>
          {isChinese
            ? "统一主题编辑器的视觉语言，并验证真实 Codex 任务状态。"
            : "Unify the theme editor and verify real Codex task states."}
        </p>
      </article>

      <section className="workspace-task-plan" aria-label="Implementation plan">
        <header>
          <span>
            <CircleDot size={10} />
            <strong>{isChinese ? "实施计划" : "Implementation plan"}</strong>
          </span>
          <small>2 / 3</small>
        </header>
        <progress max="3" value="2" />
        <div className="workspace-task-plan__steps">
          <span className="is-complete">
            <Check size={9} />
            {isChinese ? "检查主题结构" : "Inspect theme structure"}
          </span>
          <span className="is-complete">
            <Check size={9} />
            {isChinese ? "映射语义表面" : "Map semantic surfaces"}
          </span>
          <span className="is-active">
            <CircleDot size={9} />
            {isChinese ? "验证应用结果" : "Verify applied result"}
          </span>
        </div>
      </section>

      <details className="workspace-task-tool" open>
        <summary>
          <span>
            <Terminal size={10} />
            <strong>{isChinese ? "运行检查" : "Run checks"}</strong>
          </span>
          <small>{isChinese ? "已完成" : "Completed"}</small>
        </summary>
        <div className="workspace-task-tool__body">
          <code>pnpm --filter @codex-styler/desktop test</code>
          <span>
            <Check size={9} />
            {isChinese ? "182 项测试通过" : "182 tests passed"}
          </span>
        </div>
      </details>

      <div className="workspace-task-changes">
        <span className="workspace-task-changes__icon">
          <FileDiff size={11} />
        </span>
        <span>
          <strong>{isChinese ? "3 个文件已更改" : "3 files changed"}</strong>
          <small>
            {isChinese
              ? "主题运行时与预览已同步"
              : "Runtime and preview are in sync"}
          </small>
        </span>
        <em data-change="added">+24</em>
        <em data-change="deleted">−6</em>
        <Wrench className="workspace-task-changes__mark" size={10} />
      </div>
    </div>
  );
}
