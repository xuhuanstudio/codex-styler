import {
  exportThemePackage,
  importThemePackage,
  type ThemeDefinition,
  type ThemePackage,
} from "@codex-styler/theme-core";
import { invoke } from "@tauri-apps/api/core";
import { themeAssetUrl } from "./assets";

export type ThemeAssetMap = Record<string, string>;

const databaseName = "codex-styler.v1";
const archiveStore = "theme-archives";
const themeIdHeader = "x-codex-styler-theme-id";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read theme archive"));
    reader.readAsArrayBuffer(blob);
  });
}

async function responseBytes(
  result: ArrayBuffer | ArrayBufferView | Blob | number[],
): Promise<Uint8Array> {
  if (result instanceof Blob) return blobBytes(result);
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (ArrayBuffer.isView(result)) {
    return new Uint8Array(
      result.buffer.slice(
        result.byteOffset,
        result.byteOffset + result.byteLength,
      ),
    );
  }
  if (Array.isArray(result)) return Uint8Array.from(result);
  throw new Error("Theme archive response did not contain binary data");
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!("indexedDB" in window)) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(archiveStore)) {
        database.createObjectStore(archiveStore);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open theme storage"));
  });
}

async function saveArchive(themeId: string, archive: Blob): Promise<void> {
  if (isTauri()) {
    await invoke<void>(
      "save_theme_archive",
      await blobBytes(archive),
      { headers: { [themeIdHeader]: themeId } },
    );
    return;
  }
  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readwrite");
    transaction.objectStore(archiveStore).put(archive, themeId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save theme package"));
  });
  database.close();
}

async function loadArchive(themeId: string): Promise<Blob | null> {
  if (isTauri()) {
    const result = await invoke<
      ArrayBuffer | ArrayBufferView | Blob | number[]
    >(
      "load_theme_archive",
      { themeId },
    );
    const bytes = await responseBytes(result);
    if (bytes.byteLength === 0) return null;
    return new Blob([Uint8Array.from(bytes).buffer], {
      type: "application/zip",
    });
  }
  const database = await openDatabase();
  if (!database) return null;

  const archive = await new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readonly");
    const request = transaction.objectStore(archiveStore).get(themeId);
    request.onsuccess = () =>
      resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not load theme package"));
  });
  database.close();
  return archive;
}

export async function deleteThemeArchive(themeId: string): Promise<void> {
  if (isTauri()) {
    await invoke("delete_theme_archive", { themeId });
    return;
  }
  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readwrite");
    transaction.objectStore(archiveStore).delete(themeId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not delete theme package"));
  });
  database.close();
}

function mimeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export function createThemeAssetMap(themePackage: ThemePackage): ThemeAssetMap {
  const assets: ThemeAssetMap = {};
  for (const asset of themePackage.theme.assets) {
    const bytes = themePackage.files.get(asset.path);
    if (!bytes) continue;
    const ownedBytes = Uint8Array.from(bytes);
    assets[asset.path] = URL.createObjectURL(
      new Blob([ownedBytes.buffer], { type: mimeForPath(asset.path) }),
    );
  }
  return assets;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Theme asset is unavailable: " + url);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function exportTheme(
  theme: ThemeDefinition,
  resolveAsset: (
    theme: ThemeDefinition,
    path: string,
  ) => string = themeAssetUrl,
): Promise<void> {
  const blob = await exportThemePackage(theme, (path) =>
    fetchBytes(resolveAsset(theme, path)),
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = theme.id.split(".").at(-1) + ".codex-styler-theme";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importTheme(
  file: File,
): Promise<{ themePackage: ThemePackage; assetMap: ThemeAssetMap }> {
  const themePackage = await importThemePackage(file);
  await saveArchive(themePackage.theme.id, file);
  return { themePackage, assetMap: createThemeAssetMap(themePackage) };
}

export async function persistThemeCopy(
  theme: ThemeDefinition,
  resolveAsset: (theme: ThemeDefinition, path: string) => string,
): Promise<ThemeAssetMap> {
  const archive = await exportThemePackage(theme, (path) =>
    fetchBytes(resolveAsset(theme, path)),
  );
  await saveArchive(theme.id, archive);
  return createThemeAssetMap(await importThemePackage(archive));
}

export async function persistGeneratedTheme(
  theme: ThemeDefinition,
  files: Map<string, Uint8Array>,
): Promise<ThemeAssetMap> {
  const archive = await exportThemePackage(theme, async (path) => {
    const bytes = files.get(path);
    if (!bytes) throw new Error("Missing generated theme asset: " + path);
    return bytes;
  });
  await saveArchive(theme.id, archive);
  return createThemeAssetMap(await importThemePackage(archive));
}

export async function hydrateThemeAssetMaps(
  themes: ThemeDefinition[],
): Promise<Record<string, ThemeAssetMap>> {
  const entries = await Promise.all(
    themes.map(async (theme) => {
      try {
        const archive = await loadArchive(theme.id);
        if (!archive) return null;
        const themePackage = await importThemePackage(archive);
        return [theme.id, createThemeAssetMap(themePackage)] as const;
      } catch (error) {
        console.warn("Could not restore assets for theme", theme.id, error);
        return null;
      }
    }),
  );

  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
