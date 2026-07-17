import { atlasCellRect, naturalFileOrder } from "./calibration";
import type { AtlasSliceSettings, CleanupSettings, FrameBounds } from "./model";
import {
  applyCleanupPixels,
  retainLargestAlphaComponent as retainLargestAlphaComponentBuffer,
} from "./pixel-processing";

export { mattePixel } from "./pixel-processing";

export const CREATOR_INPUT_LIMITS = {
  videoBytes: 250 * 1024 * 1024,
  videoDurationSeconds: 30,
  videoDimension: 3840,
  frameCount: 512,
} as const;

export interface ExtractedFrame {
  id: string;
  sourceIndex: number;
  sourceTimeMs?: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

function canvasBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type = "image/webp",
  quality = 0.94,
): Promise<Blob> {
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Could not encode frame")),
        type,
        quality,
      );
    });
  }
  return canvas.convertToBlob({ type, quality });
}

async function frameFromBitmap(
  bitmap: ImageBitmap,
  sourceIndex: number,
  sourceTimeMs?: number,
  crop?: FrameBounds,
): Promise<ExtractedFrame> {
  const target = crop ?? {
    x: 0,
    y: 0,
    width: bitmap.width,
    height: bitmap.height,
  };
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(target.width));
  canvas.height = Math.max(1, Math.round(target.height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(
    bitmap,
    target.x,
    target.y,
    target.width,
    target.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await canvasBlob(canvas);
  return {
    id: `frame-${sourceIndex}`,
    sourceIndex,
    sourceTimeMs,
    blob,
    url: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function extractImageFrames(
  files: File[],
): Promise<ExtractedFrame[]> {
  const ordered = naturalFileOrder(files).slice(
    0,
    CREATOR_INPUT_LIMITS.frameCount,
  );
  return Promise.all(
    ordered.map(async (file, index) => {
      const bitmap = await createImageBitmap(file);
      try {
        return await frameFromBitmap(bitmap, index);
      } finally {
        bitmap.close();
      }
    }),
  );
}

export async function sliceAtlas(
  file: File | Blob,
  settings: AtlasSliceSettings,
): Promise<ExtractedFrame[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const count = Math.min(
      settings.columns * settings.rows,
      CREATOR_INPUT_LIMITS.frameCount,
    );
    const output: ExtractedFrame[] = [];
    for (let index = 0; index < count; index += 1) {
      const rect = atlasCellRect(index, settings);
      if (
        rect.x < 0 ||
        rect.y < 0 ||
        rect.x + rect.width > bitmap.width ||
        rect.y + rect.height > bitmap.height
      ) {
        continue;
      }
      output.push(await frameFromBitmap(bitmap, index, undefined, rect));
    }
    return output;
  } finally {
    bitmap.close();
  }
}

function waitForEvent(target: EventTarget, type: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Media failed while waiting for ${type}`));
    };
    const cleanup = () => {
      target.removeEventListener(type, onSuccess);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(type, onSuccess, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

async function waitForPresentedFrame(video: HTMLVideoElement): Promise<void> {
  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise<void>((resolve) => {
      video.requestVideoFrameCallback(() => resolve());
    });
    return;
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function extractVideoFrames(
  file: File,
  options: { startMs: number; endMs: number; fps: number },
  onProgress?: (progress: number) => void,
): Promise<ExtractedFrame[]> {
  if (file.size > CREATOR_INPUT_LIMITS.videoBytes) {
    throw new Error("Video exceeds the 250 MiB creator limit");
  }
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;
  try {
    await waitForEvent(video, "loadedmetadata");
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error(
        "The video duration could not be read. Convert it to MP4 H.264.",
      );
    }
    if (
      video.videoWidth > CREATOR_INPUT_LIMITS.videoDimension ||
      video.videoHeight > CREATOR_INPUT_LIMITS.videoDimension
    ) {
      throw new Error("Video exceeds the supported 4K input size");
    }
    const maximumRange = CREATOR_INPUT_LIMITS.videoDurationSeconds * 1000;
    const startMs = Math.max(0, options.startMs);
    const endMs = Math.min(
      video.duration * 1000,
      options.endMs,
      startMs + maximumRange,
    );
    if (endMs <= startMs) throw new Error("Choose a non-empty video range");
    const count = Math.min(
      CREATOR_INPUT_LIMITS.frameCount,
      Math.max(1, Math.floor(((endMs - startMs) / 1000) * options.fps) + 1),
    );
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    const output: ExtractedFrame[] = [];
    for (let index = 0; index < count; index += 1) {
      const timeMs =
        count === 1
          ? startMs
          : startMs + ((endMs - startMs) * index) / (count - 1);
      const seeked = waitForEvent(video, "seeked");
      video.currentTime = timeMs / 1000;
      await seeked;
      await waitForPresentedFrame(video);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0);
      const blob = await canvasBlob(canvas);
      output.push({
        id: `frame-${index}`,
        sourceIndex: index,
        sourceTimeMs: timeMs,
        blob,
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height,
      });
      onProgress?.((index + 1) / count);
    }
    return output;
  } catch (error) {
    if (
      error instanceof Error &&
      /Video exceeds|Choose a|duration/u.test(error.message)
    ) {
      throw error;
    }
    throw new Error(
      "This video could not be decoded locally. Convert it to MP4 H.264 and try again.",
      { cause: error },
    );
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

export function retainLargestAlphaComponent(image: ImageData): void {
  retainLargestAlphaComponentBuffer(image);
}

let cleanupWorker: Worker | null = null;
let cleanupRequest = 0;
const cleanupPending = new Map<
  number,
  {
    resolve: (data: Uint8ClampedArray) => void;
    reject: (error: Error) => void;
  }
>();

function workerCleanup(
  image: ImageData,
  settings: CleanupSettings,
): Promise<Uint8ClampedArray> | null {
  if (typeof Worker === "undefined") return null;
  try {
    cleanupWorker ??= new Worker(
      new URL("./processing.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
  } catch {
    return null;
  }
  cleanupWorker.onmessage = (
    event: MessageEvent<{
      id: number;
      data?: Uint8ClampedArray;
      error?: string;
    }>,
  ) => {
    const pending = cleanupPending.get(event.data.id);
    if (!pending) return;
    cleanupPending.delete(event.data.id);
    if (event.data.error || !event.data.data) {
      pending.reject(
        new Error(event.data.error ?? "Worker returned no pixel data"),
      );
    } else {
      pending.resolve(event.data.data);
    }
  };
  cleanupWorker.onerror = () => {
    for (const pending of cleanupPending.values()) {
      pending.reject(new Error("Background cleanup worker failed"));
    }
    cleanupPending.clear();
    cleanupWorker?.terminate();
    cleanupWorker = null;
  };
  const id = ++cleanupRequest;
  const data = new Uint8ClampedArray(image.data);
  const result = new Promise<Uint8ClampedArray>((resolve, reject) => {
    cleanupPending.set(id, { resolve, reject });
  });
  cleanupWorker.postMessage(
    {
      id,
      data,
      width: image.width,
      height: image.height,
      settings: {
        sampledColor: settings.sampledColor,
        tolerance: settings.tolerance,
        feather: settings.feather,
        despill: settings.despill,
        connectedSubject: settings.connectedSubject,
      },
    },
    [data.buffer],
  );
  return result;
}

async function cleanupPixels(
  image: ImageData,
  settings: CleanupSettings,
): Promise<Uint8ClampedArray> {
  const workerResult = workerCleanup(image, settings);
  if (workerResult) return workerResult;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  return applyCleanupPixels(
    {
      data: new Uint8ClampedArray(image.data),
      width: image.width,
      height: image.height,
    },
    settings,
  ).data;
}

export async function cleanFrame(
  frame: ExtractedFrame,
  settings: CleanupSettings,
): Promise<ExtractedFrame> {
  if (
    settings.mode === "preserve-alpha" &&
    settings.cornerMasks.length === 0 &&
    settings.strokes.length === 0
  ) {
    return frame;
  }
  const bitmap = await createImageBitmap(frame.blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(bitmap, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  if (settings.mode === "sampled-color") {
    image.data.set(await cleanupPixels(image, settings));
    context.putImageData(image, 0, 0);
  }
  context.save();
  for (const stroke of settings.strokes) {
    if (stroke.frame !== "all" && stroke.frame !== frame.sourceIndex) continue;
    if (stroke.mode !== "erase") continue;
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = stroke.radius * 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    for (const [index, point] of stroke.points.entries()) {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  const keepStrokes = settings.strokes.filter(
    (stroke) =>
      stroke.mode === "keep" &&
      (stroke.frame === "all" || stroke.frame === frame.sourceIndex),
  );
  if (keepStrokes.length > 0) {
    const restore = document.createElement("canvas");
    const keepMask = document.createElement("canvas");
    restore.width = canvas.width;
    restore.height = canvas.height;
    keepMask.width = canvas.width;
    keepMask.height = canvas.height;
    const restoreContext = restore.getContext("2d");
    const maskContext = keepMask.getContext("2d");
    if (!restoreContext || !maskContext) {
      throw new Error("Canvas 2D is unavailable");
    }
    restoreContext.drawImage(bitmap, 0, 0);
    for (const stroke of keepStrokes) {
      maskContext.lineWidth = stroke.radius * 2;
      maskContext.lineCap = "round";
      maskContext.lineJoin = "round";
      maskContext.strokeStyle = "white";
      maskContext.beginPath();
      for (const [index, point] of stroke.points.entries()) {
        if (index === 0) maskContext.moveTo(point.x, point.y);
        else maskContext.lineTo(point.x, point.y);
      }
      maskContext.stroke();
    }
    restoreContext.globalCompositeOperation = "destination-in";
    restoreContext.drawImage(keepMask, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.drawImage(restore, 0, 0);
  }
  context.globalCompositeOperation = "destination-out";
  for (const mask of settings.cornerMasks) {
    const x = mask.corner.includes("right") ? canvas.width - mask.width : 0;
    const y = mask.corner.includes("bottom") ? canvas.height - mask.height : 0;
    context.fillRect(x, y, mask.width, mask.height);
  }
  context.restore();
  bitmap.close();
  const blob = await canvasBlob(canvas);
  return {
    ...frame,
    blob,
    url: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function sampleFrameColor(
  frame: ExtractedFrame,
  point: { x: number; y: number },
): Promise<string> {
  const bitmap = await createImageBitmap(frame.blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const x = Math.max(0, Math.min(canvas.width - 1, Math.round(point.x)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.round(point.y)));
  const [red = 255, green = 255, blue = 255] = context.getImageData(
    x,
    y,
    1,
    1,
  ).data;
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function alphaBounds(
  frame: ExtractedFrame,
): Promise<FrameBounds | null> {
  const bitmap = await createImageBitmap(frame.blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width;
  let top = canvas.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3]! < 12) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left
    ? null
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/** A low-resolution perceptual delta used only to weight anchor interpolation. */
export async function measureVisualDeltas(
  frames: ExtractedFrame[],
): Promise<number[]> {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  const deltas: number[] = [];
  let previous: Uint8ClampedArray | null = null;
  for (const frame of frames) {
    const bitmap = await createImageBitmap(frame.blob);
    context.clearRect(0, 0, size, size);
    context.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();
    const current = context.getImageData(0, 0, size, size).data;
    if (!previous) {
      deltas.push(0);
    } else {
      let total = 0;
      for (let offset = 0; offset < current.length; offset += 4) {
        const alpha =
          Math.max(current[offset + 3]!, previous[offset + 3]!) / 255;
        total +=
          (Math.abs(current[offset]! - previous[offset]!) +
            Math.abs(current[offset + 1]! - previous[offset + 1]!) +
            Math.abs(current[offset + 2]! - previous[offset + 2]!)) *
            alpha +
          Math.abs(current[offset + 3]! - previous[offset + 3]!) * 1.5;
      }
      deltas.push(Math.max(0.0001, total / (size * size * 4)));
    }
    previous = new Uint8ClampedArray(current);
  }
  return deltas;
}
