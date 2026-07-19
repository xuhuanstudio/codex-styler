import { Check, FileCode2, FileDiff, GitCompareArrows } from "lucide-react";

interface ChangeReviewPreviewProps {
  isChinese: boolean;
}

export function ChangeReviewPreview({ isChinese }: ChangeReviewPreviewProps) {
  return (
    <div className="workspace-change-review" aria-hidden="true">
      <header className="workspace-change-review__heading">
        <span>
          <GitCompareArrows size={11} />
          <strong>{isChinese ? "工作区更改" : "Working tree"}</strong>
        </span>
        <small>3 {isChinese ? "个文件" : "files"}</small>
      </header>

      <div className="workspace-change-review__body">
        <nav className="workspace-change-files">
          <span className="is-active">
            <FileCode2 size={9} />
            <i>runtime.js</i>
            <small>+18 −4</small>
          </span>
          <span>
            <FileCode2 size={9} />
            <i>theme.json</i>
            <small>+8 −2</small>
          </span>
          <span>
            <FileCode2 size={9} />
            <i>README.md</i>
            <small>+4</small>
          </span>
        </nav>

        <section className="workspace-change-diff">
          <header>
            <span>
              <FileDiff size={9} />
              runtime.js
            </span>
            <small>@@ -1668,6 +1668,12 @@</small>
          </header>
          <code data-change="context">1668&nbsp;&nbsp;semantic runtime</code>
          <code data-change="deleted">−&nbsp;&nbsp;border-left: accent</code>
          <code data-change="added">+&nbsp;&nbsp;surface: control-active</code>
          <code data-change="added">+&nbsp;&nbsp;shadow: contextual-depth</code>
          <code data-change="context">1673&nbsp;&nbsp;restore official</code>
        </section>
      </div>

      <footer className="workspace-change-review__summary">
        <span>
          <Check size={9} />
          {isChinese ? "可安全恢复" : "Safe to restore"}
        </span>
        <span>
          <em data-change="added">+30</em>
          <em data-change="deleted">−6</em>
        </span>
      </footer>
    </div>
  );
}
