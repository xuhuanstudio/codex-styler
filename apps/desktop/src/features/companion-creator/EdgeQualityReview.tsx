import { ArrowRight, Check, Eye, Eraser } from "lucide-react";
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

export function EdgeQualityReview({
  locale,
  currentBackdrop,
  summary,
  onInspect,
  onConfirm,
  onRepair,
}: {
  locale: "en" | "zh-CN";
  currentBackdrop: "transparent" | EdgeReviewBackdrop;
  summary: EdgeReviewSummary;
  onInspect: (backdrop: EdgeReviewBackdrop) => void;
  onConfirm: (backdrop: EdgeReviewBackdrop) => void;
  onRepair: () => void;
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

  return (
    <section
      id="companion-edge-quality-review"
      className={`edge-quality-review ${summary.complete ? "edge-quality-review--complete" : ""}`}
      tabIndex={-1}
      aria-labelledby="companion-edge-quality-title"
    >
      <div className="edge-quality-review__heading">
        <span className="edge-quality-review__icon" aria-hidden="true">
          {summary.complete ? <Check size={15} /> : <Eye size={15} />}
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
        onClick={onRepair}
      >
        <Eraser size={13} />
        {isChinese ? "返回背景处理修复边缘" : "Repair edges in Clean up"}
      </button>
    </section>
  );
}
