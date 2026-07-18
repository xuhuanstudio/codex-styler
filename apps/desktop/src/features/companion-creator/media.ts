import { atlasCellRect, naturalFileOrder } from "./calibration";
import type {
  AtlasSliceSettings,
  CleanupSettings,
  CompanionImportKind,
  FrameBounds,
} from "./model";
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

const VIDEO_EXTENSIONS_BY_MIME = new Map<string, ReadonlySet<string>>([
  ["video/mp4", new Set([".mp4", ".m4v"])],
  ["application/mp4", new Set([".mp4", ".m4v"])],
  ["video/x-m4v", new Set([".mp4", ".m4v"])],
  ["video/quicktime", new Set([".mov"])],
  ["video/x-quicktime", new Set([".mov"])],
  ["application/x-quicktime", new Set([".mov"])],
  ["video/webm", new Set([".webm"])],
]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function fileExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  return dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
}

function isVideoSource(file: File): boolean {
  const extension = fileExtension(file);
  return (
    file.type.toLowerCase().startsWith("video/") ||
    [...VIDEO_EXTENSIONS_BY_MIME.values()].some((extensions) =>
      extensions.has(extension),
    )
  );
}

function isImageSource(file: File): boolean {
  return (
    file.type.toLowerCase().startsWith("image/") ||
    IMAGE_EXTENSIONS.has(fileExtension(file))
  );
}

export function validateCreatorSourceFiles(
  files: File[],
  preferredKind?: CompanionImportKind,
): { kind: CompanionImportKind; files: File[] } {
  if (files.length === 0) throw new Error("Choose at least one source file");
  const kind =
    preferredKind ??
    (files.length === 1 && isVideoSource(files[0]!)
      ? "video"
      : files.length > 1
        ? "sequence"
        : "image");
  if (kind === "video") {
    if (files.length !== 1 || !isVideoSource(files[0]!)) {
      throw new Error("Video import accepts one MP4, M4V, MOV, or WebM file");
    }
    assertSupportedVideoSource(files[0]!);
    return { kind, files };
  }
  if (!files.every(isImageSource)) {
    throw new Error("Image sources must be PNG, JPEG, or WebP files");
  }
  if (kind !== "sequence" && files.length !== 1) {
    throw new Error("Static image and atlas import accept one image at a time");
  }
  if (files.length > CREATOR_INPUT_LIMITS.frameCount) {
    throw new Error("An image sequence can contain at most 512 files");
  }
  return { kind, files: naturalFileOrder(files) };
}

export function assertSupportedVideoSource(file: File): void {
  if (file.size > CREATOR_INPUT_LIMITS.videoBytes) {
    throw new Error("Video exceeds the 250 MiB creator limit");
  }
  const extension = fileExtension(file);
  const mime = file.type.toLowerCase();
  const allowedByMime = VIDEO_EXTENSIONS_BY_MIME.get(mime);
  const extensionAllowed = [...VIDEO_EXTENSIONS_BY_MIME.values()].some(
    (extensions) => extensions.has(extension),
  );
  if (!extensionAllowed) {
    throw new Error("Choose an MP4, M4V, MOV, or WebM video file");
  }
  if (
    mime &&
    mime !== "application/octet-stream" &&
    (!allowedByMime || !allowedByMime.has(extension))
  ) {
    throw new Error("The video file type does not match its extension");
  }
}

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
    const encode = (requestedType: string) =>
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, requestedType, quality);
      });
    return encode(type).then(async (blob) => {
      if (blob) return blob;
      const fallback = await encode("image/png");
      if (fallback) return fallback;
      throw new Error("The decoded frame could not be encoded locally");
    });
  }
  return canvas
    .convertToBlob({ type, quality })
    .catch(() => canvas.convertToBlob({ type: "image/png" }));
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

function mediaFailure(video: HTMLVideoElement, stage: string): Error {
  const code = video.error?.code;
  if (code === 1) {
    return new Error(`Video loading was interrupted during ${stage}`);
  }
  if (code === 2) {
    return new Error(`The local video file could not be read during ${stage}`);
  }
  if (code === 3) {
    return new Error(
      "The system video decoder rejected a frame. The file may be damaged or use an unsupported codec profile.",
    );
  }
  if (code === 4) {
    return new Error(
      "This system does not support the codec inside this video container.",
    );
  }
  return new Error(`The video failed while waiting for ${stage}`);
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  type: string,
  timeoutMs = 15_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(mediaFailure(video, type));
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Video loading timed out during ${type}`));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(type, onSuccess);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(type, onSuccess, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

async function waitForPresentedFrame(video: HTMLVideoElement): Promise<void> {
  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 750);
      video.requestVideoFrameCallback(() => {
        window.clearTimeout(timeout);
        resolve();
      });
    });
    return;
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function seekVideoFrame(
  video: HTMLVideoElement,
  timeSeconds: number,
): Promise<void> {
  const safeTime = Math.max(
    0,
    Math.min(timeSeconds, Math.max(0, video.duration - 0.001)),
  );
  if (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    Math.abs(video.currentTime - safeTime) < 0.0005
  ) {
    return;
  }
  const seeked = waitForVideoEvent(video, "seeked");
  video.currentTime = safeTime;
  await seeked;
}

function videoExtractionError(error: unknown, video: HTMLVideoElement): Error {
  if (video.error) return mediaFailure(video, "frame extraction");
  if (error instanceof Error) {
    if (
      /Video exceeds|Choose a|duration could not|no usable video track/u.test(
        error.message,
      )
    ) {
      return error;
    }
    if (/timed out/u.test(error.message)) {
      return new Error(
        `${error.message}. Try a shorter local file, or re-encode the source if playback also fails in the system player.`,
        { cause: error },
      );
    }
    if (/encoded locally/u.test(error.message)) {
      return new Error(
        "The video decoded successfully, but this system could not encode the extracted frame.",
        { cause: error },
      );
    }
    return new Error(`Video frame extraction failed: ${error.message}`, {
      cause: error,
    });
  }
  return new Error("Video frame extraction failed for an unknown reason");
}

export async function extractVideoFrames(
  file: File,
  options: { startMs: number; endMs: number; fps: number },
  onProgress?: (progress: number) => void,
): Promise<ExtractedFrame[]> {
  assertSupportedVideoSource(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const sourceUrl = URL.createObjectURL(file);
  try {
    const metadataReady = waitForVideoEvent(video, "loadedmetadata");
    const firstFrameReady = waitForVideoEvent(video, "loadeddata");
    // The value is a freshly created local blob: URL for an allowlisted video
    // File, never DOM text, markup, a remote URL, or package-controlled data.
    video.src = sourceUrl; // lgtm[js/xss-through-dom]
    video.load();
    await Promise.all([metadataReady, firstFrameReady]);
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("The video duration could not be read");
    }
    if (video.videoWidth < 1 || video.videoHeight < 1) {
      throw new Error("The file contains no usable video track");
    }
    if (
      video.videoWidth > CREATOR_INPUT_LIMITS.videoDimension ||
      video.videoHeight > CREATOR_INPUT_LIMITS.videoDimension
    ) {
      throw new Error("Video exceeds the supported 4K input size");
    }
    const maximumRange = CREATOR_INPUT_LIMITS.videoDurationSeconds * 1000;
    const startMs = Math.max(0, options.startMs);
    const decodedEndMs = Math.max(0, video.duration * 1000 - 1);
    const endMs = Math.min(decodedEndMs, options.endMs, startMs + maximumRange);
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
      await seekVideoFrame(video, timeMs / 1000);
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
    throw videoExtractionError(error, video);
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
