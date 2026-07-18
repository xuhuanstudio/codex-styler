import { invoke } from "@tauri-apps/api/core";

function responseBytes(
  result: ArrayBuffer | ArrayBufferView | Blob | number[],
): Uint8Array {
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (ArrayBuffer.isView(result)) {
    return new Uint8Array(
      result.buffer.slice(
        result.byteOffset,
        result.byteOffset + result.byteLength,
      ),
    );
  }
  if (result instanceof Blob) {
    throw new Error("Dropped source returned an unexpected Blob response");
  }
  if (Array.isArray(result)) return Uint8Array.from(result);
  throw new Error("Dropped source did not contain binary data");
}

function fileName(path: string): string {
  return path.split(/[\\/]/u).at(-1) ?? "source";
}

function mimeType(path: string): string {
  const extension = path.split(".").at(-1)?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "mov") return "video/quicktime";
  if (extension === "webm") return "video/webm";
  if (extension === "m4v") return "video/x-m4v";
  if (extension === "mp4") return "video/mp4";
  return "application/octet-stream";
}

export async function filesFromDroppedPaths(paths: string[]): Promise<File[]> {
  const files: File[] = [];
  for (const path of paths) {
    const result = await invoke<
      ArrayBuffer | ArrayBufferView | Blob | number[]
    >("read_creator_source_file", { path });
    const bytes = responseBytes(result);
    files.push(
      new File([Uint8Array.from(bytes).buffer], fileName(path), {
        type: mimeType(path),
      }),
    );
  }
  return files;
}
