import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

type Locale = "en" | "zh-CN";
type Appearance = "light" | "dark";

async function openManager(
  page: Page,
  locale: Locale,
  appearance: Appearance,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.addInitScript(
    ({ selectedLocale, selectedAppearance }) => {
      localStorage.setItem(
        "codex-styler.settings.v1",
        JSON.stringify({
          locale: selectedLocale,
          appearance: selectedAppearance,
          runtimeStrategy: "enhanced",
          appliedThemeId: "codex-styler.native-refined",
          companionMode: "theme-default",
          automaticUpdateChecks: false,
          onboardingComplete: true,
        }),
      );
    },
    { selectedLocale: locale, selectedAppearance: appearance },
  );
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("main.app-main")).toBeVisible();
  await expect(page.locator("canvas.scene-entity__sprite")).toHaveAttribute(
    "data-ready",
    "true",
  );
}

test("English light manager at the primary desktop size", async ({ page }) => {
  await openManager(page, "en", "light", { width: 1320, height: 840 });
  await expect(page).toHaveScreenshot("manager-en-light-1320x840.png", {
    fullPage: true,
  });
});

test("English dark manager at the compact supported size", async ({ page }) => {
  await openManager(page, "en", "dark", { width: 960, height: 680 });
  await expect(page).toHaveScreenshot("manager-en-dark-960x680.png", {
    fullPage: true,
  });
});

test("English dark home keeps a balanced preview in a tall window", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1600, height: 1000 });
  const currentSetup = page.locator(".home-current");
  const quickActions = page.locator(".home-actions > button");
  await expect(currentSetup).toBeVisible();
  const dimensions = await currentSetup.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const preview = element
      .querySelector(".home-current__preview")!
      .getBoundingClientRect();
    return {
      height: bounds.height,
      previewAspectRatio: preview.width / preview.height,
    };
  });
  expect(dimensions.height).toBeGreaterThanOrEqual(450);
  expect(dimensions.previewAspectRatio).toBeLessThan(2.05);
  await expect(quickActions.first()).toHaveCSS("min-height", "100px");
  await expect(page).toHaveScreenshot("manager-en-dark-1600x1000.png", {
    fullPage: true,
  });
});

test("companion cards use independent portraits", async ({ page }) => {
  await openManager(page, "en", "dark", { width: 960, height: 680 });
  await page.getByRole("button", { name: "Companions" }).click();
  await expect(page.locator('[data-preview-source="portrait"]')).toHaveCount(6);
  await expect(
    page.locator('.companion-option__frame[style*="-atlas"]'),
  ).toHaveCount(0);
  const list = page.locator(".companion-list");
  await list.scrollIntoViewIfNeeded();
  await expect(list).toHaveScreenshot("companion-list-en-dark.png");
});

test("theme library and focused editor remain usable at compact sizes", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Themes", exact: true }).click();
  await expect(page.locator(".theme-library-workspace")).toBeVisible();
  await expect(page).toHaveScreenshot("themes-en-dark-1320x840.png");

  await page.setViewportSize({ width: 960, height: 680 });
  await expect(page.locator(".theme-library-master")).toBeVisible();
  await expect(page.locator(".featured-theme")).toBeHidden();
  await expect(page).toHaveScreenshot("themes-en-dark-960x680.png");

  await page.getByRole("button", { name: "New theme" }).click();
  await page.getByRole("button", { name: /Start blank/ }).click();
  await expect(page.locator(".editor-page")).toBeVisible();
  await expect(page.locator(".layers-panel")).toBeVisible();
  await expect(
    page.getByRole("separator", { name: "Scene layers" }),
  ).toBeHidden();
  await expect(
    page.getByRole("region", { name: "Live effect mapped" }),
  ).toContainText("5 preview views");
  const saveDraft = page.getByRole("button", { name: "Save draft" });
  await expect(saveDraft).toBeDisabled();
  await expect(saveDraft).toHaveAttribute("data-dirty", "false");
  await expect(page).toHaveScreenshot("theme-editor-en-dark-960x680.png");

  await page.getByRole("button", { name: "Surfaces" }).click();
  await expect(
    page.getByRole("button", { name: "Appearance" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("region", { name: "Enhanced mode effect" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview on Task & composer" })
    .click();
  await expect(page.locator(".workspace-preview")).toHaveAttribute(
    "data-preview-scenario",
    "task",
  );
  await expect(page.locator('[data-theme-control^="surfaces."]')).toHaveCount(
    6,
  );
  const savedPreview = page.getByRole("button", { name: "Saved" });
  await expect(savedPreview).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Workspace layout" })
    .selectOption("immersive");
  await expect(saveDraft).toBeEnabled();
  await expect(saveDraft).toHaveAttribute("data-dirty", "true");
  await expect(savedPreview).toBeEnabled();
  const undoTheme = page.getByRole("button", { name: "Undo theme change" });
  const redoTheme = page.getByRole("button", { name: "Redo theme change" });
  await expect(undoTheme).toBeEnabled();
  await expect(redoTheme).toBeDisabled();
  await undoTheme.click();
  await expect(
    page.getByRole("combobox", { name: "Workspace layout" }),
  ).toHaveValue("native");
  await expect(redoTheme).toBeEnabled();
  await redoTheme.click();
  await expect(
    page.getByRole("combobox", { name: "Workspace layout" }),
  ).toHaveValue("immersive");
  await savedPreview.click();
  await expect(page.locator(".canvas-stage")).toHaveAttribute(
    "data-preview-version",
    "saved",
  );
  await expect(page.locator(".inspector-content")).toHaveAttribute("inert");
  await expect(page.getByText("Saved preview", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Return" }).click();
  await expect(page.locator(".canvas-stage")).toHaveAttribute(
    "data-preview-version",
    "current",
  );
  await expect(page.locator(".inspector-content")).not.toHaveAttribute("inert");

  await page.getByRole("button", { name: "Back to themes" }).click();
  const unsavedDialog = page.getByRole("dialog", {
    name: "Save this theme before leaving?",
  });
  await expect(unsavedDialog).toBeVisible();
  await unsavedDialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.locator(".editor-page")).toBeVisible();

  await page.getByRole("button", { name: "Back to themes" }).click();
  await page.getByRole("button", { name: "Save and leave" }).click();
  await expect(page.locator(".theme-library-workspace")).toBeVisible();
});

test("scroll surfaces use product chrome instead of platform defaults", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 960, height: 680 });
  await page.getByRole("button", { name: "Themes", exact: true }).click();

  const themeList = page.locator(".theme-list");
  await expect(themeList).toBeVisible();
  const themeScrollChrome = await themeList.evaluate((element) => {
    const style = getComputedStyle(element);
    const thumb = getComputedStyle(element, "::-webkit-scrollbar-thumb");
    return {
      color: style.scrollbarColor,
      width: style.scrollbarWidth,
      thumbRadius: thumb.borderRadius,
    };
  });
  expect(themeScrollChrome.color).not.toBe("auto");
  expect(themeScrollChrome.width).toBe("thin");
  expect(themeScrollChrome.thumbRadius).toBe("999px");

  await page.getByRole("button", { name: "Companions" }).click();
  const companionList = page.locator(".companion-list");
  await expect(companionList).toBeVisible();
  await expect
    .poll(() =>
      companionList.evaluate(
        (element) => getComputedStyle(element).scrollbarColor,
      ),
    )
    .not.toBe("auto");

  await page.getByRole("button", { name: "New companion" }).click();
  const creatorSteps = page.locator(".creator-steps");
  await expect(creatorSteps).toBeVisible();
  await expect
    .poll(() =>
      creatorSteps.evaluate(
        (element) => getComputedStyle(element).scrollbarColor,
      ),
    )
    .not.toBe("auto");
});

test("settings controls share a stable professional layout", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page).toHaveScreenshot("settings-en-dark.png");
  await page.setViewportSize({ width: 960, height: 680 });
  await expect(page).toHaveScreenshot("settings-en-dark-960x680.png");
});

test("Simplified Chinese light layout remains stable", async ({ page }) => {
  await openManager(page, "zh-CN", "light", { width: 1320, height: 840 });
  await expect(page).toHaveScreenshot("manager-zh-light-1320x840.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});

test("Simplified Chinese dark layout remains stable", async ({ page }) => {
  await openManager(page, "zh-CN", "dark", { width: 960, height: 680 });
  await expect(page).toHaveScreenshot("manager-zh-dark-960x680.png", {
    fullPage: true,
    // CoreText rasterizes dense Chinese glyphs differently between the
    // developer OS and GitHub's macOS runner. The downloaded CI diff confirms
    // identical layout and geometry; only glyph edges differ.
    maxDiffPixelRatio: 0.025,
  });
});

test("keyboard flow starts, applies, changes a companion, and restores", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });

  const start = page.getByRole("button", { name: "Start Codex & apply" });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Applied", { exact: true }).first(),
  ).toBeVisible();

  const companions = page.getByRole("button", { name: "Companions" });
  await companions.focus();
  await page.keyboard.press("Enter");
  const noCompanion = page.getByRole("button", { name: /No companion/ });
  await noCompanion.focus();
  await page.keyboard.press("Enter");
  await expect(noCompanion).toHaveAttribute("aria-pressed", "true");

  const restore = page.getByRole("button", { name: "Restore official" });
  await restore.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Ready to start", { exact: true }).first(),
  ).toBeVisible();
});

test("keyboard companion creator completes a static-image project", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Companions" }).press("Enter");
  await page.getByRole("button", { name: "New companion" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Companion Studio" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset step" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Reset project" }),
  ).toBeDisabled();
  await expect(
    page.getByText("A reliable source makes calibration faster"),
  ).toBeVisible();

  await page.getByRole("button", { name: /Static image/ }).press("Enter");
  const imagePath = fileURLToPath(
    new URL("../public/companions/pico-parrot-portrait.webp", import.meta.url),
  );
  const imageBytes = [...(await readFile(imagePath))];
  const dataTransfer = await page.evaluateHandle((bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array(bytes)], "pico-parrot-portrait.webp", {
        type: "image/webp",
      }),
    );
    return transfer;
  }, imageBytes);
  const dropzone = page.locator(".creator-dropzone");
  await dropzone.dispatchEvent("dragenter", { dataTransfer });
  await expect(dropzone).toContainText("Release to import");
  await dropzone.dispatchEvent("drop", { dataTransfer });
  await expect(
    page.getByText("pico-parrot-portrait.webp", { exact: true }),
  ).toBeVisible();
  const removeSource = page.getByRole("button", { name: "Remove source" });
  await expect(removeSource).toBeVisible();
  await removeSource.click();
  await expect(
    page.getByRole("dialog", { name: "Remove the imported source?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: /Video/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Change the source type?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveScreenshot("creator-import-en-dark.png");
  await page.getByRole("button", { name: /Next/ }).press("Enter");
  const generateFrames = page.getByRole("button", {
    name: /Prepare companion frame/,
  });
  await expect(generateFrames).toBeVisible();
  await expect(page).toHaveScreenshot("creator-extract-en-dark.png");
  await generateFrames.press("Enter");
  await expect(page.getByRole("heading", { name: "Clean up" })).toBeVisible();
  await expect(page.getByText("Processing is synchronized")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(imagePath);
  await expect(
    page.getByRole("dialog", { name: "Replace the imported source?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: /Clean up/ }).click();
  await expect(page).toHaveScreenshot("creator-cleanup-en-dark.png");
  const cleanupMode = page.getByLabel("Mode");
  const sampleColor = page.getByLabel("Sample color");
  await expect(sampleColor).toBeDisabled();
  await cleanupMode.selectOption("sampled-color");
  await expect(sampleColor).toBeEnabled();
  await expect(page.getByLabel("Tolerance")).toBeEnabled();
  await expect(page.getByText("Unapplied adjustments")).toBeVisible();
  await page.getByRole("button", { name: "Discard edits" }).click();
  await expect(page.getByText("Processing is synchronized")).toBeVisible();
  await expect(cleanupMode).toHaveValue("preserve-alpha");
  await expect(sampleColor).toBeDisabled();
  await page.setViewportSize({ width: 960, height: 680 });
  await expect(page).toHaveScreenshot("creator-cleanup-en-dark-960x680.png");
  await page.setViewportSize({ width: 1320, height: 840 });
  await page.getByRole("button", { name: "top left corner mask" }).click();
  await expect(page.locator(".cleanup-corner-mask-overlay")).toHaveCount(0);
  await page.getByRole("button", { name: "Source" }).click();
  await expect(page.locator(".cleanup-corner-mask-overlay")).toHaveCount(1);
  const brushSurface = page.locator(".cleanup-brush-stage > svg");
  const brushBox = await brushSurface.boundingBox();
  expect(brushBox).not.toBeNull();
  await page.mouse.move(
    brushBox!.x + brushBox!.width * 0.74,
    brushBox!.y + brushBox!.height * 0.25,
  );
  await page.mouse.down();
  await page.mouse.move(
    brushBox!.x + brushBox!.width * 0.78,
    brushBox!.y + brushBox!.height * 0.3,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(page.locator(".cleanup-stroke--erase")).toHaveCount(1);
  await page.getByRole("button", { name: "Result" }).click();
  await expect(page.locator(".cleanup-stroke--erase")).toHaveCount(0);
  await expect(page.getByText("Unapplied adjustments")).toBeVisible();
  await page.getByRole("button", { name: "Align" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Align", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shared canvas ready" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("creator-align-en-dark.png");
  await page
    .getByRole("button", { name: "Current frame", exact: true })
    .click();
  const baselineX = page.getByLabel("Horizontal offset");
  const baselineXBefore = Number(await baselineX.inputValue());
  const alignmentSurface = page.locator(".alignment-frame-hit");
  const alignmentBox = await alignmentSurface.boundingBox();
  expect(alignmentBox).not.toBeNull();
  await page.mouse.move(
    alignmentBox!.x + alignmentBox!.width / 2,
    alignmentBox!.y + alignmentBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    alignmentBox!.x + alignmentBox!.width / 2 + 12,
    alignmentBox!.y + alignmentBox!.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => Number(await baselineX.inputValue()))
    .not.toBe(baselineXBefore);
  await expect(
    page.getByRole("heading", { name: "Some frames need alignment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Snap current frame" }).click();
  await expect(
    page.getByRole("heading", { name: "Shared canvas ready" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Shared canvas" }).click();
  const cropX = page.getByLabel("X", { exact: true });
  const cropXBefore = Number(await cropX.inputValue());
  const cropSurface = page.locator(".alignment-crop-hit");
  const cropBox = await cropSurface.boundingBox();
  expect(cropBox).not.toBeNull();
  await page.mouse.move(
    cropBox!.x + cropBox!.width / 2,
    cropBox!.y + cropBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    cropBox!.x + cropBox!.width / 2 + 18,
    cropBox!.y + cropBox!.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => Number(await cropX.inputValue()))
    .not.toBe(cropXBefore);
  await page
    .getByRole("button", { name: "Auto-align included frames" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Shared canvas ready" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Calibrate" }).press("Enter");
  await expect(page).toHaveScreenshot("creator-calibrate-en-dark.png");
  await page.getByRole("button", { name: "Motions" }).press("Enter");
  await expect(page).toHaveScreenshot("creator-motions-en-dark.png");
  await page.getByRole("button", { name: "Test & Save" }).press("Enter");
  await expect(
    page.getByText("Compiled output", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("1 optimized image", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 / 512", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot("creator-test-en-dark.png");
  await page.setViewportSize({ width: 960, height: 680 });
  await expect(page).toHaveScreenshot("creator-test-en-dark-960x680.png");
  await expect(
    page.getByText("Compiled output", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1320, height: 840 });
  const companionPlacement = page.getByRole("button", {
    name: "Drag companion position",
  });
  const composerEdge = page.locator(".mock-composer-edge");
  const companionBox = await companionPlacement.boundingBox();
  const composerBox = await composerEdge.boundingBox();
  expect(companionBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  expect(
    Math.abs(companionBox!.y + companionBox!.height - composerBox!.y),
  ).toBeLessThanOrEqual(4);

  const horizontalPosition = page
    .locator(".creator-control-row")
    .filter({ hasText: "Horizontal position" })
    .locator('input[type="range"]');
  const horizontalBefore = Number(await horizontalPosition.inputValue());
  await companionPlacement.focus();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => Number(await horizontalPosition.inputValue()))
    .toBeLessThan(horizontalBefore);

  const reviewSetup = page.getByRole("button", {
    name: /Review remaining setup/,
  });
  const companionName = page.getByLabel("Companion name");
  await companionName.fill("");
  await expect(reviewSetup).toBeEnabled();
  await reviewSetup.press("Enter");
  await expect(companionName).toBeFocused();
  await companionName.fill("Keyboard Friend");
  await page
    .getByLabel("Description")
    .fill("A keyboard-tested local companion.");
  await page.getByLabel("Author").fill("Test creator");
  await page.getByLabel("Asset license").selectOption("CC0-1.0");
  const buildCompanion = page.getByRole("button", {
    name: /Build and install companion/,
  });
  await expect(buildCompanion).toBeEnabled();
  await buildCompanion.press("Enter");
  await expect(
    page.getByText("Keyboard Friend", { exact: true }).first(),
  ).toBeVisible();
});

test("companion creator confirms destructive project reset", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Companions" }).click();
  await page.getByRole("button", { name: "New companion" }).click();
  const resetProject = page.getByRole("button", { name: "Reset project" });
  await expect(resetProject).toBeDisabled();
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(
      fileURLToPath(
        new URL(
          "../public/companions/pico-parrot-portrait.webp",
          import.meta.url,
        ),
      ),
    );
  await expect(resetProject).toBeEnabled();
  await resetProject.click();
  const dialog = page.getByRole("dialog", {
    name: "Reset this companion project?",
  });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveScreenshot("creator-reset-dialog-en-dark.png");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
});

test("standard H.264 MP4 extracts without conversion", async ({ page }) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Companions" }).click();
  await page.getByRole("button", { name: "New companion" }).click();
  await page.getByRole("button", { name: /Video/ }).click();
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(
      fileURLToPath(new URL("./fixtures/short-h264.mp4", import.meta.url)),
    );
  await expect(page.getByText("short-h264.mp4", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.getByRole("button", { name: "Set in" })).toBeVisible();
  await expect(page).toHaveScreenshot("creator-video-extract-en-dark.png");
  await page.getByRole("button", { name: /Extract video frames/ }).click();
  await expect(page.getByText(/\d+ frames/u)).toBeVisible();
  await expect(
    page.getByText(/could not be decoded|codec inside/u),
  ).toHaveCount(0);
});

test("light companion cleanup remains legible", async ({ page }) => {
  await openManager(page, "en", "light", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Companions" }).click();
  await page.getByRole("button", { name: "New companion" }).click();
  await page.getByRole("button", { name: /Static image/ }).click();
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(
      fileURLToPath(
        new URL(
          "../public/companions/pico-parrot-portrait.webp",
          import.meta.url,
        ),
      ),
    );
  await page.getByRole("button", { name: /Next/ }).click();
  await page.getByRole("button", { name: /Prepare companion frame/ }).click();
  await expect(page.getByRole("heading", { name: "Clean up" })).toBeVisible();
  await expect(page.getByText("Processing is synchronized")).toBeVisible();
  await expect(page).toHaveScreenshot("creator-cleanup-en-light.png");
});

test("atlas grid controls map to the visible slice preview", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });
  await page.getByRole("button", { name: "Companions" }).click();
  await page.getByRole("button", { name: "New companion" }).click();
  await page.getByRole("button", { name: /Sprite atlas/ }).click();
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(
      fileURLToPath(
        new URL(
          "../public/companions/pico-parrot-portrait.webp",
          import.meta.url,
        ),
      ),
    );
  await page.getByRole("button", { name: /Next/ }).click();
  const fitGrid = page.getByRole("button", {
    name: "Fit grid evenly to source",
  });
  await expect(fitGrid).toBeEnabled();
  await fitGrid.click();
  await expect(page.getByLabel("Cell width")).toHaveValue("112");
  await expect(page.getByLabel("Cell height")).toHaveValue("162");
  await expect(page.locator(".atlas-grid-preview .is-overflow")).toHaveCount(0);
});
