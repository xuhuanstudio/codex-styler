import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EdgeQualityReview } from "./EdgeQualityReview";

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
        onInspect={vi.fn()}
        onConfirm={vi.fn()}
        onRepair={vi.fn()}
      />,
    );

    expect(screen.getByText("已在三种代表性表面检查最终像素。")).toBeVisible();
    expect(screen.queryByText(/确认.*背景边缘正常/)).not.toBeInTheDocument();
  });
});
