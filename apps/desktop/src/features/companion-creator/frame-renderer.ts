import type { ExtractedFrame } from "./media";
import type { FrameBounds, LogicalFrame } from "./model";
import type { PixelBuffer } from "./pixel-processing";

/**
 * Draws the exact logical frame composition used by the package compiler.
 * Preview diagnostics call the same function so quality checks never drift
 * from the pixels that will be exported.
 */
export function drawLogicalFrame(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  logical: LogicalFrame,
  crop: FrameBounds,
  groundLine: number | null,
  contentScale: number,
  destinationX: number,
  destinationY: number,
  destinationWidth: number,
  destinationHeight: number,
): void {
  const pivotX = crop.x + crop.width / 2;
  const pivotY = groundLine ?? crop.y + crop.height;
  context.save();
  context.beginPath();
  context.rect(destinationX, destinationY, destinationWidth, destinationHeight);
  context.clip();
  context.translate(destinationX, destinationY);
  context.scale(destinationWidth / crop.width, destinationHeight / crop.height);
  context.translate(-crop.x, -crop.y);
  context.translate(pivotX, pivotY);
  context.scale(contentScale, contentScale);
  context.translate(-pivotX, -pivotY);
  context.translate(logical.baselineOffset.x, logical.baselineOffset.y);
  context.drawImage(bitmap, 0, 0);
  context.restore();
}

export async function renderLogicalFramePixels(
  frame: ExtractedFrame,
  logical: LogicalFrame,
  crop: FrameBounds,
  groundLine: number | null,
  contentScale: number,
  maximumDimension = 512,
): Promise<PixelBuffer> {
  const scale = Math.min(
    1,
    maximumDimension / crop.width,
    maximumDimension / crop.height,
  );
  const width = Math.max(1, Math.ceil(crop.width * scale));
  const height = Math.max(1, Math.ceil(crop.height * scale));
  const bitmap = await createImageBitmap(frame.blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D is unavailable");
    drawLogicalFrame(
      context,
      bitmap,
      logical,
      crop,
      groundLine,
      contentScale,
      0,
      0,
      width,
      height,
    );
    const image = context.getImageData(0, 0, width, height);
    return { data: image.data, width, height };
  } finally {
    bitmap.close();
  }
}
