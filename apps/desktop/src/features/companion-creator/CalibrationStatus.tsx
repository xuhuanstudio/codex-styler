import { AlertTriangle, Check, ScanLine } from "lucide-react";
import type { CSSProperties } from "react";
import type { DirectionCalibration } from "./calibration";
import type { CompanionCreatorProject } from "./model";

export function CalibrationHealth({
  calibration,
  project,
  locale,
}: {
  calibration: DirectionCalibration;
  project: CompanionCreatorProject;
  locale: "en" | "zh-CN";
}) {
  const activeDeltas = project.frames
    .filter((frame) => !frame.excluded)
    .map((frame) => frame.visualDelta)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const median = activeDeltas[Math.floor(activeDeltas.length / 2)] ?? 0;
  const jumpCount = project.frames.filter(
    (frame) => !frame.excluded && median > 0 && frame.visualDelta > median * 4,
  ).length;
  const warningCopy = (warning: DirectionCalibration["warnings"][number]) => {
    if (locale === "en") {
      return {
        "not-enough-anchors": `Add ${Math.max(0, 4 - calibration.validAnchorCount)} more distinct anchor${4 - calibration.validAnchorCount === 1 ? "" : "s"}.`,
        "duplicate-directions":
          "Four anchors must point to four distinct directions.",
        "reverse-segment": calibration.reverseSegments.length
          ? `Direction turns backward between frames ${calibration.reverseSegments.map((range) => `${range.startFrame + 1}–${range.endFrame + 1}`).join(", ")}.`
          : "A direction range turns backward.",
        "missing-leading-range": `Anchor the first included frame${calibration.firstActiveFrame === null ? "" : ` (${calibration.firstActiveFrame + 1})`}.`,
        "missing-trailing-range": `Anchor the last included frame${calibration.lastActiveFrame === null ? "" : ` (${calibration.lastActiveFrame + 1})`}.`,
      }[warning];
    }
    return {
      "not-enough-anchors": `还需设置 ${Math.max(0, 4 - calibration.validAnchorCount)} 个不同方向的锚点。`,
      "duplicate-directions": "至少四个锚点必须对应四个不同方向。",
      "reverse-segment": calibration.reverseSegments.length
        ? `第 ${calibration.reverseSegments.map((range) => `${range.startFrame + 1}–${range.endFrame + 1}`).join("、")} 帧之间方向发生回退。`
        : "存在方向回退区间。",
      "missing-leading-range": `请为第一张有效帧${calibration.firstActiveFrame === null ? "" : `（第 ${calibration.firstActiveFrame + 1} 帧）`}设置锚点。`,
      "missing-trailing-range": `请为最后一张有效帧${calibration.lastActiveFrame === null ? "" : `（第 ${calibration.lastActiveFrame + 1} 帧）`}设置锚点。`,
    }[warning];
  };
  return (
    <div
      className="calibration-health"
      data-ready={calibration.ready}
      aria-live="polite"
    >
      <div className="calibration-health__heading">
        <span>
          {calibration.ready ? (
            <Check size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          <strong>
            {calibration.ready
              ? locale === "zh-CN"
                ? "方向校准已就绪"
                : "Direction calibration ready"
              : locale === "zh-CN"
                ? "完成下列必要修正后才能继续"
                : "Resolve the required items before continuing"}
          </strong>
        </span>
        <small>
          {jumpCount === 0
            ? locale === "zh-CN"
              ? "画面连续性正常"
              : "Visual continuity looks stable"
            : locale === "zh-CN"
              ? `${jumpCount} 处画面变化较大，建议逐帧检查`
              : `${jumpCount} large visual changes need review`}
        </small>
      </div>
      <div className="calibration-health__metrics">
        <span>
          <small>
            {locale === "zh-CN" ? "方向锚点 · 至少 4" : "Anchors · min 4"}
          </small>
          <strong>{calibration.validAnchorCount}</strong>
        </span>
        <span>
          <small>{locale === "zh-CN" ? "帧覆盖" : "Frame coverage"}</small>
          <strong>{Math.round(calibration.coverageRatio * 100)}%</strong>
        </span>
        <span>
          <small>{locale === "zh-CN" ? "最大方向间隔" : "Largest gap"}</small>
          <strong>
            {calibration.maximumDirectionGap === null
              ? "—"
              : `${Math.round(calibration.maximumDirectionGap)}°`}
          </strong>
        </span>
        <span>
          <small>{locale === "zh-CN" ? "首尾帧间隔" : "Frame seam"}</small>
          <strong>
            {calibration.seamGap === null
              ? "—"
              : `${Math.round(calibration.seamGap)}°`}
          </strong>
        </span>
      </div>
      {!calibration.ready && (
        <ul className="calibration-health__issues">
          {calibration.warnings.map((warning) => (
            <li key={warning}>
              <AlertTriangle size={13} />
              <span>{warningCopy(warning)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalibrationSummary({
  calibration,
  locale,
}: {
  calibration: DirectionCalibration;
  locale: "en" | "zh-CN";
}) {
  return (
    <div
      className="calibration-summary"
      data-ready={calibration.ready}
      aria-label={
        locale === "zh-CN" ? "方向校准进度" : "Direction calibration progress"
      }
    >
      <div>
        <span>
          {calibration.ready ? <Check size={14} /> : <ScanLine size={14} />}
          {calibration.ready
            ? locale === "zh-CN"
              ? "可以继续"
              : "Ready to continue"
            : locale === "zh-CN"
              ? "正在建立方向映射"
              : "Building direction map"}
        </span>
        <strong>{Math.round(calibration.coverageRatio * 100)}%</strong>
      </div>
      <i
        aria-hidden="true"
        style={
          {
            "--progress": `${calibration.coverageRatio * 100}%`,
          } as CSSProperties
        }
      />
      <p>
        {locale === "zh-CN"
          ? `${calibration.validAnchorCount} 个锚点 · ${calibration.mappedFrameCount}/${calibration.activeFrameCount} 帧已映射`
          : `${calibration.validAnchorCount} anchors · ${calibration.mappedFrameCount}/${calibration.activeFrameCount} frames mapped`}
      </p>
    </div>
  );
}
