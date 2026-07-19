import { describe, expect, it, vi } from "vitest";
import {
  CompanionRestoreCancelledError,
  restoreFramesSequentially,
} from "./restore-flow";

describe("companion draft restoration", () => {
  it("processes large frame work sequentially and reports each checkpoint", async () => {
    const controller = new AbortController();
    let active = 0;
    let peak = 0;
    const progress = vi.fn();

    const output = await restoreFramesSequentially(
      [1, 2, 3],
      async (value) => {
        active += 1;
        peak = Math.max(peak, active);
        await Promise.resolve();
        active -= 1;
        return value * 2;
      },
      { signal: controller.signal, onProgress: progress },
    );

    expect(output).toEqual([2, 4, 6]);
    expect(peak).toBe(1);
    expect(progress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("stops at the next frame boundary after cancellation", async () => {
    const controller = new AbortController();
    const processed: number[] = [];

    await expect(
      restoreFramesSequentially(
        [1, 2, 3],
        async (value) => {
          processed.push(value);
          if (value === 1) controller.abort();
          return value;
        },
        { signal: controller.signal },
      ),
    ).rejects.toBeInstanceOf(CompanionRestoreCancelledError);

    expect(processed).toEqual([1]);
  });
});
