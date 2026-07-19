import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  Eraser,
  LoaderCircle,
  ScanSearch,
} from "lucide-react";
import type { EdgeAnalysisIssueKind, EdgeAnalysisState } from "./edge-analysis";
import type { EdgeReviewBackdrop } from "./model";
import {
  requiredEdgeReviewBackdrops,
  type EdgeReviewSummary,
} from "./quality-review";

const backdropLabels = {
  en: {
    black: "Black",
    white: "White",
    theme: "Theme color",
  },
  "zh-CN": {
    black: "黑色",
    white: "白色",
    theme: "主题色",
  },
} as const;

const issueLabels: Record<
  "en" | "zh-CN",
  Record<EdgeAnalysisIssueKind, string>
> = {
  en: {
    "background-retained": "The source background may still be present",
    "edge-contact": "Visible pixels touch the top or side of the canvas",
    "floating-pixels": "Isolated pixels appear outside the main subject",
    "color-spill": "Edge pixels remain close to the sampled background color",
  },
  "zh-CN": {
    "background-retained": "源背景可能仍然存在",
    "edge-contact": "可见像素触及画布顶部或侧边",
    "floating-pixels": "主体外侧可能存在孤立残点",
    "color-spill": "边缘像素仍接近取样背景色",
  },
};

export function EdgeQualityReview({
  locale,
  currentBackdrop,
  summary,
  analysis,
  onInspect,
  onConfirm,
  onRepair,
}: {
  locale: "en" | "zh-CN";
  currentBackdrop: "transparent" | EdgeReviewBackdrop;
  summary: EdgeReviewSummary;
  analysis: EdgeAnalysisState;
  onInspect: (backdrop: EdgeReviewBackdrop) => void;
  onConfirm: (backdrop: EdgeReviewBackdrop) => void;
  onRepair: (frameIndex?: number) => void;
}) {
  const isChinese = locale === "zh-CN";
  const selectedBackdrop = requiredEdgeReviewBackdrops.includes(
    currentBackdrop as EdgeReviewBackdrop,
  )
    ? (currentBackdrop as EdgeReviewBackdrop)
    : null;
  const selectedReviewed = selectedBackdrop
    ? summary.reviewed.includes(selectedBackdrop)
    : false;
  const automaticIssues =
    analysis.status === "ready" ? analysis.result.issues : [];
  const needsAttention = automaticIssues.length > 0;
  const visuallyComplete =
    summary.complete && analysis.status === "ready" && !needsAttention;

  return (
    <section
      id="companion-edge-quality-review"
      className={`edge-quality-review ${visuallyComplete ? "edge-quality-review--complete" : ""} ${needsAttention ? "edge-quality-review--attention" : ""}`}
      tabIndex={-1}
      aria-labelledby="companion-edge-quality-title"
    >
      <div className="edge-quality-review__heading">
        <span className="edge-quality-review__icon" aria-hidden="true">
          {needsAttention ? (
            <AlertTriangle size={15} />
          ) : summary.complete ? (
            <Check size={15} />
          ) : (
            <Eye size={15} />
          )}
        </span>
        <div>
          <h3 id="companion-edge-quality-title">
            {isChinese ? "边缘质量检查" : "Edge quality review"}
          </h3>
          <p>
            {summary.complete
              ? isChinese
                ? "已在三种代表性表面检查最终像素。"
                : "Final pixels were inspected on three representative surfaces."
              : isChinese
                ? "逐项检查粉边、灰斑、透明断裂和残留背景。"
                : "Check for color spill, halos, broken transparency, and background residue."}
          </p>
        </div>
        <strong>
          {summary.completed}/{summary.total}
        </strong>
      </div>

      <div
        className="edge-quality-review__automatic"
        data-status={analysis.status}
        aria-live="polite"
      >
        <span aria-hidden="true">
          {analysis.status === "running" ? (
            <LoaderCircle className="is-spinning" size={14} />
          ) : needsAttention ? (
            <AlertTriangle size={14} />
          ) : analysis.status === "ready" ? (
            <Check size={14} />
          ) : (
            <ScanSearch size={14} />
          )}
        </span>
        <div>
          <strong>
            {analysis.status === "running"
              ? isChinese
                ? "正在扫描代表帧…"
                : "Scanning representative frames…"
              : analysis.status === "ready"
                ? needsAttention
                  ? isChinese
                    ? `自动预检发现 ${automaticIssues.length} 类风险`
                    : `Automated preflight found ${automaticIssues.length} risk${automaticIssues.length === 1 ? "" : "s"}`
                  : isChinese
                    ? `自动预检未发现明显问题 · ${analysis.result.scannedFrameIndexes.length} 帧`
                    : `No obvious issues in ${analysis.result.scannedFrameIndexes.length} scanned frames`
                : analysis.status === "error"
                  ? isChinese
                    ? "自动预检暂时不可用"
                    : "Automated preflight is unavailable"
                  : isChinese
                    ? "等待自动预检"
                    : "Waiting for automated preflight"}
          </strong>
          <small>
            {isChinese
              ? "程序只提示风险，最终仍由三背景人工检查确认。"
              : "The scan flags risks; the three-background review remains the final check."}
          </small>
        </div>
      </div>

      {automaticIssues.length > 0 ? (
        <div className="edge-quality-review__issues">
          {automaticIssues.map((issue) => {
            const firstFrame = issue.frameIndexes[0];
            const shownFrames = issue.frameIndexes
              .slice(0, 3)
              .map((index) => index + 1)
              .join(", ");
            return (
              <button
                key={issue.kind}
                type="button"
                onClick={() => onRepair(firstFrame)}
              >
                <span>
                  <strong>{issueLabels[locale][issue.kind]}</strong>
                  <small>
                    {isChinese ? "检查帧" : "Review frames"} {shownFrames}
                    {issue.frameIndexes.length > 3 ? "…" : ""}
                  </small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="edge-quality-review__backdrops"
        role="group"
        aria-label={isChinese ? "边缘检查背景" : "Edge review backgrounds"}
      >
        {requiredEdgeReviewBackdrops.map((backdrop) => {
          const reviewed = summary.reviewed.includes(backdrop);
          const active = currentBackdrop === backdrop;
          return (
            <button
              key={backdrop}
              type="button"
              className={active ? "is-active" : undefined}
              aria-pressed={active}
              onClick={() => onInspect(backdrop)}
            >
              <i
                className={`backdrop-swatch backdrop-swatch--${backdrop}`}
                aria-hidden="true"
              />
              <span>{backdropLabels[locale][backdrop]}</span>
              {reviewed ? (
                <Check
                  size={13}
                  aria-label={isChinese ? "已检查" : "Reviewed"}
                />
              ) : (
                <ArrowRight size={13} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {!summary.complete && selectedBackdrop ? (
        <button
          type="button"
          className="button button--primary edge-quality-review__confirm"
          disabled={selectedReviewed}
          onClick={() => onConfirm(selectedBackdrop)}
        >
          <Check size={14} />
          {selectedReviewed
            ? isChinese
              ? "当前背景已检查"
              : "Current background reviewed"
            : isChinese
              ? `确认${backdropLabels[locale][selectedBackdrop]}背景边缘正常`
              : `Confirm edges on ${backdropLabels[locale][selectedBackdrop].toLowerCase()}`}
        </button>
      ) : null}

      <button
        type="button"
        className="edge-quality-review__repair"
        onClick={() => onRepair()}
      >
        <Eraser size={13} />
        {isChinese ? "返回背景处理修复边缘" : "Repair edges in Clean up"}
      </button>
    </section>
  );
}
