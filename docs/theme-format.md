# Theme format v1

A `.codex-styler-theme` file is a validated ZIP archive. Its root manifest is `theme.json`, with `format` fixed to `codex-styler-theme-v1`.

The authoritative contract is [theme.schema.json](../packages/theme-core/schema/theme.schema.json). A minimal valid manifest is available in [examples/minimal-theme.json](../packages/theme-core/examples/minimal-theme.json).

## Manifest model

| Field              | Purpose                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `metadata`         | Human-readable identity, license, tags, and optional preview                              |
| `compatibility`    | Minimum Styler version and safe/semantic Codex mode                                       |
| `variants`         | Independent light and dark background, surface, color, motion, and shell-treatment values |
| `scene.layers[]`   | Images, gradients, and vignettes in painter order                                         |
| `scene.entities[]` | Renderer, anchor, size, opacity, and data-only behaviors                                  |
| `assets[]`         | Every local file plus its type and license                                                |
| `locales`          | Localized name and description; English is the recommended fallback                       |

## v1 renderers and behaviors

- `image`: a single local raster image;
- `sprite-atlas`: a regular grid with 4, 8, or 16 direction frames;
- `idle`: no pointer response;
- `parallax`: constrained scene displacement;
- `look-at-pointer`: maps the pointer angle to a sprite direction;
- `reduce-motion-fallback`: freezes the entity at its neutral frame.

Both renderers may declare `normalization: "grounded"` and an optional `alphaThreshold`. Grounded normalization analyzes the alpha bounds of every frame, applies one shared scale, centers each visible figure, and aligns all frames to one bottom baseline. It deliberately does not crop and scale each frame independently, which would introduce size changes and vertical jitter.

An entity can remain at its percentage `anchor`, or declare an `attachment` with a semantic target (`composer`, `main-surface`, or `thread-summary`), edge, alignment, and pixel offset. The runtime observes the resolved target and repositions the entity when that surface changes size or is recreated after navigation.

Multiple entities are represented by an array from the start, but the v1 schema caps that array at one. Future format revisions can raise the limit without changing the renderer contract. Video and WebGL will be new renderers, not hidden script escape hatches.

## Shell treatment

The optional appearance fields `layout`, `iconStyle`, and `decorations` control the visual shell without changing Codex's information architecture or interaction semantics:

- `layout`: `native`, `editorial`, or `immersive` composition density;
- `iconStyle`: native glyphs, contained glyphs, or a theme-owned treatment;
- `decorations`: none, subtle, or expressive non-interactive ornament.

These values style stable semantic adapter slots such as navigation, the home hero, suggestions, project rail, composer, messages, dialogs, and thread summary. Themes never receive selectors or arbitrary CSS, so a package cannot reach outside the adapter boundary.

## Semantic color palette

The required appearance colors (`accent`, `surface`, `text`, `mutedText`, and `border`) are the compact source palette. Styler derives a complete accessible component palette from them for surfaces, controls, interaction states, code, diffs, terminals, charts, and status feedback.

Advanced themes may refine individual roles through the optional `appearance.palette` object, including `canvas`, raised/overlay/sunken surfaces, control states, tertiary text, focus and border levels, and semantic success/warning/danger colors. These names are stable Codex Styler roles—not Codex CSS variables. The versioned compatibility adapter maps them onto the current Codex token system, so themes remain portable when Codex changes its internal DOM or styles.

## Archive layout

```text
theme.json
LICENSES.json
assets/background.webp
assets/companion-atlas.webp
previews/cover.webp
```

Paths are relative and use `/`. Asset references must be declared in `assets[]`; remote URLs and `data:` URLs are invalid inside a package.

## Validate a manifest

```bash
pnpm install
pnpm theme:validate packages/theme-core/examples/minimal-theme.json
```

Validation covers the JSON Schema and relationships between declarations and references. Importing the archive additionally verifies paths, sizes, image signatures, dimensions, and file presence.

## Versioning

Theme `version` follows semantic versioning. The format identifier changes only for an incompatible protocol revision. Readers must reject unknown format identifiers rather than attempting a best-effort interpretation.
