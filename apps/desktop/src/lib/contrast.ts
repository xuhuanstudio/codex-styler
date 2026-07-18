type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  return [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  ) as Rgb;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex(rgb: Rgb): string {
  return (
    "#" +
    rgb
      .map((value) => clampChannel(value).toString(16).padStart(2, "0"))
      .join("")
  );
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: Rgb): number {
  return (
    0.2126 * channel(rgb[0]) +
    0.7152 * channel(rgb[1]) +
    0.0722 * channel(rgb[2])
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(hexToRgb(foreground));
  const second = luminance(hexToRgb(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function mixColors(from: string, to: string, amount: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const progress = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    start.map((value, index) => value + (end[index] - value) * progress) as Rgb,
  );
}

export function compositeColor(
  foreground: string,
  background: string,
  opacity: number,
): string {
  return mixColors(background, foreground, opacity);
}

export function adjustBrightness(color: string, brightness: number): string {
  return rgbToHex(
    hexToRgb(color).map((value) => value * Math.max(0, brightness)) as Rgb,
  );
}

export function minimumContrast(
  foreground: string,
  backgrounds: string[],
): number {
  return Math.min(
    ...backgrounds.map((background) => contrastRatio(foreground, background)),
  );
}

/**
 * Preserves an authored text color whenever possible. If it is unsafe, the
 * color moves only as far as necessary toward a quiet neutral. This avoids the
 * abrupt black/white snapping that makes image-backed themes feel unrelated to
 * their authored palette.
 */
export function adaptiveReadableColor(
  preferred: string,
  backgrounds: string | string[],
  minimum = 4.5,
): string {
  const samples = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
  if (minimumContrast(preferred, samples) >= minimum) return preferred;

  const anchors = ["#151515", "#f7f7f5", "#000000", "#ffffff", "#767676"];
  const candidates = anchors
    .filter((anchor) => minimumContrast(anchor, samples) >= minimum)
    .map((anchor) => {
      let low = 0;
      let high = 1;
      for (let iteration = 0; iteration < 18; iteration += 1) {
        const middle = (low + high) / 2;
        if (
          minimumContrast(mixColors(preferred, anchor, middle), samples) >=
          minimum
        ) {
          high = middle;
        } else {
          low = middle;
        }
      }
      return { color: mixColors(preferred, anchor, high), change: high };
    })
    .sort((left, right) => left.change - right.change);

  if (candidates[0]) return candidates[0].color;

  // A single flat foreground cannot always satisfy arbitrary imagery. Return
  // the neutral with the strongest worst-case contrast; surface guards then
  // increase opacity until the requested ratio becomes achievable.
  let best = preferred;
  let bestRatio = minimumContrast(preferred, samples);
  for (let value = 0; value <= 255; value += 1) {
    const gray = rgbToHex([value, value, value]);
    const ratio = minimumContrast(gray, samples);
    if (ratio > bestRatio) {
      best = gray;
      bestRatio = ratio;
    }
  }
  return best;
}

export function readableColor(
  preferred: string,
  background: string,
  minimum = 4.5,
): string {
  return adaptiveReadableColor(preferred, background, minimum);
}
