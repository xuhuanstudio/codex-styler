import {
  exportThemePackage,
  importThemePackage,
  type ThemeDefinition,
  type ThemePackage,
} from "@codex-styler/theme-core";
import { themeAssetUrl } from "./assets";

export type ThemeAssetMap = Record<string, string>;

const databaseName = "codex-styler.v1";
const archiveStore = "theme-archives";

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
    request.onerror = () => reject(request.error ?? new Error("Could not open theme storage"));
  });
}

async function saveArchive(themeId: string, archive: Blob): Promise<void> {
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
  const database = await openDatabase();
  if (!database) return null;

  const archive = await new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readonly");
    const request = transaction.objectStore(archiveStore).get(themeId);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not load theme package"));
  });
  database.close();
  return archive;
}

export async function deleteThemeArchive(themeId: string): Promise<void> {
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
  if (!response.ok) throw new Error("Could not load " + url);
  return new Uint8Array(await response.arrayBuffer());
}

export async function exportTheme(
  theme: ThemeDefinition,
  resolveAsset: (theme: ThemeDefinition, path: string) => string = themeAssetUrl,
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
