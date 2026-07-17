# Contributing to Codex Styler

Thank you for helping build a safer and more expressive Codex Desktop customization layer.

## Before opening work

- Search existing issues and discussions.
- Use an issue before changing the public theme schema, CDP lifecycle, security limits, licensing policy, or supported-platform promise.
- Keep exported themes and companions data-only. Do not add remote resources, arbitrary JavaScript, arbitrary CSS, SVG, video, or executable fonts.
- Never copy assets or code from a reference project without a compatible license and attribution.

## Local setup

```bash
pnpm install
pnpm check
. ~/.cargo/env
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
```

For the Tauri desktop application:

```bash
pnpm tauri dev
```

## Pull requests

- Use English for branch names, commit subjects, pull request titles and descriptions, changelog entries, and release notes. Localized product documentation remains welcome.
- Keep one behavioral change per pull request.
- Add or update tests for schema, archive, direction mapping, runtime, or compatibility changes.
- Include before-and-after screenshots for visible changes.
- Keep English and Simplified Chinese product copy aligned.
- Record generated or third-party asset provenance and license.
- Do not attach personal Codex workspace data, credentials, raw private logs, or signing material.

## Theme contributions

A built-in theme must provide:

- valid <code>codex-styler-theme-v1</code> data;
- light and dark variants;
- a readable Conservative-mode presentation;
- reduced-motion behavior;
- original or compatibly licensed raster assets;
- preview art, attribution, and replacement specifications;
- an optional recommendation rather than an embedded global companion for new exports.

Run the validator before submitting:

```bash
pnpm theme:validate path/to/theme.json
```

## Companion contributions

A built-in or shared companion must provide:

- valid `codex-styler-companion-v1` data and a portrait preview;
- at least four calibrated poses in `[0, 360)`, a neutral frame, and a reduced-motion frame;
- shared canvas, scale, crop, and ground-line geometry across every frame;
- pose-aware idle clips for blinks, breathing, or gestures instead of duplicate direction poses;
- local PNG, JPEG, or WebP assets with complete authorship, source, and license declarations;
- no raw source video or Companion Studio project history in the exported package.

Use Companion Studio for visual calibration, then validate the exported archive:

```bash
pnpm package:validate path/to/companion.codex-styler-companion
```

Review alpha edges on black, white, and representative theme colors before submitting. See [Creating companions](docs/creating-companions.md) for the complete workflow.

## Compatibility reports

Include the operating system, architecture, Codex version, Codex Styler commit or release, and exact Enhanced/Conservative mode. Generate the redacted diagnostics archive, preview both files, and attach it manually only after confirming that it contains no private workspace data.

## Security

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).
