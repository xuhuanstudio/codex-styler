#!/usr/bin/env python3
"""Build calibrated, high-quality sprite-atlas pages from a companion video."""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


DEFAULT_CARDINAL_FRAMES = "24:0,72:90,108:180,150:270,204:360"
PAGE_COLUMNS = 8
PAGE_ROWS = 6
PAGE_CAPACITY = PAGE_COLUMNS * PAGE_ROWS


def binary_dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    """Fast square dilation for boolean masks without optional CV packages."""
    if radius <= 0:
        return mask.astype(bool, copy=True)
    padded = np.pad(mask.astype(np.uint8), radius, mode="constant")
    integral = np.pad(padded, ((1, 0), (1, 0)), mode="constant")
    integral = integral.cumsum(axis=0, dtype=np.int32).cumsum(axis=1, dtype=np.int32)
    size = radius * 2 + 1
    window_sum = (
        integral[size:, size:]
        - integral[:-size, size:]
        - integral[size:, :-size]
        + integral[:-size, :-size]
    )
    return window_sum > 0


def minimum_filter_3(values: np.ndarray) -> np.ndarray:
    padded = np.pad(values, 1, mode="edge")
    return np.minimum.reduce(
        [
            padded[y : y + values.shape[0], x : x + values.shape[1]]
            for y in range(3)
            for x in range(3)
        ]
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--slug", default="moss-chameleon")
    parser.add_argument("--display-name", default="Moss")
    parser.add_argument("--cardinal-frames", default=DEFAULT_CARDINAL_FRAMES)
    parser.add_argument(
        "--source-order",
        default="",
        help="Ordered inclusive source ranges, for example 48-108,28-48",
    )
    parser.add_argument(
        "--cardinal-positions",
        default="",
        help="Cardinal anchors by position in --source-order, for example 0:0,20:90,...",
    )
    parser.add_argument(
        "--chroma-key",
        default="magenta",
        help="magenta, auto, or a #RRGGBB color",
    )
    parser.add_argument("--matte-low", type=float, default=12.0)
    parser.add_argument("--matte-high", type=float, default=42.0)
    parser.add_argument("--safe-left-ratio", type=float, default=0.18)
    parser.add_argument("--safe-right-ratio", type=float, default=0.78)
    parser.add_argument("--close-loop-with-first", action="store_true")
    parser.add_argument("--exclude-frames", default="")
    parser.add_argument("--watermark-template", type=Path)
    parser.add_argument(
        "--watermark-corners",
        default="",
        help="Comma-separated corner names excluded by the shared crop",
    )
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "ffmpeg")
    return parser.parse_args()


def parse_cardinal_frames(value: str) -> tuple[tuple[int, float], ...]:
    anchors = tuple(
        (int(frame), float(angle))
        for item in value.split(",")
        for frame, angle in [item.split(":", 1)]
    )
    if len(anchors) < 2:
        raise ValueError("At least two cardinal frame anchors are required")
    if anchors[0][1] != 0.0 or anchors[-1][1] != 360.0:
        raise ValueError("Cardinal frame anchors must span 0 through 360 degrees")
    if any(a[0] >= b[0] or a[1] >= b[1] for a, b in zip(anchors, anchors[1:])):
        raise ValueError("Cardinal frame anchors must increase by frame and angle")
    return anchors


def parse_excluded_frames(value: str) -> set[int]:
    excluded: set[int] = set()
    for item in filter(None, (part.strip() for part in value.split(","))):
        if "-" in item:
            start, end = (int(part) for part in item.split("-", 1))
            if start > end:
                raise ValueError("Excluded frame ranges must increase")
            excluded.update(range(start, end + 1))
        else:
            excluded.add(int(item))
    return excluded


def parse_source_order(value: str, frame_count: int) -> list[int]:
    ordered: list[int] = []
    for item in filter(None, (part.strip() for part in value.split(","))):
        if "-" in item:
            start, end = (int(part) for part in item.split("-", 1))
            step = 1 if end >= start else -1
            ordered.extend(range(start, end + step, step))
        else:
            ordered.append(int(item))
    if not ordered:
        raise ValueError("--source-order must contain at least one frame")
    if min(ordered) < 0 or max(ordered) >= frame_count:
        raise ValueError(
            f"--source-order must stay inside the {frame_count}-frame source"
        )
    return ordered


def parse_color(value: str) -> np.ndarray:
    normalized = value.strip().lstrip("#")
    if len(normalized) != 6:
        raise ValueError("A chroma color must use #RRGGBB")
    try:
        return np.array(
            [int(normalized[index : index + 2], 16) for index in (0, 2, 4)],
            dtype=np.float32,
        )
    except ValueError as error:
        raise ValueError("A chroma color must use #RRGGBB") from error


def estimate_chroma_key(images: list[Image.Image]) -> np.ndarray:
    samples: list[np.ndarray] = []
    stride = max(1, len(images) // 12)
    for image in images[::stride]:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
        height, width = rgb.shape[:2]
        band_y = max(8, height // 12)
        band_x = max(8, width // 12)
        samples.extend(
            (
                rgb[:band_y].reshape(-1, 3),
                rgb[-band_y:].reshape(-1, 3),
                rgb[:, :band_x].reshape(-1, 3),
                rgb[:, -band_x:].reshape(-1, 3),
            )
        )
    return np.median(np.concatenate(samples, axis=0), axis=0).astype(np.float32)


def extract_frames(video: Path, directory: Path, ffmpeg: str) -> list[Path]:
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(video),
            "-map",
            "0:v:0",
            "-vsync",
            "0",
            str(directory / "%04d.png"),
        ],
        check=True,
    )
    return sorted(directory.glob("*.png"))


def chroma_matte(rgb: np.ndarray) -> tuple[np.ndarray, bool]:
    values = rgb.astype(np.float32)
    magenta_excess = np.minimum(values[..., 0], values[..., 2]) - values[..., 1]
    alpha = np.clip((68.0 - magenta_excess) / 36.0, 0.0, 1.0)
    adaptive_key = False

    # Some generated clips use the same magenta hue at a much lower
    # saturation. In those clips a fixed threshold mistakes the whole plate
    # for translucent foreground. Estimate the key strength from border-only
    # pixels and fall back to a relative matte when there is no useful clear
    # region. The subject is always centered; the sampled right strip stops
    # before the generator watermark.
    if float(np.mean(alpha < 0.07)) < 0.30:
        adaptive_key = True
        height, width = magenta_excess.shape
        border_samples = np.concatenate(
            (
                magenta_excess[: max(8, height // 12), :].ravel(),
                magenta_excess[:, : max(8, width // 10)].ravel(),
                magenta_excess[
                    :, int(width * 0.78) : int(width * 0.86)
                ].ravel(),
            )
        )
        background_floor = float(np.percentile(border_samples, 2.0))
        alpha = np.clip(
            (background_floor - 2.0 - magenta_excess) / 18.0,
            0.0,
            1.0,
        )

    # Low-saturation clips include a magenta cast shadow that touches the
    # feet, so connected-component filtering alone cannot remove it. Restrict
    # this stronger rejection to the bottom contact band and to pixels that
    # still match the key hue. Legitimate pale paws/claws have low or negative
    # magenta excess and remain opaque.
    if adaptive_key:
        contact_start = int(rgb.shape[0] * 0.86)
        contact_key_alpha = np.clip(
            (8.0 - magenta_excess[contact_start:]) / 6.0,
            0.0,
            1.0,
        )
        alpha[contact_start:] *= contact_key_alpha
    alpha = np.power(alpha, 1.25)
    alpha = np.where(alpha < 0.07, 0.0, alpha)
    alpha = np.where(alpha > 0.965, 1.0, alpha)
    return np.rint(alpha * 255.0).astype(np.uint8), adaptive_key


def rgba_frame(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    alpha, adaptive_key = chroma_matte(rgb)

    # Dark floor shadows and antialiased fringes retain the key hue even when
    # their absolute RGB values are low. Refine only pixels close to the
    # already-transparent exterior so internal purple details (notably the
    # eyes) remain intact.
    near_exterior = binary_dilate(alpha == 0, 20)
    values = rgb.astype(np.float32)
    key = np.minimum(values[..., 0], values[..., 2])
    magenta_ratio = np.maximum(key - values[..., 1], 0.0) / (key + values[..., 1] + 16.0)
    exterior_key_alpha = np.clip((0.52 - magenta_ratio) / 0.27, 0.0, 1.0)
    refined_alpha = alpha.astype(np.float32) / 255.0
    refined_alpha[near_exterior] *= exterior_key_alpha[near_exterior]
    if adaptive_key:
        contact_start = int(rgb.shape[0] * 0.86)
        contact_band = np.zeros(alpha.shape, dtype=bool)
        contact_band[contact_start:] = True
        brightness = values.max(axis=2)
        dark_shadow_alpha = np.clip((brightness - 110.0) / 35.0, 0.0, 1.0)
        shadow_edge = contact_band & near_exterior
        refined_alpha[shadow_edge] *= dark_shadow_alpha[shadow_edge]
    refined_alpha = np.where(refined_alpha < 0.055, 0.0, refined_alpha)
    refined_alpha = np.where(refined_alpha > 0.98, 1.0, refined_alpha)
    alpha = np.rint(refined_alpha * 255.0).astype(np.uint8)

    # Drop the outermost contaminated source pixel. At the native 586 px cell
    # size this is sub-pixel at normal companion display sizes, but removes the
    # visible pink hairline on dark surfaces.
    alpha = minimum_filter_3(alpha).copy()

    # Keep only the foreground component connected to the centered character.
    # This removes detached floor-shadow fragments without using per-frame
    # bounding boxes or changing the subject's scale and registration.
    component = Image.fromarray(
        (alpha > 0).astype(np.uint8) * 255, "L"
    ).copy()
    seed = (component.width // 2, component.height // 2)
    if component.getpixel(seed) == 0:
        center_alpha = alpha[
            component.height // 4 : component.height * 3 // 4,
            component.width // 3 : component.width * 2 // 3,
        ]
        center_y, center_x = np.unravel_index(
            int(np.argmax(center_alpha)), center_alpha.shape
        )
        seed = (
            component.width // 3 + int(center_x),
            component.height // 4 + int(center_y),
        )
    ImageDraw.floodfill(component, seed, 128, thresh=0)
    connected = np.asarray(component) == 128
    alpha[~connected] = 0

    # Suppress residual key spill throughout the exterior edge band. Pixels
    # away from the silhouette stay byte-for-byte at source resolution.
    edge = binary_dilate(alpha == 0, 5) & (alpha > 0)
    output = rgb.astype(np.float32)
    green = output[..., 1]
    excess = np.maximum(np.minimum(output[..., 0], output[..., 2]) - green, 0.0)
    output[..., 0] -= excess * edge
    output[..., 2] -= excess * edge
    output = np.clip(output, 0.0, 255.0).astype(np.uint8)
    output[alpha == 0] = 0
    return np.dstack((output, alpha))


def color_key_rgba_frame(
    image: Image.Image,
    key_rgb: np.ndarray,
    matte_low: float,
    matte_high: float,
) -> np.ndarray:
    """Extract one centered subject from a softly mottled color-key plate."""
    if matte_high <= matte_low:
        raise ValueError("--matte-high must be greater than --matte-low")
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    values = rgb.astype(np.float32)
    distance = np.linalg.norm(values - key_rgb.reshape(1, 1, 3), axis=2)
    alpha_float = np.clip(
        (distance - matte_low) / (matte_high - matte_low), 0.0, 1.0
    )

    # A generated cast shadow is usually a darker version of the key hue.
    # Remove same-hue pixels only when they touch the already-clear exterior;
    # this preserves similarly colored costume details inside the subject.
    preliminary_alpha = np.rint(alpha_float * 255.0).astype(np.uint8)
    near_exterior = binary_dilate(preliminary_alpha <= 8, 28)
    centered = values - values.mean(axis=2, keepdims=True)
    centered_key = key_rgb - float(key_rgb.mean())
    key_norm = max(float(np.linalg.norm(centered_key)), 1e-6)
    value_norm = np.linalg.norm(centered, axis=2)
    hue_cosine = np.sum(centered * centered_key.reshape(1, 1, 3), axis=2) / (
        np.maximum(value_norm, 1e-6) * key_norm
    )
    same_hue_alpha = np.clip((0.985 - hue_cosine) / 0.11, 0.0, 1.0)
    alpha_float[near_exterior] *= same_hue_alpha[near_exterior]

    # Generated clips often retain a darker, softly mottled floor patch that
    # physically touches shoes, robes, or a chair. It is not a companion
    # shadow—the runtime anchors the transparent sprite directly to Codex UI.
    # In the lower contact band, use a wider exterior reach and reject colors
    # that preserve the plate hue even when their brightness is very different.
    contact_band = np.zeros(alpha_float.shape, dtype=bool)
    contact_band[int(rgb.shape[0] * 0.78) :] = True
    ground_exterior = binary_dilate(preliminary_alpha <= 8, 52)
    ground_key_alpha = np.clip((0.90 - hue_cosine) / 0.18, 0.0, 1.0)
    ground_shadow = contact_band & ground_exterior
    alpha_float[ground_shadow] *= ground_key_alpha[ground_shadow]
    alpha_float = np.where(alpha_float < 0.045, 0.0, alpha_float)
    alpha_float = np.where(alpha_float > 0.98, 1.0, alpha_float)
    alpha = minimum_filter_3(
        np.rint(alpha_float * 255.0).astype(np.uint8)
    ).copy()

    # Keep the component attached to the centered character. The stricter
    # core threshold prevents gray plate speckles and corner watermarks from
    # joining the subject through translucent compression noise.
    component = Image.fromarray((alpha >= 56).astype(np.uint8) * 255, "L").copy()
    seed = (component.width // 2, component.height // 2)
    if component.getpixel(seed) == 0:
        center_alpha = alpha[
            component.height // 5 : component.height * 4 // 5,
            component.width // 4 : component.width * 3 // 4,
        ]
        center_y, center_x = np.unravel_index(
            int(np.argmax(center_alpha)), center_alpha.shape
        )
        seed = (
            component.width // 4 + int(center_x),
            component.height // 5 + int(center_y),
        )
    ImageDraw.floodfill(component, seed, 128, thresh=0)
    connected_core = np.asarray(component) == 128
    connected_soft = binary_dilate(connected_core, 4) & (alpha > 0)
    alpha[~connected_soft] = 0

    # Reconstruct edge RGB from the estimated key instead of merely tinting
    # it. This removes blue/purple spill while leaving fully opaque pixels
    # byte-for-byte at the original video resolution.
    output = values.copy()
    edge = (alpha > 0) & (alpha < 250)
    edge_alpha = np.maximum(alpha.astype(np.float32) / 255.0, 0.16)
    reconstructed = (
        values - (1.0 - edge_alpha[..., None]) * key_rgb.reshape(1, 1, 3)
    ) / edge_alpha[..., None]
    output[edge] = np.clip(reconstructed[edge], 0.0, 255.0)
    output = np.rint(output).astype(np.uint8)
    output[alpha == 0] = 0
    return np.dstack((output, alpha))


def register_baselines(
    frames: list[np.ndarray], safe_left_ratio: float, safe_right_ratio: float
) -> tuple[list[np.ndarray], dict]:
    safe_left = int(frames[0].shape[1] * safe_left_ratio)
    safe_right = int(frames[0].shape[1] * safe_right_ratio)
    baselines: list[int] = []
    for frame in frames:
        ys, _ = np.where(frame[:, safe_left:safe_right, 3] >= 96)
        if not ys.size:
            raise RuntimeError("No opaque foreground was found for baseline registration")
        baselines.append(int(ys.max()))
    target = int(round(float(np.median(baselines))))
    shifts = [target - baseline for baseline in baselines]
    registered: list[np.ndarray] = []
    for frame, shift in zip(frames, shifts):
        output = np.zeros_like(frame)
        if shift >= 0:
            source_start, source_end = 0, frame.shape[0] - shift
            target_start, target_end = shift, frame.shape[0]
        else:
            source_start, source_end = -shift, frame.shape[0]
            target_start, target_end = 0, frame.shape[0] + shift
        output[target_start:target_end] = frame[source_start:source_end]
        registered.append(output)
    return registered, {
        "method": "vertical translation only; no resizing",
        "targetBaseline": target,
        "sourceMinimum": min(baselines),
        "sourceMaximum": max(baselines),
        "sourceRange": max(baselines) - min(baselines),
        "minimumShift": min(shifts),
        "maximumShift": max(shifts),
    }


def shared_bounds(
    frames: list[np.ndarray], safe_left_ratio: float, safe_right_ratio: float
) -> tuple[int, int, int, int]:
    height, width = frames[0].shape[:2]
    # The generated watermark is isolated in the far-right empty field. The
    # character never enters that field, so exclude it before calculating the
    # shared crop instead of altering character pixels.
    safe_left = int(width * safe_left_ratio)
    safe_right = int(width * safe_right_ratio)
    minimum_x, minimum_y = width, height
    maximum_x = maximum_y = -1
    for frame in frames:
        ys, xs = np.where(frame[:, safe_left:safe_right, 3] >= 96)
        if xs.size == 0:
            continue
        xs = xs + safe_left
        minimum_x = min(minimum_x, int(xs.min()))
        minimum_y = min(minimum_y, int(ys.min()))
        maximum_x = max(maximum_x, int(xs.max()))
        maximum_y = max(maximum_y, int(ys.max()))
    if maximum_x < minimum_x or maximum_y < minimum_y:
        raise RuntimeError("No foreground character pixels were detected")
    padding = 12
    return (
        max(safe_left, minimum_x - padding),
        max(0, minimum_y - padding),
        min(safe_right, maximum_x + padding + 1),
        min(height, maximum_y + padding + 1),
    )


def perceptual_steps(frames: list[np.ndarray]) -> np.ndarray:
    samples: list[np.ndarray] = []
    for frame in frames:
        rgba = Image.fromarray(frame, "RGBA")
        rgba.thumbnail((160, 160), Image.Resampling.LANCZOS)
        sample = np.asarray(rgba, dtype=np.float32)
        alpha = sample[..., 3:4] / 255.0
        composite = sample[..., :3] * alpha
        samples.append(np.concatenate((composite / 255.0, alpha), axis=2))
    steps = np.array(
        [np.mean(np.abs(samples[index] - samples[index - 1])) for index in range(1, len(samples))],
        dtype=np.float64,
    )
    if len(steps) >= 3:
        padded = np.pad(steps, (1, 1), mode="edge")
        steps = np.median(np.stack((padded[:-2], padded[1:-1], padded[2:])), axis=0)
    floor = float(np.percentile(steps, 8))
    ceiling = float(np.percentile(steps, 92))
    return np.clip(steps - floor * 0.45, 1e-6, max(ceiling, 1e-6))


def calibrated_angles(
    frames: list[np.ndarray],
    cardinal_positions: tuple[tuple[int, float], ...],
) -> list[float]:
    angles = np.zeros(len(frames), dtype=np.float64)
    for (start, angle_start), (end, angle_end) in zip(
        cardinal_positions[:-1], cardinal_positions[1:]
    ):
        steps = perceptual_steps(frames[start : end + 1])
        cumulative = np.concatenate(([0.0], np.cumsum(steps)))
        cumulative /= cumulative[-1]
        angles[start : end + 1] = angle_start + cumulative * (angle_end - angle_start)
    return [round(float(value), 4) for value in angles]


def watermark_report(
    template_path: Path | None,
    source_size: tuple[int, int],
    crop: tuple[int, int, int, int],
    corner_names: str = "",
) -> dict:
    corners = [item.strip() for item in corner_names.split(",") if item.strip()]
    if corners:
        return {
            "provided": True,
            "corners": corners,
            "strategy": "excluded by centered shared crop; no subject pixels altered",
            "excludedBySharedCrop": True,
        }
    if template_path is None:
        return {"provided": False, "excludedBySharedCrop": True}
    template = np.load(template_path)
    ys, xs = np.where(template > 0.01)
    template_bounds = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    width, height = source_size
    # Gemini places the 112 px watermark canvas 64 px from the right and 56 px
    # from the bottom in this 1280x720 export.
    canvas = [width - 176, height - 168, width - 64, height - 56]
    visible = [
        canvas[0] + template_bounds[0],
        canvas[1] + template_bounds[1],
        canvas[0] + template_bounds[2],
        canvas[1] + template_bounds[3],
    ]
    intersects = not (
        visible[2] <= crop[0]
        or visible[0] >= crop[2]
        or visible[3] <= crop[1]
        or visible[1] >= crop[3]
    )
    return {
        "provided": True,
        "templateShape": list(template.shape),
        "templateVisibleBounds": template_bounds,
        "sourceVisibleBounds": visible,
        "excludedBySharedCrop": not intersects,
    }


def save_pages(frames: list[np.ndarray], output_dir: Path, slug: str) -> list[str]:
    cell_height, cell_width = frames[0].shape[:2]
    page_paths: list[str] = []
    for page_index in range(math.ceil(len(frames) / PAGE_CAPACITY)):
        page_frames = frames[page_index * PAGE_CAPACITY : (page_index + 1) * PAGE_CAPACITY]
        page = Image.new(
            "RGBA",
            (cell_width * PAGE_COLUMNS, cell_height * PAGE_ROWS),
            (0, 0, 0, 0),
        )
        for local_index, frame in enumerate(page_frames):
            x = (local_index % PAGE_COLUMNS) * cell_width
            y = (local_index // PAGE_COLUMNS) * cell_height
            page.alpha_composite(Image.fromarray(frame, "RGBA"), (x, y))
        filename = f"{slug}-atlas-{page_index + 1}.webp"
        page.save(
            output_dir / filename,
            format="WEBP",
            quality=96,
            method=6,
            exact=True,
        )
        page_paths.append(filename)
    return page_paths


def save_qa(
    frames: list[np.ndarray],
    angles: list[float],
    output_dir: Path,
    key_rgb: np.ndarray,
) -> None:
    qa_dir = output_dir / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default()

    selected = []
    for target in range(0, 360, 22):
        index = min(range(len(angles)), key=lambda item: abs(angles[item] - target))
        selected.append((target, index))
    thumb_width = 180
    rows = math.ceil(len(selected) / 4)
    sheet = Image.new("RGBA", (thumb_width * 4, 230 * rows), (27, 29, 34, 255))
    draw = ImageDraw.Draw(sheet)
    for slot, (target, index) in enumerate(selected):
        image = Image.fromarray(frames[index], "RGBA")
        image.thumbnail((170, 190), Image.Resampling.LANCZOS)
        x = (slot % 4) * thumb_width + (thumb_width - image.width) // 2
        y = (slot // 4) * 230 + 24 + (190 - image.height)
        sheet.alpha_composite(image, (x, y))
        draw.text((slot % 4 * thumb_width + 6, slot // 4 * 230 + 6), f"{target:03d}° / {angles[index]:.1f}° / f{index}", font=font, fill="white")
    sheet.convert("RGB").save(qa_dir / "direction-contact-sheet.jpg", quality=94, subsampling=0)

    checker = np.zeros((240, 240, 3), dtype=np.uint8)
    for y in range(0, 240, 24):
        for x in range(0, 240, 24):
            checker[y : y + 24, x : x + 24] = 72 if (x // 24 + y // 24) % 2 else 184
    edge_sheet = Image.new("RGB", (240 * 3, 240 * 4), (0, 0, 0))
    edge_targets = (0, 90, 180, 270)
    for row, target in enumerate(edge_targets):
        index = min(range(len(angles)), key=lambda item: abs(angles[item] - target))
        sprite = Image.fromarray(frames[index], "RGBA")
        sprite.thumbnail((220, 220), Image.Resampling.LANCZOS)
        for column, background in enumerate(((18, 18, 18), (245, 245, 245), checker)):
            if isinstance(background, tuple):
                panel = Image.new("RGB", (240, 240), background)
            else:
                panel = Image.fromarray(background, "RGB")
            panel.paste(sprite, ((240 - sprite.width) // 2, 240 - sprite.height), sprite)
            edge_sheet.paste(panel, (column * 240, row * 240))
    edge_sheet.save(qa_dir / "edge-background-qa.png")

    alpha_failures = []
    contaminated_edge_pixels = 0
    baselines: list[int] = []
    centers_x: list[float] = []
    for index, frame in enumerate(frames):
        alpha = frame[..., 3]
        if np.any(alpha == 0) and np.any(alpha > 0):
            ys, xs = np.where(alpha >= 96)
            if xs.size:
                baselines.append(int(ys.max()))
                centers_x.append(float(xs.mean()))
            continue
        alpha_failures.append(index)

    for frame in frames:
        alpha = frame[..., 3]
        exterior = binary_dilate(alpha == 0, 5)
        edge = exterior & (alpha > 0) & (alpha < 250)
        rgb = frame[..., :3].astype(np.float32)
        key_distance = np.linalg.norm(rgb - key_rgb.reshape(1, 1, 3), axis=2)
        contaminated_edge_pixels += int(
            np.count_nonzero(edge & (key_distance < 16.0))
        )
    (qa_dir / "validation.json").write_text(
        json.dumps(
            {
                "ok": not alpha_failures and contaminated_edge_pixels == 0,
                "frameCount": len(frames),
                "transparentBackground": not alpha_failures,
                "alphaFailures": alpha_failures,
                "keyEdgePixels": contaminated_edge_pixels,
                "chromaKey": [int(value) for value in key_rgb],
                "angleMonotonic": all(a <= b for a, b in zip(angles, angles[1:])),
                "sharedCanvas": True,
                "baseline": {
                    "minimum": min(baselines) if baselines else None,
                    "maximum": max(baselines) if baselines else None,
                    "range": max(baselines) - min(baselines) if baselines else None,
                },
                "horizontalCenter": {
                    "minimum": round(min(centers_x), 2) if centers_x else None,
                    "maximum": round(max(centers_x), 2) if centers_x else None,
                },
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    cardinal_frames = parse_cardinal_frames(args.cardinal_frames)
    excluded_frames = parse_excluded_frames(args.exclude_frames)
    if not 0.0 <= args.safe_left_ratio < args.safe_right_ratio <= 1.0:
        raise ValueError("Safe left/right ratios must define an increasing 0–1 window")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"codex-styler-{args.slug}-") as temp:
        extracted = extract_frames(args.input, Path(temp), args.ffmpeg)
        synthetic_positions: set[int] = set()
        if args.source_order:
            if not args.cardinal_positions:
                raise ValueError(
                    "--cardinal-positions is required with --source-order"
                )
            source_indices = parse_source_order(args.source_order, len(extracted))
            source_indices = [
                frame for frame in source_indices if frame not in excluded_frames
            ]
            cardinal_positions = parse_cardinal_frames(args.cardinal_positions)
            if cardinal_positions[-1][0] >= len(source_indices):
                raise ValueError("A cardinal position exceeds the selected sequence")
            source_images = [Image.open(extracted[index]) for index in source_indices]
            last_source_frame = source_indices[-1]
        else:
            last_source_frame = (
                cardinal_frames[-2][0]
                if args.close_loop_with_first
                else cardinal_frames[-1][0]
            )
            if last_source_frame >= len(extracted):
                raise RuntimeError(
                    f"Last source frame {last_source_frame} exceeds "
                    f"the {len(extracted)}-frame source"
                )
            if args.close_loop_with_first and (
                cardinal_frames[-1][0] != last_source_frame + 1
            ):
                raise ValueError(
                    "A synthetic loop closure must use the frame immediately after "
                    "the final real source frame"
                )
            source_indices = list(
                range(cardinal_frames[0][0], last_source_frame + 1)
            )
            if any(frame in excluded_frames for frame, _ in cardinal_frames[:-1]):
                raise ValueError("A real cardinal anchor cannot be excluded")
            source_indices = [
                frame for frame in source_indices if frame not in excluded_frames
            ]
            source_images = [Image.open(extracted[index]) for index in source_indices]
            if args.close_loop_with_first:
                source_images.append(source_images[0].copy())
                source_indices.append(cardinal_frames[-1][0])
                synthetic_positions.add(len(source_indices) - 1)
            index_for_source = {
                source: index for index, source in enumerate(source_indices)
            }
            cardinal_positions = tuple(
                (index_for_source[frame], angle)
                for frame, angle in cardinal_frames
            )
        source_size = source_images[0].size
        if args.chroma_key == "magenta":
            key_rgb = np.array([255.0, 0.0, 255.0], dtype=np.float32)
            rgba_frames = [rgba_frame(image) for image in source_images]
            background_description = (
                "magenta chroma matte with translucent edge despill"
            )
        else:
            key_rgb = (
                estimate_chroma_key(source_images)
                if args.chroma_key == "auto"
                else parse_color(args.chroma_key)
            )
            rgba_frames = [
                color_key_rgba_frame(
                    image, key_rgb, args.matte_low, args.matte_high
                )
                for image in source_images
            ]
            background_description = (
                "auto-estimated color-key matte with connected-subject cleanup, "
                "gray-speck rejection, and reconstructed edge RGB"
            )
        rgba_frames, baseline_registration = register_baselines(
            rgba_frames, args.safe_left_ratio, args.safe_right_ratio
        )
        crop = shared_bounds(
            rgba_frames, args.safe_left_ratio, args.safe_right_ratio
        )
        cropped = [frame[crop[1] : crop[3], crop[0] : crop[2]].copy() for frame in rgba_frames]
        angles = calibrated_angles(cropped, cardinal_positions)
        pages = save_pages(cropped, args.output_dir, args.slug)
        save_qa(cropped, angles, args.output_dir, key_rgb)

    manifest = {
        "format": "codex-styler-calibrated-atlas-v1",
        "source": {
            "file": args.input.name,
            "displayName": args.display_name,
            "width": source_size[0],
            "height": source_size[1],
            "fps": 24,
            "frameCount": len(extracted),
            "selectedSourceFrames": [source_indices[0], last_source_frame],
            "selectedFrameCount": len(source_indices),
            "sourceOrder": source_indices if args.source_order else None,
            "syntheticLoopClosure": args.close_loop_with_first,
            "excludedSourceFrames": sorted(excluded_frames),
        },
        "processing": {
            "resized": False,
            "encoding": "WebP quality 96 with exact lossless alpha",
            "background": background_description,
            "chromaKey": [int(round(value)) for value in key_rgb],
            "sharedCrop": list(crop),
            "baselineRegistration": baseline_registration,
            "watermark": watermark_report(
                args.watermark_template,
                source_size,
                crop,
                args.watermark_corners,
            ),
            "calibration": "piecewise cardinal anchors with cumulative perceptual-distance timing",
            "cardinalSourceFrames": [
                {
                    "sourceFrame": source_indices[position],
                    "sequencePosition": position,
                    "angle": angle,
                    "synthetic": position in synthetic_positions,
                }
                for position, angle in cardinal_positions
            ],
        },
        "renderer": {
            "pages": pages,
            "columns": PAGE_COLUMNS,
            "rows": PAGE_ROWS,
            "framesPerPage": PAGE_CAPACITY,
            "frameWidth": crop[2] - crop[0],
            "frameHeight": crop[3] - crop[1],
            "directions": len(cropped),
            "frameAngles": angles,
            "sourceFps": 24,
        },
    }
    (args.output_dir / f"{args.slug}-atlas.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest["renderer"], indent=2))


if __name__ == "__main__":
    main()
