import { Check, CircleDot, TerminalSquare } from "lucide-react";

interface TerminalActivityPreviewProps {
  isChinese: boolean;
}

export function TerminalActivityPreview({
  isChinese,
}: TerminalActivityPreviewProps) {
  return (
    <div className="workspace-terminal-activity" aria-hidden="true">
      <header className="workspace-terminal-activity__heading">
        <span>
          <TerminalSquare size={11} />
          <strong>{isChinese ? "主题验证" : "Theme verification"}</strong>
        </span>
        <small>
          <CircleDot size={8} />
          {isChinese ? "已完成" : "Completed"}
        </small>
      </header>

      <div className="workspace-terminal-tabs">
        <span className="is-active">Terminal</span>
        <span>Output</span>
        <em>zsh</em>
      </div>

      <pre className="workspace-terminal-output">
        <code>
          <span data-kind="prompt">$</span> pnpm test
        </code>
        <samp>
          <span>✓</span> desktop&nbsp;&nbsp;182 tests
        </samp>
        <samp>
          <span>✓</span> theme-core&nbsp;&nbsp;21 tests
        </samp>
        <samp>
          <span>✓</span> runtime&nbsp;&nbsp;20 tests
        </samp>
        <code>
          <span data-kind="prompt">$</span> pnpm build
        </code>
        <samp>
          <span>✓</span>{" "}
          {isChinese ? "生产构建完成" : "production build complete"}
        </samp>
      </pre>

      <footer className="workspace-terminal-activity__summary">
        <span>
          <Check size={9} />
          {isChinese ? "所有检查均已通过" : "All checks passed"}
        </span>
        <small>3.2s</small>
      </footer>
    </div>
  );
}
