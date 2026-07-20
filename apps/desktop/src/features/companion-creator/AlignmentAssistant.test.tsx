import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AlignmentAssistant,
  recommendAlignmentResolution,
} from "./AlignmentAssistant";
import type { AlignmentDiagnostics } from "./calibration";

function diagnostics(
  overrides: Partial<AlignmentDiagnostics> = {},
): AlignmentDiagnostics {
  return {
    includedFrames: 8,
    boundedFrames: 8,
    missingBounds: 0,
    outsideCrop: 0,
    baselineOutliers: 0,
    centerOutliers: 0,
    maximumBaselineDelta: 0,
    maximumCenterDelta: 0,
    ready: true,
    frames: [],
    ...overrides,
  };
}

describe("alignment resolution recommendation", () => {
  afterEach(cleanup);

  it("repairs missing silhouettes before changing geometry", () => {
    expect(
      recommendAlignmentResolution({
        diagnostics: diagnostics({ missingBounds: 2, ready: false }),
        currentScale: 1,
        fittedScale: 0.8,
        canExpand: true,
      }),
    ).toBe("cleanup");
  });

  it("aligns positional drift before attempting to resize the set", () => {
    expect(
      recommendAlignmentResolution({
        diagnostics: diagnostics({
          centerOutliers: 3,
          outsideCrop: 2,
          ready: false,
        }),
        currentScale: 1,
        fittedScale: 0.82,
        canExpand: true,
      }),
    ).toBe("align");
  });

  it("fits modest overflow but preserves pixels when fitting would over-shrink", () => {
    const overflow = diagnostics({ outsideCrop: 2, ready: false });
    expect(
      recommendAlignmentResolution({
        diagnostics: overflow,
        currentScale: 1,
        fittedScale: 0.88,
        canExpand: true,
      }),
    ).toBe("fit");
    expect(
      recommendAlignmentResolution({
        diagnostics: overflow,
        currentScale: 1,
        fittedScale: 0.58,
        canExpand: true,
      }),
    ).toBe("expand");
  });

  it("never recommends a fit that would enlarge an already overflowing set", () => {
    expect(
      recommendAlignmentResolution({
        diagnostics: diagnostics({ outsideCrop: 1, ready: false }),
        currentScale: 0.7,
        fittedScale: 0.9,
        canExpand: false,
      }),
    ).toBe("inspect");
  });

  it("presents one primary repair and keeps alternatives secondary", () => {
    const onAutoAlign = vi.fn();
    render(
      <AlignmentAssistant
        locale="en"
        diagnostics={diagnostics({ centerOutliers: 2, ready: false })}
        currentScale={1}
        fittedScale={0.9}
        canExpand
        onFit={vi.fn()}
        onExpand={vi.fn()}
        onInspect={vi.fn()}
        onAutoAlign={onAutoAlign}
        onReturnCleanup={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Auto-align included frames" }),
    );
    expect(onAutoAlign).toHaveBeenCalledOnce();
    expect(screen.getByText("Other alignment tools")).toBeVisible();
  });
});
