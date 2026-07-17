# Companion format v1

A `.codex-styler-companion` file is a validated ZIP archive with the fixed format identifier `codex-styler-companion-v1`. It is independent from themes: a theme may recommend a companion, but the user’s explicit companion or **No companion** choice always wins.

The authoritative contract is [companion.schema.json](../packages/theme-core/schema/companion.schema.json). A minimal manifest is available in [minimal-companion.json](../packages/theme-core/examples/minimal-companion.json).

## Archive layout

```text
companion.json
LICENSES.json
assets/atlas-1.webp
assets/atlas-2.webp
previews/portrait.webp
```

Packages contain compiled PNG, JPEG, or WebP assets and JSON only. Source video, project history, scripts, CSS, remote URLs, SVG, fonts, and undeclared files are rejected.

## Direction and motion model

`poses[]` is the calibrated direction model. Each pose has a stable id, an angle in `[0, 360)`, and a main frame. `0°` means that the pointer is above the companion; angles increase clockwise. At least four unique, angle-sorted poses are required, while eight or more are recommended for a smooth result.

The runtime selects the nearest calibrated pose. It does not calculate `angle / 360 × frameCount`, because video rotation is rarely uniform. `idleClips[]` stores blinks, breathing, and small gestures separately, associates them with compatible pose ids, and records per-frame timing. Pointer movement interrupts an idle clip and returns immediately to the pose’s main frame.

Legacy theme entities using `frameAngles` still load in 0.2 and are converted to one-frame poses in memory. New packages should use `poses[]` and `idleClips[]`.

## Shared geometry

All logical frames use one canvas, one crop, and one scale. A frame may have a baseline translation, but it must not be independently resized. This prevents transparent padding, uneven subject bounds, or per-frame cropping from making the character change size or float above a dynamic Codex surface.

The runtime supports a free percentage anchor or a semantic attachment to the composer, main surface, or thread summary. Attached companions are repositioned when the target is recreated or changes height.

## Paging and limits

- up to 512 logical frames;
- up to 8 atlas pages;
- each decoded atlas page is packed below a 48 MiB pixel-area budget;
- runtime LRU cache: current page plus one adjacent page;
- 50 MiB compressed package, 100 MiB extracted total, 20 MiB per file;
- maximum raster dimension: 8192 × 8192.

The list view uses `previews/portrait.webp` and never decodes a complete atlas to display a card.

## Validate

```bash
pnpm package:validate packages/theme-core/examples/minimal-companion.json
pnpm package:validate path/to/example.codex-styler-companion
```

Validation checks the JSON Schema, pose and clip relationships, frame/page bounds, licenses, archive paths, MIME signatures, image dimensions, declared files, and package size limits.
