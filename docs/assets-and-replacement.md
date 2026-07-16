# Original assets and replacement guide

All bundled visual assets were created for Codex Styler and are listed in [ASSET_LICENSES.md](../ASSET_LICENSES.md). They may be replaced without changing application code as long as paths and manifest metadata remain valid.

| Theme | File | Required canvas | Format | Notes |
| --- | --- | ---: | --- | --- |
| Nocturne Studio | `apps/desktop/public/themes/nocturne-studio/assets/nocturne-studio.webp` | 1600×1000 | WebP | Full-bleed background; keep the central reading area quiet |
| Quiet Garden | `apps/desktop/public/themes/quiet-garden/assets/quiet-garden.webp` | 1600×1000 | WebP | Full-bleed background; preserve foreground depth at the edges |
| Moss companion | `apps/desktop/public/themes/quiet-garden/assets/moss-gecko-atlas.webp` | 1768×886 | lossless WebP with alpha | 8 columns × 2 rows; each frame 221×443 |

## Moss direction order

Frames are clockwise from up:

```text
row 1: up, up-right 1, up-right 2, right-up, right, right-down 1, right-down 2, down-right
row 2: down, down-left 1, down-left 2, left-down, left, left-up 1, left-up 2, up-left
```

The subject should occupy a consistent footprint in every cell. Keep each cell transparent outside the character, avoid shadows crossing cell boundaries, and keep eyes readable at the final on-screen width of roughly 96–180 px.

## Replacing with externally generated material

1. Export the replacement at the exact dimensions above.
2. Keep the existing filename, or update every matching path in the built-in theme definition.
3. For an atlas, verify transparent edges and the 8×2 grid before conversion.
4. Update [ASSET_LICENSES.md](../ASSET_LICENSES.md) with creator, source, license, and modification notes.
5. Run `pnpm check`, then visually test light/dark variants and reduced motion.

Video is intentionally unsupported in v1. A future video renderer should specify poster image, codec allowlist, loop behavior, memory budget, background throttling, and reduced-motion fallback before a video file is accepted.
