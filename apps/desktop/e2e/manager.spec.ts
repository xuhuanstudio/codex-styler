import { expect, test, type Page } from "@playwright/test";
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
    maxDiffPixelRatio: 0.015,
  });
});

test("keyboard flow starts, applies, changes a companion, and restores", async ({
  page,
}) => {
  await openManager(page, "en", "dark", { width: 1320, height: 840 });

  const start = page.getByRole("button", { name: "Start and apply" });
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
    page.getByText("Pending", { exact: true }).first(),
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

  await page.getByRole("button", { name: /Static image/ }).press("Enter");
  await page
    .locator('.creator-import input[type="file"]')
    .setInputFiles(
      fileURLToPath(new URL("../public/favicon.png", import.meta.url)),
    );
  await expect(page.getByText("favicon.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Next/ }).press("Enter");
  const generateFrames = page.getByRole("button", {
    name: /Generate logical frames/,
  });
  await expect(generateFrames).toBeVisible();
  await generateFrames.press("Enter");
  await expect(page.getByText("1 frames")).toBeVisible();

  for (const step of [
    "Clean up",
    "Align",
    "Calibrate",
    "Motions",
    "Test & Save",
  ]) {
    await page.getByRole("button", { name: step }).press("Enter");
  }
  await page.getByLabel("Companion name").fill("Keyboard Friend");
  await page
    .getByRole("button", { name: /Build and install companion/ })
    .press("Enter");
  await expect(
    page.getByText("Keyboard Friend", { exact: true }),
  ).toBeVisible();
});
