import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { normalizeAngle } from "./calibration";

export function DirectionDial({
  angle,
  onChange,
  label,
}: {
  angle: number;
  onChange: (angle: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    onChange(
      normalizeAngle(
        (Math.atan2(event.clientX - centerX, centerY - event.clientY) * 180) /
          Math.PI,
      ),
    );
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 15 : 1;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(normalizeAngle(angle + step));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(normalizeAngle(angle - step));
    }
    if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(359);
    }
  };

  return (
    <div className="direction-control">
      <div
        ref={ref}
        className="direction-dial"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(angle)}
        aria-valuetext={`${Math.round(angle)} degrees, clockwise from up`}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event);
          }
        }}
        onKeyDown={onKeyDown}
      >
        <span className="direction-dial__north">0°</span>
        <span className="direction-dial__east">90°</span>
        <span className="direction-dial__south">180°</span>
        <span className="direction-dial__west">270°</span>
        <span
          className="direction-dial__needle"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
        <span className="direction-dial__hub" />
      </div>
      <label className="direction-angle-input">
        <span>{label}</span>
        <span>
          <input
            type="number"
            min={0}
            max={359.99}
            step={0.1}
            value={Number(angle.toFixed(1))}
            onChange={(event) =>
              onChange(normalizeAngle(Number(event.target.value)))
            }
          />
          °
        </span>
      </label>
    </div>
  );
}
