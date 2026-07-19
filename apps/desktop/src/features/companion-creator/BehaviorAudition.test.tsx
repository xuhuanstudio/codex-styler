import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BehaviorAudition } from "./BehaviorAudition";
import type { MotionAuditionPlan } from "./motions";

afterEach(cleanup);

const plan: MotionAuditionPlan = {
  activeAnchor: { id: "east", frameIndex: 3, angle: 90 },
  motions: [
    {
      id: "blink",
      name: "Blink",
      frames: [3, 4, 3],
      frameDurationMs: 42,
      durationMs: 126,
    },
    {
      id: "breathe",
      name: "Breathe",
      frames: [3, 5, 6, 3],
      frameDurationMs: 84,
      durationMs: 336,
    },
  ],
};

describe("BehaviorAudition", () => {
  it("shows the active pose and makes saved motion playback explicit", () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    render(
      <BehaviorAudition
        locale="en"
        plan={plan}
        selectedMotionId="blink"
        playing={false}
        onSelect={onSelect}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByText("90° · anchor frame 4")).toBeVisible();
    expect(screen.getByText("3 frames · 0.1s")).toBeVisible();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "breathe" },
    });
    expect(onSelect).toHaveBeenCalledWith("breathe");
    fireEvent.click(screen.getByRole("button", { name: "Play idle motion" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("communicates pointer interruption while a motion is playing", () => {
    render(
      <BehaviorAudition
        locale="zh-CN"
        plan={plan}
        selectedMotionId="blink"
        playing
        onSelect={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "停止预览" })).toBeVisible();
    expect(screen.getByText(/移动光标会立即中断动作/)).toBeVisible();
    expect(screen.getByText(/正在播放/)).toBeVisible();
  });

  it("explains when the current pose has no assigned idle motion", () => {
    render(
      <BehaviorAudition
        locale="en"
        plan={{ ...plan, motions: [] }}
        selectedMotionId={null}
        playing={false}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No idle motion is assigned to this direction."),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
