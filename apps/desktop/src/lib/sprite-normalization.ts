import type { SpriteAtlasRenderer } from "@codex-styler/theme-core";

export interface OpaqueBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AtlasAnalysis {
  frames: OpaqueBounds[];
  maxWidth: number;
  maxHeight: number;
}

const analysisCache = new WeakMap<
  HTMLImageElement,
  Map<string, AtlasAnalysis>
>();

function analysisKey(renderer: SpriteAtlasRenderer): string {
  return [
    renderer.columns,
    renderer.rows,
    renderer.frameWidth,
    renderer.frameHeight,
    renderer.directions,
    renderer.alphaThreshold ?? 24,
  ].join(":");
}

export function analyzeAtlasPixels(
  pixels: Uint8ClampedArray,
  atlasWidth: number,
  renderer: SpriteAtlasRenderer,
): AtlasAnalysis {
  const threshold = renderer.alphaThreshold ?? 24;
  const frames: OpaqueBounds[] = [];
  let maxWidth = 1;
  let maxHeight = 1;

  for (let frame = 0; frame < renderer.directions; frame += 1) {
    const frameX = (frame % renderer.columns) * renderer.frameWidth;
    const frameY = Math.floor(frame / renderer.columns) * renderer.frameHeight;
    let minX = renderer.frameWidth;
    let minY = renderer.frameHeight;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < renderer.frameHeight; y += 1) {
      for (let x = 0; x < renderer.frameWidth; x += 1) {
        const alpha = pixels[((frameY + y) * atlasWidth + frameX + x) * 4 + 3];
        if (alpha <= threshold) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const bounds =
      maxX >= minX && maxY >= minY
        ? {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
          }
        : {
            x: 0,
            y: 0,
            width: renderer.frameWidth,
            height: renderer.frameHeight,
          };
    frames.push(bounds);
    maxWidth = Math.max(maxWidth, bounds.width);
    maxHeight = Math.max(maxHeight, bounds.height);
  }

  return { frames, maxWidth, maxHeight };
}

export function drawSpriteFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  renderer: SpriteAtlasRenderer,
  frame: number,
  logicalWidth: number,
  logicalHeight: number,
): void {
  const pixelRatio = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.ceil(logicalWidth * pixelRatio);
  canvas.height = Math.ceil(logicalHeight * pixelRatio);
  canvas.style.width = logicalWidth + "px";
  canvas.style.height = logicalHeight + "px";
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, logicalWidth, logicalHeight);

  const normalizedFrame = frame % renderer.directions;
  const sourceX = (normalizedFrame % renderer.columns) * renderer.frameWidth;
  const sourceY =
    Math.floor(normalizedFrame / renderer.columns) * renderer.frameHeight;

  if ((renderer.normalization ?? "grounded") === "preserve") {
    context.drawImage(
      image,
      sourceX,
      sourceY,
      renderer.frameWidth,
      renderer.frameHeight,
      0,
      0,
      logicalWidth,
      logicalHeight,
    );
    return;
  }

  try {
    const key = analysisKey(renderer);
    let imageCache = analysisCache.get(image);
    if (!imageCache) {
      imageCache = new Map();
      analysisCache.set(image, imageCache);
    }
    let analysis = imageCache.get(key);
    if (!analysis) {
      const analysisCanvas = document.createElement("canvas");
      analysisCanvas.width = image.naturalWidth;
      analysisCanvas.height = image.naturalHeight;
      const analysisContext = analysisCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!analysisContext) throw new Error("Canvas analysis is unavailable");
      analysisContext.drawImage(image, 0, 0);
      analysis = analyzeAtlasPixels(
        analysisContext.getImageData(
          0,
          0,
          analysisCanvas.width,
          analysisCanvas.height,
        ).data,
        analysisCanvas.width,
        renderer,
      );
      imageCache.set(key, analysis);
    }
    const bounds = analysis.frames[normalizedFrame];
    const paddingX = logicalWidth * 0.04;
    const paddingTop = logicalHeight * 0.04;
    const paddingBottom = logicalHeight * 0.015;
    const scale = Math.min(
      (logicalWidth - paddingX * 2) / analysis.maxWidth,
      (logicalHeight - paddingTop - paddingBottom) / analysis.maxHeight,
    );
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    context.drawImage(
      image,
      sourceX + bounds.x,
      sourceY + bounds.y,
      bounds.width,
      bounds.height,
      (logicalWidth - width) / 2,
      logicalHeight - paddingBottom - height,
      width,
      height,
    );
  } catch {
    context.drawImage(
      image,
      sourceX,
      sourceY,
      renderer.frameWidth,
      renderer.frameHeight,
      0,
      0,
      logicalWidth,
      logicalHeight,
    );
  }
}
