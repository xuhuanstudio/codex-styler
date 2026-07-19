import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EdgeQualityReview } from "./EdgeQualityReview";

afterEach(cleanup);

describe("EdgeQualityReview", () => {
  it("keeps inspection and confirmation as separate, understandable actions", () => {
    const onInspect = vi.fn();
    const onConfirm = vi.fn();
    render(
      <EdgeQualityReview
        locale="en"
        currentBackdrop="black"
        summary={{
          reviewed: [],
          remaining: ["black", "white", "theme"],
          completed: 0,
          total: 3,
          complete: false,
          next: "black",
        }}
        analysis={{ status: "running" }}
        onInspect={onInspect}
        onConfirm={onConfirm}
        onRepair={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /White/ }));
    expect(onInspect).toHaveBeenCalledWith("white");
    fireEvent.click(screen.getByRole("button", { name: /Confirm edges/ }));
    expect(onConfirm).toHaveBeenCalledWith("black");
  });

  it("shows a complete quality state without another confirmation action", () => {
    render(
      <EdgeQualityReview
        locale="zh-CN"
        currentBackdrop="theme"
        summary={{
          reviewed: ["black", "white", "theme"],
          remaining: [],
          completed: 3,
          total: 3,
          complete: true,
          next: null,
        }}
        analysis={{
          status: "ready",
          result: { scannedFrameIndexes: [0], issues: [] },
        }}
        onInspect={vi.fn()}
        onConfirm={vi.fn()}
        onRepair={vi.fn()}
      />,
    );

    expect(screen.getByText("已在三种代表性表面检查最终像素。")).toBeVisible();
    expect(screen.queryByText(/确认.*背景边缘正常/)).not.toBeInTheDocument();
  });

  it("routes an automated finding to the affected frame without blocking review", () => {
    const onRepair = vi.fn();
    render(
      <EdgeQualityReview
        locale="en"
        currentBackdrop="white"
        summary={{
          reviewed: ["black"],
          remaining: ["white", "theme"],
          completed: 1,
          total: 3,
          complete: false,
          next: "white",
        }}
        analysis={{
          status: "ready",
          result: {
            scannedFrameIndexes: [0, 6],
            issues: [{ kind: "floating-pixels", frameIndexes: [6] }],
          },
        }}
        onInspect={vi.fn()}
        onConfirm={vi.fn()}
        onRepair={onRepair}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Isolated pixels appear outside the main subject/,
      }),
    );
    expect(onRepair).toHaveBeenCalledWith(6);
    expect(screen.getByRole("button", { name: /Confirm edges/ })).toBeEnabled();
  });
});
