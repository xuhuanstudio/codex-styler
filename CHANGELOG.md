# Changelog

All notable changes will be documented here. The project follows Semantic Versioning after v1.0.0.

## [Unreleased]

## [0.2.0-beta.5] - 2026-07-18

### Added

- Theme-aware foreground adaptation that evaluates the actual quiet and raised UI surfaces over both solid and image-backed scenes.
- Targeted semantic contrast recovery that strengthens affected surfaces and moves text only as far as needed toward a readable neutral before considering compatibility fallback.
- Runtime regression coverage for stale Codex foreground utilities, repair success, repair failure, scene-layer imagery, and complete restoration.

### Changed

- Theme previews and the injected Codex runtime now share the same surface-opacity and text-contrast model across every built-in light and dark variant.
- Generated image themes retain a restrained tint from the source image while meeting readable contrast on their component surfaces.
- While a Styler theme is active, its variant, semantic foregrounds, placeholders, and icon roles explicitly take priority over Codex's own appearance; restoring the official interface removes that priority completely.

### Fixed

- Light Codex appearance no longer leaves dark native text blended into dark or image-backed Styler surfaces, and the inverse dark-appearance mismatch is corrected as well.
- A native foreground-class conflict no longer immediately removes semantic surfaces, component styling, icons, and layout; the runtime first applies a scoped readability repair and verifies the result.
- Structural adapter failures still fall back safely, while recoverable foreground or surface conflicts keep the complete theme whenever the targeted repair succeeds.

## [0.2.0-beta.4] - 2026-07-18

### Added

- Cross-platform product chrome for scrollbars, range controls, checkboxes, color inputs, and native selects, including compact creator timelines and reduced-motion behavior.
- Localized recovery guidance for Windows Store activation, permission mismatches, and expired Codex debugging connections.

### Changed

- Windows restart now carries the verified Codex installation path through shutdown polling, caches valid Store locations, bounds every helper query, and closes independent verified process roots concurrently.
- Microsoft Store activation resolves registered Start Menu identities and package manifests before attempting tightly scoped same-package fallbacks.
- Issue templates, compatibility guidance, and visual regression baselines now reflect the current Beta lifecycle and interaction system.

### Fixed

- Windows release builds no longer open a terminal alongside Codex Styler.
- Restart no longer repeats `Get-AppxPackage` on every 250 ms shutdown poll or waits indefinitely for PowerShell and task-kill helpers.
- Store installations whose manifest executable uses a target-name token or a non-default application ID can be launched through their registered package identity.
- The manager no longer mixes platform-default scrollbars and form-control chrome with the application design system.

## [0.2.0-beta.3] - 2026-07-18

### Added

- Compact master-detail theme and companion libraries, a current-configuration Home, and focused theme and companion workspaces.
- Persisted workspace preferences for focus mode, panel widths, and preview scenarios.
- Theme Editor previews for Home, Task, Settings, Dialog, and Right panel scenarios, plus regression screenshots at the compact supported size.

### Changed

- Consolidated selection, runtime, draft, and asynchronous operation state behind a revision-aware application session reducer and command flow.
- Restored the original continuous, compact Settings flow while retaining modern controls and normalized typography, focus states, spacing, and responsive behavior.
- Split design tokens, primitives, libraries, workspaces, Settings, typography, and responsive rules into maintainable style layers; heavy editors and archive code remain separately loaded.
- Split Home, theme and companion libraries, Settings, Theme Editor, creator media previews, calibration status, and interactive stages out of the application shell without changing their workflows.

### Fixed

- The Home workspace preview now grows with taller windows instead of remaining compressed into an overly wide strip, while the compact 960 × 680 layout keeps its dedicated height.
- Cached Codex sessions are now health-checked; externally closing or reopening Codex clears the stale Connected state and routes the next apply through the managed restart flow.
- Windows restart helpers stay hidden, target only verified process-tree roots, and launch Microsoft Store Codex packages through their registered application identity instead of an access-restricted executable path.
- Locally encoded companion assets now use the extension that matches their actual bytes: supported WebViews keep WebP, while PNG fallbacks are packaged as PNG instead of failing installation as mislabeled `.webp` files.
- Explicit Restore official actions are no longer discarded by stale-response protection.
- Theme Editor panels remain usable at 960 × 680 while resizers are intentionally hidden where there is insufficient room.
- Native creator drops preserve Windows and macOS file names, MIME types, and binary view bounds, while invalid bridge responses now surface a recoverable error.
- Codex light/dark variants, Enhanced/Conservative strategy changes, and reduced-motion preferences now persist and apply immediately to a live Codex session.
- Background image layers now control opacity, blend mode, and capped parallax on the actual runtime background instead of being discarded as duplicates.
- The previously applied theme and variant are restored as the initial selection after Styler restarts.

## [0.2.0-beta.2] - 2026-07-18

### Added

- Structured English and Simplified Chinese update highlights fetched from the selected GitHub Release before an installer is downloaded.
- Native file drag-and-drop, source validation, broader system video decoding, alignment diagnostics, motion-range authoring, and interactive runtime testing in Companion Studio.
- Dedicated portrait assets for every built-in companion and expanded creator screenshot coverage.

### Changed

- Rebuilt all seven Companion Studio stages around a consistent professional workspace, non-destructive previews, readiness feedback, autosave, reset, and explicit destructive-action confirmation.
- Improved shared-canvas alignment, visual direction calibration, pose-aware idle-motion editing, package metadata, and project persistence.
- Kept the creator iterative by removing the proposed second layer of in-step navigation while retaining the primary workflow and recovery controls.

### Fixed

- Companion library portraits no longer display unrelated cells from runtime sprite atlases.
- Unsupported or mislabeled video streams now produce accurate codec guidance instead of treating every MP4 container as H.264-decodable.
- Package validation, frame bounds, cleanup corrections, shared crops, and companion defaults are normalized consistently across import, save, export, and re-import.

## [0.2.0-beta.1] - 2026-07-17

### Added

- Seven-step Companion Studio for static images, image sequences, short videos, and existing sprite atlases.
- Visual atlas slicing, local Worker-based cleanup, shared alignment, direction-dial calibration, direction/idle/exclude tracks, motion authoring, and interactive final preview.
- Public `codex-styler-companion-v1` Schema, validated `.codex-styler-companion` archives, app-data persistence, import/export, and package CLI validation.
- Redacted diagnostics preview and ZIP export with installation, process, loopback, adapter, recovery, updater, and lifecycle checks.
- Codex DOM fixtures, Playwright manager/creator E2E, and English/Chinese light/dark screenshot baselines.
- Dedicated companion proposal, companion package bug, and Windows compatibility Issue Forms.

### Changed

- Separated themes, variants, companions, and companion placement in a revisioned `AppliedConfiguration`.
- Updated companions through the entity layer without background reinjection; stale apply responses no longer override the newest selection.
- Migrated built-in companions to calibrated poses and pose-aware idle clips while retaining legacy `frameAngles` input.
- Added dynamic atlas paging with a 48 MiB decoded-page target and a two-page runtime LRU.
- Renamed user compatibility choices to Enhanced and Conservative; version changes are informational and Enhanced falls back only after live health failure.
- Expanded the preview release workflow to Beta and RC tags with monotonic updater channel rules.

### Fixed

- Native dialogs, toasts, menus, tooltips, settings routes, right-panel tabs, and dynamic composers remain above theme and companion layers.
- Restart-required, applying, fallback, paused, and error states expose explicit feedback and reject duplicate or stale completion.
- Theme recommendations no longer overwrite an explicit companion or No companion choice.
- Large source media and project history are stored in application data rather than localStorage.

## [0.1.0-alpha.9] - 2026-07-17

### Added

- Automatic Windows discovery for Microsoft Store packages, standard user/system installs, and verified running desktop processes.
- A validated custom Codex application path in Settings as a fallback when automatic discovery cannot find a nonstandard install.

### Changed

- Unified theme and companion selection around one live configuration model: changes apply immediately while Codex is connected and remain clearly pending otherwise.
- Kept the sidebar as the only global start/apply action while preserving explicit Save and Apply actions inside the theme editor.
- Windows restart now waits for a normal close before terminating only the verified Codex UI process tree when the packaged app hides instead of exiting.

### Fixed

- Changing a companion now updates the active Codex scene without requiring a manual close and reapply cycle.
- Companion placement changes are debounced and synchronized to the active runtime.
- Restart confirmation now finishes after Codex has already closed and exposes a visible retryable error instead of appearing stuck.
- Desktop detection no longer confuses Codex CLI/resource processes with the supported desktop UI process.

## [0.1.0-alpha.8] - 2026-07-17

### Added

- Windows 11 x64 NSIS preview packaging with one directly downloadable installer EXE and its Tauri updater signature.
- A cross-platform release assembly job that publishes macOS and Windows update entries, SHA-256 checksums, an SPDX SBOM, and provenance attestations together.

### Changed

- Updated the website, READMEs, release metadata, and in-app version display for the first dual-platform Alpha.
- Updated `serde_with` to 3.21.0 to incorporate its patched `KeyValueMap` serialization behavior.

### Fixed

- Generated theme validation now normalizes line endings, so Windows CRLF checkouts do not produce false stale-file failures.
- Settings and other full-page Codex routes remain above the injected background after application-root transitions.
- Native Portal and Toast layers keep their own stacking order instead of inheriting the application-root layer.
- Docked right-panel tabs remain visible above the fixed title bar while semantic header tinting stays intact.

## [0.1.0-alpha.5] - 2026-07-17

### Added

- Gilded Grandeur and Merry Big Top as complete light/dark flagship themes with original backgrounds and semantic palettes.
- Reset God and Token Thief companions, plus calibrated formal resources for Moss, Pico, Puddle, and Mochi.
- Signed update manifests and archives with in-app download, install, restart, and version skipping.
- A reusable video-companion pipeline for non-linear direction calibration, shared cropping, background cleanup, and multi-page atlases.

### Changed

- Promoted the two flagship themes to positions two and three, with their signature companions in matching library positions.
- Expanded theme application across layout, icon treatment, decorations, motion, surface roles, and readability protection.
- Unified built-in, image-derived, blank, and imported themes behind the same validated runtime and editing workflow.
- Improved companion attachment, dragging, thumbnail framing, baseline stability, and live composer resizing.

### Fixed

- Custom themes now save and apply through the same verified Codex connection path as built-in themes.
- Theme package validation no longer rejects valid locally generated archives.
- SVG icon geometry is preserved while themed containers change visual treatment.
- Hover and route transitions no longer allow a scene layer to cover the Codex application.
- Light themes retain readable text and controls over imported image backgrounds.

## [0.1.0-alpha.4] - 2026-07-16

### Added

- A workspace Home that summarizes the applied theme, companion, runtime strategy, and safest next action.
- A unified theme library with Built-in and My Themes tabs, package import, and creation from an image, a blank canvas, or an existing theme.
- Theme-local motion recipes for static, calm, fluid, and expressive interface behavior.
- Complete semantic palette roles for the Codex interface, backed by generated schema validation and contrast-aware defaults.

### Changed

- Moved theme editing into the theme library so customization no longer breaks the user's navigation context.
- Built-in theme customization now creates an editable local copy with its own save, export, apply, reset, and delete lifecycle.
- Theme and companion selection remain independent while themes may still recommend a default pairing.
- Reworked the desktop manager into a neutral system-tool design and updated the GitHub overview screenshot in English.

### Fixed

- Applied themes now cover the complete 182-token Codex semantic color surface instead of leaving native colors behind.
- Icon treatments are scoped to their containers and no longer distort SVG geometry or turn circular controls into stretched ovals.
- Responsive composition guards prevent the new-task workspace metadata and composer from overlapping at compact heights.
- Custom themes now use the same runtime application path and connection handling as built-in themes.

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
