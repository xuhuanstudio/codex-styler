import {
  companionFromPackage,
  companionToPackage,
  exportCompanionPackage,
  importCompanionPackage,
  type CompanionDefinition,
  type CompanionPackage,
} from "@codex-styler/theme-core";
import { invoke } from "@tauri-apps/api/core";

export type CompanionAssetMap = Record<string, string>;

const databaseName = "codex-styler.v1";
const archiveStore = "companion-archives";
const companionIdHeader = "x-codex-styler-companion-id";

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
      reject(reader.error ?? new Error("Could not read companion archive"));
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
  throw new Error("Companion archive response did not contain binary data");
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 3);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("theme-archives")) {
        database.createObjectStore("theme-archives");
      }
      if (!database.objectStoreNames.contains(archiveStore)) {
        database.createObjectStore(archiveStore);
      }
      if (!database.objectStoreNames.contains("companion-project-files")) {
        database.createObjectStore("companion-project-files");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open companion storage"));
  });
}

async function saveArchive(companionId: string, archive: Blob): Promise<void> {
  if (isTauri()) {
    await invoke<void>("save_companion_archive", await blobBytes(archive), {
      headers: { [companionIdHeader]: companionId },
    });
    return;
  }
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readwrite");
    transaction.objectStore(archiveStore).put(archive, companionId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        transaction.error ?? new Error("Could not save companion package"),
      );
  });
  database.close();
}

async function loadArchive(companionId: string): Promise<Blob | null> {
  if (isTauri()) {
    const result = await invoke<
      ArrayBuffer | ArrayBufferView | Blob | number[]
    >("load_companion_archive", { companionId });
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
    const request = transaction.objectStore(archiveStore).get(companionId);
    request.onsuccess = () =>
      resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not load companion package"));
  });
  database.close();
  return archive;
}

export async function deleteCompanionArchive(
  companionId: string,
): Promise<void> {
  if (isTauri()) {
    await invoke("delete_companion_archive", { companionId });
    return;
  }
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(archiveStore, "readwrite");
    transaction.objectStore(archiveStore).delete(companionId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        transaction.error ?? new Error("Could not delete companion package"),
      );
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

export function createCompanionAssetMap(
  companionPackage: CompanionPackage,
): CompanionAssetMap {
  const assets: CompanionAssetMap = {};
  for (const asset of companionPackage.companion.assets) {
    const bytes = companionPackage.files.get(asset.path);
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
  if (!response.ok) throw new Error("Companion asset is unavailable: " + url);
  return new Uint8Array(await response.arrayBuffer());
}

export async function importCompanion(file: File): Promise<{
  companion: CompanionDefinition;
  assetMap: CompanionAssetMap;
}> {
  const companionPackage = await importCompanionPackage(file);
  await saveArchive(companionPackage.companion.id, file);
  return {
    companion: companionFromPackage(companionPackage.companion),
    assetMap: createCompanionAssetMap(companionPackage),
  };
}

export async function persistCompanion(
  companion: CompanionDefinition,
  files: Map<string, Uint8Array>,
): Promise<CompanionAssetMap> {
  const archive = await exportCompanionPackage(
    companionToPackage(companion),
    async (path) => {
      const bytes = files.get(path);
      if (!bytes) throw new Error("Missing generated companion asset: " + path);
      return bytes;
    },
  );
  await saveArchive(companion.id, archive);
  return createCompanionAssetMap(await importCompanionPackage(archive));
}

export async function exportCompanion(
  companion: CompanionDefinition,
  resolveAsset: (path: string) => string,
): Promise<void> {
  const archive = await exportCompanionPackage(
    companionToPackage(companion),
    (path) => fetchBytes(resolveAsset(path)),
  );
  const url = URL.createObjectURL(archive);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${companion.id}.codex-styler-companion`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function hydrateCompanionAssetMaps(
  companions: CompanionDefinition[],
): Promise<Record<string, CompanionAssetMap>> {
  const entries = await Promise.all(
    companions.map(async (companion) => {
      try {
        const archive = await loadArchive(companion.id);
        if (!archive) return null;
        const companionPackage = await importCompanionPackage(archive);
        return [
          companion.id,
          createCompanionAssetMap(companionPackage),
        ] as const;
      } catch (error) {
        console.warn(
          "Could not restore assets for companion",
          companion.id,
          error,
        );
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
