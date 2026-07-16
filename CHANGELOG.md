# Changelog

All notable changes will be documented here. The project follows Semantic Versioning after v1.0.0.

## [Unreleased]

## [0.1.0-alpha.3] - 2026-07-16

### Added

- Local image analysis and four curated adaptive visual systems.
- Theme-level workspace layout, icon treatment, and detail controls.
- Alpha-aware grounded sprite normalization with a shared scale and baseline.
- Semantic companion attachments for the composer, workspace, and thread summary.
- Managed Codex quit confirmation and restart directly from the connection card.

### Changed

- Expanded runtime styling across stable semantic Codex surfaces and home compositions.
- Separated theme selection from companion selection while retaining optional default pairings.
- Made Enhanced mode the default live apply-and-verify strategy, with Conservative mode available for isolated rendering.
- Updated all current GitHub-facing release metadata and contribution guidance to English.

### Fixed

- Companion frames no longer float, resize, or shift vertically because of inconsistent transparent padding.
- Attached companions now follow composer height changes and interface re-rendering.
- The lower-left connection action now opens the real restart-and-apply flow instead of only refreshing detection.
- Light themes protect text contrast against imported backgrounds and translucent surfaces.

## [0.1.0-alpha.2] - 2026-07-16

### Added

- Tested semantic Codex adapter signatures for `26.707.72221` and `26.707.91948`.
- Local-theme deletion with a confirmation step and archive cleanup.
- System-language preference as the first option in a native language dropdown.
- Original eight-direction transparent Moss gecko atlas with pointer tracking.
- Automatic, compatibility, and developer runtime strategies with live health checks.
- Original light and dark Codex Styler identity assets and regenerated platform icons.
- A native window drag region for the overlay title bar.

### Changed

- Restyled the manager as a neutral system utility with independent system, light, and dark modes.
- Made every theme-index row clickable while retaining a separate Customize action.
- Replaced the GitHub product screenshot with an English dark-mode capture.
- Changed unknown-version handling from version-gated blocking to automatic apply-and-verify fallback.

### Fixed

- Semantic themes are no longer forced into safe mode on recognized Codex versions.
- Background, main surface, header, conversation cards, dialogs, and composer materials now share the same tested adapter instead of styling only the sidebar.
- Interactive entities now render in their own click-through foreground layer instead of being hidden behind the Codex interface.
- Sprite preview positioning now respects each atlas's declared rows and columns.

## [0.1.0-alpha.1] - 2026-07-16

### Added

- Tauri 2 desktop shell with React editor and Rust runtime core.
- Public <code>codex-styler-theme-v1</code> schema, validator, archive safety limits, and CLI validation.
- Themes, Create, My Themes, and Settings flows in English and Simplified Chinese.
- Native Refined, Nocturne Studio, and Quiet Garden Companion.
- Original Codex Styler icon, two scene backgrounds, and a 16-direction Moss gecko atlas.
- Loopback-only Codex launch, trusted CDP target selection, safe-mode injection, pause, and restore.
- Astro bilingual website, documentation routes, canonical URLs, hreflang, sitemap, Open Graph, and structured data.
- Installable macOS Apple Silicon DMG preview with checksums, SPDX SBOM, provenance attestations, and a human-reviewed draft release gate.

### Fixed

- Precompiled theme schema validation so the desktop UI works under its strict Content Security Policy without enabling `unsafe-eval`.
- Existing Codex sessions are now detected and left under the user's control; Codex Styler asks the user to quit manually before checking again.
