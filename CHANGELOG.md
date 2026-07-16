# Changelog

All notable changes will be documented here. The project follows Semantic Versioning after v1.0.0.

## [Unreleased]

### Added

- Tauri 2 desktop shell with React editor and Rust runtime core.
- Public <code>codex-styler-theme-v1</code> schema, validator, archive safety limits, and CLI validation.
- Themes, Create, My Themes, and Settings flows in English and Simplified Chinese.
- Native Refined, Nocturne Studio, and Quiet Garden Companion.
- Original Codex Styler icon, two scene backgrounds, and a 16-direction Moss gecko atlas.
- Loopback-only Codex launch, trusted CDP target selection, safe-mode injection, pause, and restore.
- Astro bilingual website, documentation routes, canonical URLs, hreflang, sitemap, Open Graph, and structured data.

### Fixed

- Precompiled theme schema validation so the desktop UI works under its strict Content Security Policy without enabling `unsafe-eval`.
- Existing Codex sessions are now detected and left under the user's control; Codex Styler asks the user to quit manually before checking again.
