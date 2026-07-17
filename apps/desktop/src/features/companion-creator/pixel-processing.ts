import type { CleanupSettings } from "./model";

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function hexColor(value: string): [number, number, number] {
  const normalized = value.replace(/^#/u, "");
  if (!/^[0-9a-f]{6}$/iu.test(normalized)) return [255, 255, 255];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function mattePixel(
  pixel: [number, number, number, number],
  background: [number, number, number],
  settings: Pick<CleanupSettings, "tolerance" | "feather" | "despill">,
): [number, number, number, number] {
  const [red, green, blue, alpha] = pixel;
  const distance = Math.sqrt(
    (red - background[0]) ** 2 +
      (green - background[1]) ** 2 +
      (blue - background[2]) ** 2,
  );
  const threshold = settings.tolerance * 2.55;
  const feather = Math.max(1, settings.feather * 2.55);
  const opacity = Math.max(0, Math.min(1, (distance - threshold) / feather));
  const spill = (1 - opacity) * (settings.despill / 100);
  return [
    Math.max(0, Math.min(255, Math.round(red + (red - background[0]) * spill))),
    Math.max(
      0,
      Math.min(255, Math.round(green + (green - background[1]) * spill)),
    ),
    Math.max(
      0,
      Math.min(255, Math.round(blue + (blue - background[2]) * spill)),
    ),
    Math.round(alpha * opacity),
  ];
}

export function retainLargestAlphaComponent(buffer: PixelBuffer): void {
  const { width, height, data } = buffer;
  const visited = new Uint8Array(width * height);
  let largest: number[] = [];
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const;
  for (let seed = 0; seed < width * height; seed += 1) {
    if (visited[seed] || data[seed * 4 + 3]! < 12) continue;
    const component: number[] = [];
    const queue = [seed];
    visited[seed] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]!;
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (visited[next] || data[next * 4 + 3]! < 12) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(width * height);
  for (const index of largest) keep[index] = 1;
  for (let index = 0; index < width * height; index += 1) {
    if (!keep[index]) data[index * 4 + 3] = 0;
  }
}

export function applyCleanupPixels(
  buffer: PixelBuffer,
  settings: Pick<
    CleanupSettings,
    "sampledColor" | "tolerance" | "feather" | "despill" | "connectedSubject"
  >,
): PixelBuffer {
  const background = hexColor(settings.sampledColor);
  for (let offset = 0; offset < buffer.data.length; offset += 4) {
    const result = mattePixel(
      [
        buffer.data[offset]!,
        buffer.data[offset + 1]!,
        buffer.data[offset + 2]!,
        buffer.data[offset + 3]!,
      ],
      background,
      settings,
    );
    buffer.data.set(result, offset);
  }
  if (settings.connectedSubject) retainLargestAlphaComponent(buffer);
  return buffer;
}
