import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { themeAssetUrl } from "./assets";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));

import {
  hydrateThemeAssetMaps,
  persistGeneratedTheme,
} from "./theme-files";

function themeWithoutAssets(): ThemeDefinition {
  const theme = structuredClone(builtinThemes[0]);
  theme.id = "local.storage-roundtrip";
  delete theme.metadata.preview;
  theme.assets = [];
  return theme;
}

describe("desktop theme persistence", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
  });

  it("stores and restores archives through the Tauri binary IPC path", async () => {
    let stored = new Uint8Array();
    invokeMock.mockImplementation(
      async (
        command: string,
        argumentsValue?: unknown,
        options?: { headers?: Record<string, string> },
      ) => {
        if (command === "save_theme_archive") {
          expect(argumentsValue).toBeInstanceOf(Uint8Array);
          expect(options?.headers?.["x-codex-styler-theme-id"]).toBe(
            "local.storage-roundtrip",
          );
          stored = Uint8Array.from(argumentsValue as Uint8Array);
          return undefined;
        }
        if (command === "load_theme_archive") {
          return Uint8Array.from(stored).buffer;
        }
        throw new Error("Unexpected command: " + command);
      },
    );

    const theme = themeWithoutAssets();
    await persistGeneratedTheme(theme, new Map());
    const maps = await hydrateThemeAssetMaps([theme]);

    expect(stored.byteLength).toBeGreaterThan(0);
    expect(maps).toEqual({ [theme.id]: {} });
  });

  it("restores archive responses exposed as WebKit blobs", async () => {
    let stored = new Uint8Array();
    invokeMock.mockImplementation(async (command: string, value?: unknown) => {
      if (command === "save_theme_archive") {
        stored = Uint8Array.from(value as Uint8Array);
        return undefined;
      }
      if (command === "load_theme_archive") {
        return new Blob([Uint8Array.from(stored).buffer]);
      }
      throw new Error("Unexpected command: " + command);
    });

    const theme = themeWithoutAssets();
    await persistGeneratedTheme(theme, new Map());

    await expect(hydrateThemeAssetMaps([theme])).resolves.toEqual({
      [theme.id]: {},
    });
  });

  it("recovers bundled assets for local and legacy refined-theme copies", () => {
    const local = structuredClone(builtinThemes[2]);
    local.id = "local.quiet-garden-copy";
    expect(themeAssetUrl(local, "assets/quiet-garden.webp")).toBe(
      "/themes/quiet-garden/assets/quiet-garden.webp",
    );

    local.id = "codex-styler.quiet-garden-companion";
    expect(themeAssetUrl(local, "assets/moss-gecko-atlas-v2.png")).toBe(
      "/themes/quiet-garden/assets/moss-gecko-atlas-v2.png",
    );
  });
});
