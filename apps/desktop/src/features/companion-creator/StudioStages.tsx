import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import {
  calibrateDirections,
  normalizeAngle,
  sharedTransformPivot,
} from "./calibration";
import type { ExtractedFrame } from "./media";
import type {
  CompanionCreatorProject,
  FrameBounds,
  LogicalFrame,
} from "./model";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function FrameStage({
  frame,
  project,
  currentFrame,
  overlay = false,
}: {
  frame?: ExtractedFrame;
  project: CompanionCreatorProject;
  currentFrame: number;
  overlay?: boolean;
}) {
  const logicalFrame = project.frames[currentFrame];
  const crop = project.sharedCrop;
  const pivot = crop
    ? sharedTransformPivot(crop, project.groundLine)
    : undefined;
  return (
    <div className="alignment-stage">
      {frame && crop && logicalFrame && pivot ? (
        <svg
          className="alignment-stage__compiled-preview"
          viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <g
            transform={`translate(${pivot.x} ${pivot.y}) scale(${project.contentScale}) translate(${-pivot.x} ${-pivot.y})`}
          >
            <image
              href={frame.url}
              x={logicalFrame.baselineOffset.x}
              y={logicalFrame.baselineOffset.y}
              width={frame.width}
              height={frame.height}
            />
          </g>
          {overlay && project.groundLine !== null && (
            <line
              className="alignment-ground-line"
              x1={crop.x}
              x2={crop.x + crop.width}
              y1={project.groundLine}
              y2={project.groundLine}
            />
          )}
        </svg>
      ) : (
        frame && <img src={frame.url} alt="" />
      )}
      <span className="stage-index">{currentFrame + 1}</span>
    </div>
  );
}

export function InteractiveAlignmentStage({
  frame,
  logicalFrame,
  comparisonFrames,
  canvas,
  crop,
  groundLine,
  contentScale,
  currentFrame,
  tool,
  view,
  locale,
  onCropChange,
  onGroundLineChange,
  onFrameOffsetChange,
}: {
  frame?: ExtractedFrame;
  logicalFrame?: LogicalFrame;
  comparisonFrames: Array<{
    logical: LogicalFrame;
    index: number;
    frame: ExtractedFrame;
  }>;
  canvas?: { width: number; height: number };
  crop: FrameBounds | null;
  groundLine: number | null;
  contentScale: number;
  currentFrame: number;
  tool: "canvas" | "frame";
  view: "current" | "overlay";
  locale: "en" | "zh-CN";
  onCropChange: (crop: FrameBounds) => void;
  onGroundLineChange: (groundLine: number) => void;
  onFrameOffsetChange: (offset: { x: number; y: number }) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<
    | {
        pointerId: number;
        mode: "move" | "ground" | "frame" | "nw" | "ne" | "sw" | "se";
        start: { x: number; y: number };
        crop: FrameBounds;
        groundLine: number;
        offset: { x: number; y: number };
      }
    | undefined
  >(undefined);
  const pointForEvent = (event: PointerEvent<SVGElement>) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    return { x: point.x, y: point.y };
  };
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const begin = (
    event: PointerEvent<SVGElement>,
    mode: "move" | "ground" | "frame" | "nw" | "ne" | "sw" | "se",
  ) => {
    if (!frame || !crop) return;
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      mode,
      start: pointForEvent(event),
      crop: { ...crop },
      groundLine: groundLine ?? crop.y + crop.height,
      offset: { ...(logicalFrame?.baselineOffset ?? { x: 0, y: 0 }) },
    };
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || !frame || drag.pointerId !== event.pointerId) return;
    const point = pointForEvent(event);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    const canvasWidth = canvas?.width ?? frame.width;
    const canvasHeight = canvas?.height ?? frame.height;
    if (drag.mode === "ground") {
      onGroundLineChange(clamp(drag.groundLine + dy, 0, canvasHeight));
      return;
    }
    if (drag.mode === "frame") {
      onFrameOffsetChange({
        x: clamp(
          drag.offset.x + dx / Math.max(contentScale, 0.01),
          -frame.width,
          frame.width,
        ),
        y: clamp(
          drag.offset.y + dy / Math.max(contentScale, 0.01),
          -frame.height,
          frame.height,
        ),
      });
      return;
    }
    const minimum = Math.max(12, Math.min(canvasWidth, canvasHeight) * 0.025);
    let next = { ...drag.crop };
    if (drag.mode === "move") {
      next.x = clamp(drag.crop.x + dx, 0, canvasWidth - drag.crop.width);
      next.y = clamp(drag.crop.y + dy, 0, canvasHeight - drag.crop.height);
    } else {
      if (drag.mode.includes("w")) {
        const right = drag.crop.x + drag.crop.width;
        next.x = clamp(drag.crop.x + dx, 0, right - minimum);
        next.width = right - next.x;
      }
      if (drag.mode.includes("e")) {
        next.width = clamp(
          drag.crop.width + dx,
          minimum,
          canvasWidth - drag.crop.x,
        );
      }
      if (drag.mode.includes("n")) {
        const bottom = drag.crop.y + drag.crop.height;
        next.y = clamp(drag.crop.y + dy, 0, bottom - minimum);
        next.height = bottom - next.y;
      }
      if (drag.mode.includes("s")) {
        next.height = clamp(
          drag.crop.height + dy,
          minimum,
          canvasHeight - drag.crop.y,
        );
      }
    }
    onCropChange(next);
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  if (!frame || !crop) {
    return <div className="alignment-stage alignment-stage--interactive" />;
  }
  const handle = Math.max(10, Math.min(frame.width, frame.height) * 0.018);
  const handles = [
    ["nw", crop.x, crop.y],
    ["ne", crop.x + crop.width, crop.y],
    ["sw", crop.x, crop.y + crop.height],
    ["se", crop.x + crop.width, crop.y + crop.height],
  ] as const;
  const currentOffset = logicalFrame?.baselineOffset ?? { x: 0, y: 0 };
  const currentBounds = logicalFrame?.subjectBounds;
  const pivot = sharedTransformPivot(crop, groundLine);
  const artworkTransform = `translate(${pivot.x} ${pivot.y}) scale(${contentScale}) translate(${-pivot.x} ${-pivot.y})`;
  return (
    <div
      className={`alignment-stage alignment-stage--interactive alignment-stage--${tool}`}
      data-view={view}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label={
          locale === "zh-CN"
            ? "可交互的共享裁剪、当前帧偏移和地面线"
            : "Interactive shared crop, frame offset, and ground line"
        }
      >
        <g transform={artworkTransform}>
          {view === "overlay" &&
            comparisonFrames
              .filter((item) => item.index !== currentFrame)
              .map((item) => (
                <image
                  key={item.logical.id}
                  className="alignment-onion-frame"
                  href={item.frame.url}
                  x={item.logical.baselineOffset.x}
                  y={item.logical.baselineOffset.y}
                  width={item.frame.width}
                  height={item.frame.height}
                />
              ))}
          <image
            className="alignment-current-frame"
            href={frame.url}
            x={currentOffset.x}
            y={currentOffset.y}
            width={frame.width}
            height={frame.height}
          />
          {currentBounds && (
            <rect
              className="alignment-subject-outline"
              x={currentBounds.x + currentOffset.x}
              y={currentBounds.y + currentOffset.y}
              width={currentBounds.width}
              height={currentBounds.height}
            />
          )}
        </g>
        {tool === "frame" && (
          <rect
            className="alignment-frame-hit"
            x={0}
            y={0}
            width={frame.width}
            height={frame.height}
            onPointerDown={(event) => begin(event, "frame")}
          />
        )}
        {tool === "canvas" && (
          <rect
            className="alignment-crop-hit"
            x={crop.x}
            y={crop.y}
            width={crop.width}
            height={crop.height}
            onPointerDown={(event) => begin(event, "move")}
          />
        )}
        <rect
          className="alignment-crop-outline"
          x={crop.x}
          y={crop.y}
          width={crop.width}
          height={crop.height}
        />
        {tool === "canvas" &&
          handles.map(([mode, x, y]) => (
            <rect
              key={mode}
              className={`alignment-crop-handle alignment-crop-handle--${mode}`}
              x={x - handle / 2}
              y={y - handle / 2}
              width={handle}
              height={handle}
              rx={handle * 0.18}
              onPointerDown={(event) => begin(event, mode)}
            />
          ))}
        {tool === "canvas" && (
          <line
            className="alignment-ground-hit"
            x1={0}
            x2={frame.width}
            y1={groundLine ?? 0}
            y2={groundLine ?? 0}
            onPointerDown={(event) => begin(event, "ground")}
          />
        )}
        <line
          className="alignment-ground-line"
          x1={0}
          x2={frame.width}
          y1={groundLine ?? 0}
          y2={groundLine ?? 0}
        />
      </svg>
      <span className="alignment-stage__legend">
        <i />
        {tool === "canvas"
          ? locale === "zh-CN"
            ? "共享画布"
            : "Shared canvas"
          : locale === "zh-CN"
            ? "当前帧偏移"
            : "Frame offset"}
      </span>
      <span className="stage-index">{currentFrame + 1}</span>
    </div>
  );
}

export function DirectionTimeline({
  project,
  frames,
  currentFrame,
  locale,
  onSelect,
  draftMotionRange,
  motionPreviewing = false,
}: {
  project: CompanionCreatorProject;
  frames: ExtractedFrame[];
  currentFrame: number;
  locale: "en" | "zh-CN";
  onSelect: (index: number) => void;
  draftMotionRange?: { startFrame: number; endFrame: number };
  motionPreviewing?: boolean;
}) {
  const currentButtonRef = useRef<HTMLButtonElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const calibration = calibrateDirections(
    project.frames,
    project.directionAnchors,
  );
  const frameSpan = Math.max(1, project.frames.length - 1);
  const curveSegments: string[] = [];
  let currentSegment: string[] = [];
  calibration.frameAngles.forEach((angle, index) => {
    if (angle === null) {
      if (currentSegment.length > 0)
        curveSegments.push(currentSegment.join(" "));
      currentSegment = [];
      return;
    }
    currentSegment.push(`${(index / frameSpan) * 100},${(angle / 360) * 100}`);
  });
  if (currentSegment.length > 0) curveSegments.push(currentSegment.join(" "));
  const isInRange = (
    frameIndex: number,
    ranges: Array<{ startFrame: number; endFrame: number }>,
  ) =>
    ranges.some(
      (range) => frameIndex >= range.startFrame && frameIndex <= range.endFrame,
    );

  useEffect(() => {
    const track = thumbnailsRef.current;
    const target = currentButtonRef.current;
    if (!track || !target) return;
    const left =
      target.offsetLeft - track.clientWidth / 2 + target.offsetWidth / 2;
    track.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth",
    });
  }, [currentFrame]);

  return (
    <div className="direction-timeline">
      <div className="direction-timeline__header">
        <span>
          <strong>
            {locale === "zh-CN" ? "方向时间轴" : "Direction timeline"}
          </strong>
          <small>
            {locale === "zh-CN"
              ? "锚点之间按累计画面变化插值"
              : "Frames interpolate by cumulative visual change"}
          </small>
        </span>
        <span>
          {locale === "zh-CN" ? "当前" : "Current"} {currentFrame + 1}
          <i>·</i>
          {Math.round(calibration.coverageRatio * 100)}%
          {locale === "zh-CN" ? " 已覆盖" : " mapped"}
        </span>
      </div>
      <div className="direction-timeline__curve">
        <span>{locale === "zh-CN" ? "方向" : "Direction"}</span>
        <div className="direction-timeline__plot">
          <span className="direction-timeline__axis direction-timeline__axis--top">
            0°
          </span>
          <span className="direction-timeline__axis direction-timeline__axis--middle">
            180°
          </span>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label={locale === "zh-CN" ? "方向曲线" : "Direction curve"}
          >
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" x2="100" y1={y} y2={y} />
            ))}
            {calibration.unmappedRanges.map((range) => (
              <rect
                key={`unmapped-${range.startFrame}`}
                className="is-unmapped"
                x={(range.startFrame / frameSpan) * 100}
                y="0"
                width={
                  ((Math.max(range.startFrame + 1, range.endFrame) -
                    range.startFrame) /
                    frameSpan) *
                  100
                }
                height="100"
              />
            ))}
            {calibration.reverseSegments.map((range) => (
              <rect
                key={`reverse-${range.startFrame}`}
                className="is-reverse"
                x={(range.startFrame / frameSpan) * 100}
                y="0"
                width={((range.endFrame - range.startFrame) / frameSpan) * 100}
                height="100"
              />
            ))}
            {curveSegments.map((points, index) => (
              <polyline key={index} points={points} />
            ))}
            {project.directionAnchors.map((anchor) => {
              const anchorY = (normalizeAngle(anchor.angle) / 360) * 100;
              return (
                <line
                  key={anchor.id}
                  className="is-anchor"
                  x1={(anchor.frameIndex / frameSpan) * 100}
                  x2={(anchor.frameIndex / frameSpan) * 100}
                  y1={Math.max(0, anchorY - 5)}
                  y2={Math.min(100, anchorY + 5)}
                />
              );
            })}
            <line
              className="is-playhead"
              x1={(currentFrame / frameSpan) * 100}
              x2={(currentFrame / frameSpan) * 100}
              y1="0"
              y2="100"
            />
          </svg>
        </div>
      </div>
      <div className="direction-timeline__track">
        <span>{locale === "zh-CN" ? "小动作" : "Idle motion"}</span>
        {project.motionRanges.map((motion) => (
          <i
            key={motion.id}
            style={{
              left: `${(motion.startFrame / project.frames.length) * 100}%`,
              width: `${((motion.endFrame - motion.startFrame + 1) / project.frames.length) * 100}%`,
            }}
          />
        ))}
        {draftMotionRange && (
          <i
            className={`direction-timeline__draft${motionPreviewing ? " is-playing" : ""}`}
            style={{
              left: `${(draftMotionRange.startFrame / project.frames.length) * 100}%`,
              width: `${((draftMotionRange.endFrame - draftMotionRange.startFrame + 1) / project.frames.length) * 100}%`,
            }}
          >
            <b>{locale === "zh-CN" ? "起" : "S"}</b>
            <b>{locale === "zh-CN" ? "终" : "E"}</b>
          </i>
        )}
      </div>
      <div className="direction-timeline__track direction-timeline__track--exclude">
        <span>{locale === "zh-CN" ? "排除" : "Exclude"}</span>
        {project.frames.map(
          (frame, index) =>
            frame.excluded && (
              <i
                key={frame.id}
                style={{
                  left: `${(index / project.frames.length) * 100}%`,
                  width: `${100 / project.frames.length}%`,
                }}
              />
            ),
        )}
      </div>
      <div
        ref={thumbnailsRef}
        className="timeline-thumbs"
        data-scroll-surface="horizontal"
      >
        {project.frames.map((logical, index) => {
          const frame = frames.find(
            (item) => item.sourceIndex === logical.sourceIndex,
          );
          const anchor = project.directionAnchors.find(
            (item) => item.frameIndex === index,
          );
          const inDraftRange = Boolean(
            draftMotionRange &&
            index >= draftMotionRange.startFrame &&
            index <= draftMotionRange.endFrame,
          );
          const isDraftStart = draftMotionRange?.startFrame === index;
          const isDraftEnd = draftMotionRange?.endFrame === index;
          return (
            <button
              ref={index === currentFrame ? currentButtonRef : undefined}
              key={logical.id}
              type="button"
              aria-pressed={index === currentFrame}
              aria-label={`${locale === "zh-CN" ? "第" : "Frame"} ${index + 1}${locale === "zh-CN" ? " 帧" : ""}${anchor ? ` · ${Math.round(anchor.angle)}°` : ""}${logical.excluded ? ` · ${locale === "zh-CN" ? "已排除" : "excluded"}` : ""}${isDraftStart ? ` · ${locale === "zh-CN" ? "动作起点" : "motion start"}` : ""}${isDraftEnd ? ` · ${locale === "zh-CN" ? "动作终点" : "motion end"}` : ""}`}
              className={`timeline-thumb${index === currentFrame ? " timeline-thumb--active" : ""}${inDraftRange ? " timeline-thumb--range" : ""}${isDraftStart ? " timeline-thumb--range-start" : ""}${isDraftEnd ? " timeline-thumb--range-end" : ""}${motionPreviewing && index === currentFrame ? " timeline-thumb--playing" : ""}${logical.excluded ? " timeline-thumb--excluded" : ""}${calibration.frameAngles[index] === null && !logical.excluded ? " timeline-thumb--unmapped" : ""}${isInRange(index, calibration.reverseSegments) ? " timeline-thumb--reverse" : ""}`}
              onClick={() => onSelect(index)}
            >
              {frame && <img src={frame.url} alt="" />}
              {anchor && <span>{Math.round(anchor.angle)}°</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PointerTestStage({
  frame,
  logicalFrame,
  crop,
  groundLine,
  contentScale,
  pointer,
  onPointer,
  placement,
  backdrop,
  composerHeight,
  onPlacement,
  label,
  dragLabel,
  workspaceLabel,
}: {
  frame?: ExtractedFrame;
  logicalFrame?: LogicalFrame;
  crop: FrameBounds | null;
  groundLine: number | null;
  contentScale: number;
  pointer: { x: number; y: number };
  onPointer: (pointer: { x: number; y: number }) => void;
  placement: CompanionCreatorProject["placement"];
  backdrop: CompanionCreatorProject["preview"]["background"];
  composerHeight: number;
  onPlacement: (placement: CompanionCreatorProject["placement"]) => void;
  label: string;
  dragLabel: string;
  workspaceLabel: string;
}) {
  const [dragPreview, setDragPreview] = useState<
    CompanionCreatorProject["placement"] | null
  >(null);
  const dragOrigin = useRef<{
    x: number;
    y: number;
    placement: CompanionCreatorProject["placement"];
  } | null>(null);
  const displayedPlacement = dragPreview ?? placement;
  const pivot = crop ? sharedTransformPivot(crop, groundLine) : undefined;
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPointer({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };
  const beginPlacementDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      placement: { ...placement },
    };
    setDragPreview({ ...placement });
  };
  const movePlacement = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = dragOrigin.current;
    if (!origin) return;
    event.stopPropagation();
    const stage = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!stage) return;
    setDragPreview({
      ...origin.placement,
      align: clamp(
        origin.placement.align +
          (event.clientX - origin.x) / Math.max(1, stage.width * 0.86),
        0,
        1,
      ),
      offsetY: clamp(
        origin.placement.offsetY - (event.clientY - origin.y),
        -48,
        96,
      ),
    });
  };
  const finishPlacementDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const next = dragPreview;
    if (!dragOrigin.current || !next) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragOrigin.current = null;
    setDragPreview(null);
    onPlacement(next);
  };
  const movePlacementWithKeyboard = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    const next = { ...placement };
    if (event.key === "ArrowLeft") next.align = clamp(next.align - 0.01, 0, 1);
    if (event.key === "ArrowRight") next.align = clamp(next.align + 0.01, 0, 1);
    if (event.key === "ArrowUp")
      next.offsetY = clamp(next.offsetY + 2, -48, 96);
    if (event.key === "ArrowDown")
      next.offsetY = clamp(next.offsetY - 2, -48, 96);
    onPlacement(next);
  };
  return (
    <div
      className={`pointer-test-stage pointer-test-stage--${backdrop}`}
      onPointerMove={update}
      aria-label={label}
    >
      <div className="mock-composer-edge" style={{ height: composerHeight }}>
        {workspaceLabel}
      </div>
      {frame && (
        <button
          type="button"
          className="pointer-test-companion"
          aria-label={dragLabel}
          title={dragLabel}
          onPointerDown={beginPlacementDrag}
          onPointerMove={movePlacement}
          onPointerUp={finishPlacementDrag}
          onPointerCancel={finishPlacementDrag}
          onKeyDown={movePlacementWithKeyboard}
          style={{
            left: `calc(7% + ${displayedPlacement.align * 86}% + ${displayedPlacement.offsetX}px)`,
            bottom: `${24 + composerHeight + displayedPlacement.offsetY}px`,
            width: displayedPlacement.size,
            height: displayedPlacement.size * 1.42,
          }}
        >
          {crop && logicalFrame && pivot ? (
            <svg
              viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <g
                transform={`translate(${pivot.x} ${pivot.y}) scale(${contentScale}) translate(${-pivot.x} ${-pivot.y})`}
              >
                <image
                  href={frame.url}
                  x={logicalFrame.baselineOffset.x}
                  y={logicalFrame.baselineOffset.y}
                  width={frame.width}
                  height={frame.height}
                />
              </g>
            </svg>
          ) : (
            <img src={frame.url} alt="" />
          )}
          <span>{dragLabel}</span>
        </button>
      )}
      <span
        className="pointer-dot"
        style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
      />
    </div>
  );
}

export function CleanupBrushStage({
  frame,
  strokes,
  cornerMasks,
  frameIndex,
  brushMode,
  brushSize,
  sampling,
  backdrop,
  maskView,
  showGuides,
  toolLabel,
  onStroke,
  onSample,
}: {
  frame?: ExtractedFrame;
  strokes: CompanionCreatorProject["cleanup"]["strokes"];
  cornerMasks: CompanionCreatorProject["cleanup"]["cornerMasks"];
  frameIndex: number;
  brushMode: "keep" | "erase";
  brushSize: number;
  sampling: boolean;
  backdrop: "transparent" | "black" | "white" | "theme";
  maskView: boolean;
  showGuides: boolean;
  toolLabel: string;
  onStroke: (points: Array<{ x: number; y: number }>) => void;
  onSample: (point: { x: number; y: number }) => void;
}) {
  const [draft, setDraft] = useState<Array<{ x: number; y: number }>>([]);
  const [hoverPoint, setHoverPoint] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const pointForEvent = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    const point = matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(
          matrix.inverse(),
        )
      : { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(frame?.width ?? 1, point.x)),
      y: Math.max(0, Math.min(frame?.height ?? 1, point.y)),
    };
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (sampling) return;
    const points = [...draft, pointForEvent(event)];
    setDraft([]);
    onStroke(points);
  };
  const visible = showGuides
    ? strokes.filter(
        (stroke) => stroke.frame === "all" || stroke.frame === frameIndex,
      )
    : [];
  const path = (points: Array<{ x: number; y: number }>) =>
    points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div
      className={
        `cleanup-brush-stage cleanup-brush-stage--${backdrop}` +
        (sampling ? " cleanup-brush-stage--sampling" : "") +
        (maskView ? " cleanup-brush-stage--mask" : "")
      }
    >
      {frame && <img src={frame.url} alt="" />}
      {frame && (
        <svg
          viewBox={`0 0 ${frame.width} ${frame.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={
            sampling ? "Pick background color" : `${brushMode} mask brush`
          }
          onPointerDown={(event) => {
            const point = pointForEvent(event);
            if (sampling) {
              onSample(point);
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            setDraft([point]);
          }}
          onPointerMove={(event) => {
            const point = pointForEvent(event);
            setHoverPoint(point);
            if (
              sampling ||
              !event.currentTarget.hasPointerCapture(event.pointerId)
            )
              return;
            setDraft((points) => {
              const previous = points.at(-1);
              if (
                previous &&
                Math.hypot(point.x - previous.x, point.y - previous.y) < 3
              )
                return points;
              return [...points, point];
            });
          }}
          onPointerUp={finish}
          onPointerCancel={() => setDraft([])}
          onPointerLeave={() => {
            if (draft.length === 0) setHoverPoint(undefined);
          }}
        >
          {visible.map((stroke, index) => (
            <polyline
              key={`${stroke.mode}-${index}`}
              points={path(stroke.points)}
              className={`cleanup-stroke cleanup-stroke--${stroke.mode}`}
              style={{ strokeWidth: stroke.radius * 2 }}
            />
          ))}
          {showGuides &&
            cornerMasks.map((mask) => (
              <rect
                key={mask.corner}
                className="cleanup-corner-mask-overlay"
                x={mask.corner.includes("right") ? frame.width - mask.width : 0}
                y={
                  mask.corner.includes("bottom")
                    ? frame.height - mask.height
                    : 0
                }
                width={mask.width}
                height={mask.height}
              />
            ))}
          {draft.length > 0 && (
            <polyline
              points={path(draft)}
              className={`cleanup-stroke cleanup-stroke--${brushMode} cleanup-stroke--draft`}
              style={{ strokeWidth: brushSize * 2 }}
            />
          )}
          {hoverPoint && (
            <circle
              className={`cleanup-brush-cursor cleanup-brush-cursor--${sampling ? "sample" : brushMode}`}
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={sampling ? 5 : brushSize}
            />
          )}
        </svg>
      )}
      <span>{toolLabel}</span>
    </div>
  );
}
