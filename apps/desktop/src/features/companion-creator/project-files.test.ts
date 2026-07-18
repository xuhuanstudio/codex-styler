import { afterEach, describe, expect, it, vi } from "vitest";
import { createCompanionProject } from "./model";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

import {
  listCompanionProjects,
  loadCompanionProjectFrames,
} from "./project-files";

describe("companion creator project files", () => {
  afterEach(() => {
    invokeMock.mockReset();
    Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
    Reflect.deleteProperty(Blob.prototype, "text");
  });

  it("restores Tauri raw-byte responses and filters empty drafts", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(Blob.prototype, "text", {
      configurable: true,
      value(this: Blob) {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(this);
        });
      },
    });
    const empty = createCompanionProject("companion-empty-draft");
    const populated = createCompanionProject("companion-video-draft");
    populated.name = "Pointer turn";
    populated.source = {
      kind: "video",
      files: [
        {
          name: "turn.mp4",
          type: "video/mp4",
          size: 1024,
          lastModified: 1,
          storedPath: "sources/source-001.mp4",
        },
      ],
      videoRange: { startMs: 0, endMs: 1_000 },
      extractionFps: 12,
    };

    invokeMock.mockImplementation(
      async (command: string, args?: { projectId?: string }) => {
        if (command === "list_companion_projects") {
          return [empty.id, populated.id];
        }
        const project = args?.projectId === populated.id ? populated : empty;
        return new TextEncoder().encode(JSON.stringify(project)).buffer;
      },
    );

    await expect(listCompanionProjects()).resolves.toEqual([
      expect.objectContaining({ id: populated.id, name: "Pointer turn" }),
    ]);
  });

  it("restores cached frames concurrently without changing frame order", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      configurable: true,
    });
    invokeMock.mockImplementation(
      async (
        command: string,
        args?: { projectPath?: string },
      ): Promise<ArrayBuffer> => {
        expect(command).toBe("load_companion_project_file");
        const index = Number(args?.projectPath?.match(/(\d+)\.webp$/u)?.[1]);
        await new Promise((resolve) =>
          window.setTimeout(resolve, index === 1 ? 20 : 1),
        );
        return Uint8Array.of(index).buffer;
      },
    );

    const frames = await loadCompanionProjectFrames("companion-cache", [
      "frames/source-001.webp",
      "frames/source-002.webp",
      "frames/source-003.webp",
    ]);

    const bytes = await Promise.all(
      frames.map(
        (frame) =>
          new Promise<number[]>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve([...new Uint8Array(reader.result as ArrayBuffer)]);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(frame!);
          }),
      ),
    );
    expect(bytes).toEqual([[1], [2], [3]]);
  });
});
