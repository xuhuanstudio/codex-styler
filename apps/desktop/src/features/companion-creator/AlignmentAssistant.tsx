import {
  AlertTriangle,
  Check,
  ChevronDown,
  Crop,
  Eye,
  ScanLine,
  Sparkles,
} from "lucide-react";
import type { AlignmentDiagnostics } from "./calibration";

export type AlignmentResolutionKind =
  "ready" | "cleanup" | "align" | "fit" | "expand" | "inspect";

export function recommendAlignmentResolution({
  diagnostics,
  currentScale,
  fittedScale,
  canExpand,
}: {
  diagnostics: AlignmentDiagnostics;
  currentScale: number;
  fittedScale: number | null;
  canExpand: boolean;
}): AlignmentResolutionKind {
  if (diagnostics.missingBounds > 0) return "cleanup";
  if (diagnostics.baselineOutliers > 0 || diagnostics.centerOutliers > 0) {
    return "align";
  }
  if (diagnostics.outsideCrop > 0) {
    const canFit = fittedScale !== null && fittedScale < currentScale - 0.001;
    const wouldShrinkHeavily =
      canFit &&
      (fittedScale < 0.65 ||
        fittedScale / Math.max(currentScale, 0.001) < 0.75);
    if (canExpand && wouldShrinkHeavily) return "expand";
    if (canFit) return "fit";
    if (canExpand) return "expand";
    return "inspect";
  }
  if (diagnostics.ready) return "ready";
  return "align";
}

type ResolutionAction = Exclude<AlignmentResolutionKind, "ready">;

export function AlignmentAssistant({
  locale,
  diagnostics,
  currentScale,
  fittedScale,
  canExpand,
  onFit,
  onExpand,
  onInspect,
  onAutoAlign,
  onReturnCleanup,
}: {
  locale: "en" | "zh-CN";
  diagnostics: AlignmentDiagnostics;
  currentScale: number;
  fittedScale: number | null;
  canExpand: boolean;
  onFit: () => void;
  onExpand: () => void;
  onInspect: () => void;
  onAutoAlign: () => void;
  onReturnCleanup: () => void;
}) {
  const isChinese = locale === "zh-CN";
  const recommendation = recommendAlignmentResolution({
    diagnostics,
    currentScale,
    fittedScale,
    canExpand,
  });
  const canFit = fittedScale !== null && fittedScale < currentScale - 0.001;

  const actions: Record<
    ResolutionAction,
    {
      label: string;
      title: string;
      description: string;
      icon: typeof ScanLine;
      disabled?: boolean;
      run: () => void;
    }
  > = {
    cleanup: {
      label: isChinese ? "返回背景处理" : "Review background",
      title: isChinese
        ? "先修复未识别的主体"
        : "Repair undetected subjects first",
      description: isChinese
        ? `${diagnostics.missingBounds} 帧没有可用主体边界。返回背景处理检查透明通道、擦除结果或排除异常帧；已有对齐数据会保留。`
        : `${diagnostics.missingBounds} frame(s) have no usable subject bounds. Review transparency, cleanup masks, or exclude bad frames; existing alignment stays intact.`,
      icon: AlertTriangle,
      run: onReturnCleanup,
    },
    align: {
      label: isChinese ? "自动对齐全部有效帧" : "Auto-align included frames",
      title: isChinese
        ? "先统一中心与落点"
        : "Unify centers and contact points first",
      description: isChinese
        ? "按共同地面线重新计算全部有效帧的位置，再用叠影检查少量细微偏差。此操作不会逐帧缩放素材。"
        : "Recalculate every included frame against one center and ground line, then inspect small residual drift with onion skin. Frames are never scaled independently.",
      icon: Sparkles,
      run: onAutoAlign,
    },
    fit: {
      label: isChinese ? "统一缩放以适合画布" : "Fit all frames to canvas",
      title: isChinese
        ? "使用一个比例容纳全部帧"
        : "Use one scale for every frame",
      description: isChinese
        ? `把全局尺寸调整为约 ${Math.round((fittedScale ?? currentScale) * 100)}%，所有帧等比变化，源文件和帧间比例不会被改写。`
        : `Set the global size to about ${Math.round((fittedScale ?? currentScale) * 100)}%. Every frame scales uniformly while source files and frame-to-frame proportions remain untouched.`,
      icon: ScanLine,
      disabled: !canFit,
      run: onFit,
    },
    expand: {
      label: isChinese ? "扩大共享画布" : "Expand shared canvas",
      title: isChinese ? "保留主体像素尺寸" : "Preserve subject pixel size",
      description: isChinese
        ? "扩大透明画布来容纳边缘帧，避免为了少数大帧过度缩小整组素材；最终伙伴可能会留下更多透明边距。"
        : "Add transparent canvas space for edge frames instead of shrinking the whole set for a few large poses. The final companion may retain more transparent margin.",
      icon: Crop,
      disabled: !canExpand,
      run: onExpand,
    },
    inspect: {
      label: isChinese ? "检查第一个异常帧" : "Inspect first outlier",
      title: isChinese ? "需要手动检查异常帧" : "Inspect the outlier manually",
      description: isChinese
        ? "自动修复无法安全判断。打开第一个异常帧并启用叠影，以确认是主体边界、位置偏移还是源素材问题。"
        : "An automatic repair would be ambiguous. Open the first outlier with onion skin to determine whether its bounds, offset, or source pixels need correction.",
      icon: Eye,
      disabled: diagnostics.ready,
      run: onInspect,
    },
  };

  const recommendedAction =
    recommendation === "ready" ? null : actions[recommendation];
  const secondaryKinds = (
    ["align", "fit", "expand", "inspect"] as ResolutionAction[]
  ).filter((kind) => kind !== recommendation);

  return (
    <section
      className={`alignment-readiness ${
        diagnostics.ready
          ? "alignment-readiness--ready"
          : "alignment-readiness--warning"
      }`}
    >
      <div className="alignment-readiness__heading">
        <span>
          {diagnostics.ready ? (
            <Check size={15} />
          ) : (
            <AlertTriangle size={15} />
          )}
        </span>
        <div>
          <h3>
            {diagnostics.ready
              ? isChinese
                ? "共享画布已就绪"
                : "Shared canvas ready"
              : isChinese
                ? "对齐助手发现需要处理的内容"
                : "Alignment assistant found an issue"}
          </h3>
          <p>
            {diagnostics.ready
              ? isChinese
                ? "所有有效帧都位于共享画布内，并使用同一中心、落点和缩放比例。"
                : "Every included frame fits one shared canvas, center, ground line, and scale."
              : isChinese
                ? "先执行下面的推荐操作，再使用叠影确认连续帧没有跳动。"
                : "Start with the recommended repair, then use onion skin to confirm the sequence stays stable."}
          </p>
        </div>
      </div>

      <div
        className="alignment-metrics"
        aria-label={isChinese ? "对齐诊断" : "Alignment diagnostics"}
      >
        <div>
          <strong>
            {diagnostics.boundedFrames}/{diagnostics.includedFrames}
          </strong>
          <span>{isChinese ? "已识别" : "Detected"}</span>
        </div>
        <div className={diagnostics.outsideCrop ? "has-warning" : ""}>
          <strong>{diagnostics.outsideCrop}</strong>
          <span>{isChinese ? "超出画布" : "Outside"}</span>
        </div>
        <div
          className={
            diagnostics.baselineOutliers || diagnostics.centerOutliers
              ? "has-warning"
              : ""
          }
        >
          <strong>
            {Math.round(
              Math.max(
                diagnostics.maximumBaselineDelta,
                diagnostics.maximumCenterDelta,
              ),
            )}{" "}
            px
          </strong>
          <span>{isChinese ? "最大对齐偏差" : "Max alignment drift"}</span>
        </div>
      </div>

      {recommendedAction ? (
        <div className="alignment-recommendation">
          <div className="alignment-recommendation__copy">
            <span>{isChinese ? "推荐下一步" : "Recommended next step"}</span>
            <strong>{recommendedAction.title}</strong>
            <p>{recommendedAction.description}</p>
          </div>
          <button
            type="button"
            className="button button--primary"
            disabled={recommendedAction.disabled}
            onClick={recommendedAction.run}
          >
            <recommendedAction.icon size={15} />
            {recommendedAction.label}
          </button>
        </div>
      ) : (
        <div className="alignment-recommendation alignment-recommendation--ready">
          <Check size={16} />
          <div>
            <strong>
              {isChinese ? "无需自动修复" : "No automatic repair needed"}
            </strong>
            <p>
              {isChinese
                ? "可以继续方向校准；如需重新计算，可在下方工具中手动执行。"
                : "Continue to direction calibration, or manually recalculate from the tools below."}
            </p>
          </div>
        </div>
      )}

      <details className="alignment-secondary-tools">
        <summary>
          <span>{isChinese ? "其他对齐工具" : "Other alignment tools"}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="alignment-secondary-tools__actions">
          {secondaryKinds.map((kind) => {
            const action = actions[kind];
            const ActionIcon = action.icon;
            return (
              <button
                key={kind}
                type="button"
                className="button button--ghost"
                disabled={action.disabled}
                onClick={action.run}
                title={action.disabled ? action.description : undefined}
              >
                <ActionIcon size={14} />
                {action.label}
              </button>
            );
          })}
        </div>
      </details>
    </section>
  );
}
