import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportStep } from "./ImportStep";
import { createCompanionProject } from "./model";

const copy = {
  steps: { import: "Import" },
  importHelp: "Choose local source material.",
  image: "Static image",
  sequence: "Image sequence",
  video: "Video",
  atlas: "Sprite atlas",
  imageHint: "PNG / JPEG / WebP",
  sequenceHint: "Naturally sorted images",
  videoHint: "MP4 / MOV / WebM",
  atlasHint: "Grid-based atlas",
  releaseFiles: "Release to import",
  chooseFiles: "Click to choose, or drop source files here",
  noSource: "No source selected",
  removeSource: "Remove source",
  importGuideTitle: "Prepare reliable source material",
  importGuideItems: ["Keep the full subject visible"],
} as const;

function renderImport(
  project = createCompanionProject("companion-import-test"),
  chooseKind = vi.fn(),
  onUseAutomaticDetection = vi.fn(),
) {
  render(
    <ImportStep
      project={project}
      locale="en"
      copy={copy}
      dragActive={false}
      dropzoneRef={createRef<HTMLButtonElement>()}
      inputRef={createRef<HTMLInputElement>()}
      chooseKind={chooseKind}
      onUseAutomaticDetection={onUseAutomaticDetection}
      onDragEnter={vi.fn()}
      onDragOver={vi.fn()}
      onDragLeave={vi.fn()}
      onDrop={vi.fn()}
      onFiles={vi.fn()}
      onRemoveSource={vi.fn()}
    />,
  );
  return { chooseKind, onUseAutomaticDetection };
}

describe("Companion Studio import step", () => {
  afterEach(cleanup);

  it("presents direct import as automatic detection by default", () => {
    renderImport();

    expect(screen.getByText("Auto detect (recommended)")).toBeVisible();
    expect(
      screen.getByText(
        "Images, image sequences, videos, and atlases are detected automatically.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /Click to choose, or drop source files here/,
      }),
    ).toHaveAccessibleDescription(/detected automatically/i);
    expect(
      screen.getByRole("button", { name: /Static image/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps explicit source constraints visible and keyboard operable", () => {
    const project = createCompanionProject("companion-video-test");
    project.source = {
      kind: "video",
      files: [],
      videoRange: { startMs: 0, endMs: 30_000 },
      extractionFps: 12,
    };
    const { chooseKind, onUseAutomaticDetection } = renderImport(project);
    const video = screen.getByRole("button", { pressed: true });

    expect(video).toHaveAttribute("aria-pressed", "true");
    const automatic = screen.getByRole("button", {
      name: "Use automatic detection",
    });
    expect(automatic).toBeVisible();
    expect(
      screen.getByText(
        "Currently limited to Video. Click or drop source files to continue.",
      ),
    ).toBeVisible();

    const atlas = screen.getByRole("button", { name: /^Sprite atlas/ });
    fireEvent.click(atlas);
    expect(chooseKind).toHaveBeenCalledWith("atlas");
    fireEvent.click(automatic);
    expect(onUseAutomaticDetection).toHaveBeenCalledOnce();
  });
});
