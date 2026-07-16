# Contributing to Codex Styler

Thank you for helping build a safer and more expressive Codex Desktop customization layer.

## Before opening work

- Search existing issues and discussions.
- Use an issue before changing the public theme schema, CDP lifecycle, security limits, licensing policy, or supported-platform promise.
- Keep themes data-only. Do not add remote resources, arbitrary JavaScript, arbitrary CSS, SVG, video, or executable fonts.
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
- a safe-mode presentation;
- reduced-motion behavior;
- original or compatibly licensed raster assets;
- preview art, attribution, and replacement specifications;
- no more than one v1 interactive entity.

Run the validator before submitting:

```bash
pnpm theme:validate path/to/theme.json
```

## Compatibility reports

Include the operating system, architecture, Codex version, Codex Styler commit or release, and exact safe/semantic mode. Review diagnostic output before attaching it.

## Security

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).
