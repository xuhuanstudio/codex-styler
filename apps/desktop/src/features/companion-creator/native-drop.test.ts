import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { filesFromDroppedPaths } from "./native-drop";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("native creator drag and drop", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("converts Windows and macOS paths into correctly typed browser files", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(new Uint8Array([9, 1, 2, 9]).subarray(1, 3))
      .mockResolvedValueOnce([3, 4, 5]);

    const files = await filesFromDroppedPaths([
      "C:\\Users\\Ada\\turn.MP4",
      "/Users/ada/frame-02.PNG",
    ]);

    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({
      name: "turn.MP4",
      type: "video/mp4",
      size: 2,
    });
    expect(files[1]).toMatchObject({
      name: "frame-02.PNG",
      type: "image/png",
      size: 3,
    });
    expect(invoke).toHaveBeenNthCalledWith(1, "read_creator_source_file", {
      path: "C:\\Users\\Ada\\turn.MP4",
    });
  });

  it("surfaces invalid native bridge responses instead of silently importing", async () => {
    vi.mocked(invoke).mockResolvedValue("not-binary" as never);

    await expect(filesFromDroppedPaths(["/tmp/turn.mov"])).rejects.toThrow(
      "did not contain binary data",
    );
  });
});
