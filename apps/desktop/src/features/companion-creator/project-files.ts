import { invoke } from "@tauri-apps/api/core";
import type { CompanionCreatorProject } from "./model";

const databaseName = "codex-styler.v1";
const storeName = "companion-project-files";
const browserIndexKey = "codex-styler.companion-project-index.v1";
const projectIdHeader = "x-codex-styler-project-id";
const projectPathHeader = "x-codex-styler-project-path";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 3);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of ["theme-archives", "companion-archives", storeName]) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open project storage"));
  });
}

function browserProjectIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(browserIndexKey) ?? "[]");
  } catch {
    return [];
  }
}

function rememberBrowserProject(projectId: string): void {
  const ids = new Set(browserProjectIds());
  ids.add(projectId);
  localStorage.setItem(browserIndexKey, JSON.stringify([...ids]));
}

async function writeFile(
  projectId: string,
  path: string,
  value: Blob | Uint8Array,
): Promise<void> {
  if (isTauri()) {
    const bytes =
      value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : value;
    await invoke<void>("save_companion_project_file", bytes, {
      headers: {
        [projectIdHeader]: projectId,
        [projectPathHeader]: path,
      },
    });
    return;
  }
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value, `${projectId}/${path}`);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save project file"));
  });
  database.close();
  rememberBrowserProject(projectId);
}

async function readFile(projectId: string, path: string): Promise<Blob | null> {
  if (isTauri()) {
    const result = await invoke<number[]>("load_companion_project_file", {
      projectId,
      projectPath: path,
    });
    if (result.length === 0) return null;
    return new Blob([Uint8Array.from(result).buffer]);
  }
  const database = await openDatabase();
  if (!database) return null;
  const result = await new Promise<Blob | Uint8Array | null>(
    (resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction
        .objectStore(storeName)
        .get(`${projectId}/${path}`);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load project file"));
    },
  );
  database.close();
  if (!result) return null;
  return result instanceof Blob
    ? result
    : new Blob([Uint8Array.from(result).buffer]);
}

function extensionFor(file: File): string {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  return extension && /^[a-z0-9]{1,8}$/u.test(extension) ? extension : "bin";
}

export async function saveCompanionProject(
  project: CompanionCreatorProject,
  sourceFiles?: File[],
): Promise<CompanionCreatorProject> {
  const saved = structuredClone(project);
  saved.updatedAt = new Date().toISOString();
  if (saved.source && sourceFiles) {
    for (const [index, file] of sourceFiles.entries()) {
      const storedPath = `sources/source-${String(index + 1).padStart(3, "0")}.${extensionFor(file)}`;
      await writeFile(saved.id, storedPath, file);
      if (saved.source.files[index]) {
        saved.source.files[index]!.storedPath = storedPath;
      }
    }
  }
  await writeFile(
    saved.id,
    "project.json",
    new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" }),
  );
  return saved;
}

export async function loadCompanionProject(
  projectId: string,
): Promise<CompanionCreatorProject | null> {
  const blob = await readFile(projectId, "project.json");
  if (!blob) return null;
  return JSON.parse(await blob.text()) as CompanionCreatorProject;
}

export async function loadCompanionProjectSource(
  projectId: string,
  storedPath: string,
): Promise<Blob | null> {
  return readFile(projectId, storedPath);
}

export async function listCompanionProjects(): Promise<
  CompanionCreatorProject[]
> {
  const ids = isTauri()
    ? await invoke<string[]>("list_companion_projects")
    : browserProjectIds();
  const projects = await Promise.all(ids.map(loadCompanionProject));
  return projects
    .filter((project): project is CompanionCreatorProject => project !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteCompanionProject(projectId: string): Promise<void> {
  if (isTauri()) {
    await invoke("delete_companion_project", { projectId });
    return;
  }
  const database = await openDatabase();
  if (database) {
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Could not enumerate project files"));
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      for (const key of keys) {
        if (String(key).startsWith(`${projectId}/`)) {
          transaction.objectStore(storeName).delete(key);
        }
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not delete project"));
    });
    database.close();
  }
  localStorage.setItem(
    browserIndexKey,
    JSON.stringify(browserProjectIds().filter((id) => id !== projectId)),
  );
}
