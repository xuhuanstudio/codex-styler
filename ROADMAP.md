# Roadmap

The roadmap is organized by evidence gates, not calendar promises.

## v0.2 — Reliability & Creator Beta

### Gate 1: Reliability Foundation — implemented

- revisioned application state and stale-response rejection;
- one configuration model for theme, variant, independent companion, placement, and compatibility strategy;
- immediate entity-level companion updates without background reinjection;
- automatic installation discovery plus a validated custom-path fallback;
- structured Windows quit/restart recovery and retryable errors;
- application-root, Portal, Toast, menu, tooltip, right-panel, settings, and dynamic-composer fixtures;
- Enhanced and Conservative user-facing compatibility strategies;
- redacted local diagnostics, lifecycle ring, ZIP export, and Windows report form.

### Gate 2: Companion Core — implemented

- public `codex-styler-companion-v1` Schema and `.codex-styler-companion` archive;
- validated import/export, local app-data persistence, legacy `frameAngles` migration, and theme recommendations;
- still-image, image-sequence, video, and atlas inputs converted into logical frames;
- shared crop, baseline, controllable local color cleanup, non-destructive masks, and Worker processing;
- calibrated poses, pose-aware idle clips, paged atlas packing, 48 MiB decoded-page target, and two-page runtime LRU;
- six built-in companions migrated to the calibrated runtime model.

### Gate 3: Creator Experience — refined for Beta 3

- seven-step Companion Studio with autosave, recovery, undo/redo, step reset, and project reset;
- visual atlas grid, direction dial, exact angle binding, direction curve, idle and exclusion tracks;
- reverse/exclude tools, calibration warnings, pointer test, drag/snap behavior, and reduced-motion output;
- Built-in / My Companions library with create, edit draft, import, export, delete, and dedicated portraits;
- English and Simplified Chinese creator layouts and keyboard-accessible direction controls.
- compact master-detail theme and companion libraries, focused editor workspaces, and consistent application status;
- multi-scenario theme previews, persisted editor workspace preferences, and a compact continuous Settings experience.

### Gate 4: Beta Hardening — in progress

- browser E2E for the manager and creator, plus four committed locale/appearance/viewport screenshot baselines;
- Codex DOM fixtures for home, task, settings, right panel, dynamic composer, and top-level overlays;
- package, migration, revision race, cleanup, calibration, page-cache, updater-channel, and Rust lifecycle tests;
- macOS Apple Silicon local build and install evidence;
- Windows 11 x64 community device evidence: still required before RC and not claimed by either Beta build;
- dependency audits, package-size checks, complete upgrade/restore/uninstall evidence, and P0/P1 closure.

## Release sequence

1. `v0.2.0-beta.1`: functionally complete Creator Beta; macOS local validation; Windows CI build marked as awaiting community validation.
2. `v0.2.0-beta.2`: Companion Studio refinement, safer import and editing, corrected portraits, and localized pre-download update notes.
3. `v0.2.0-beta.3`: professional product-coherence pass for application state, resource libraries, focused workspaces, Settings, typography, and responsive visual regression.
4. `v0.2.0-rc.1`: at least two independent complete macOS and Windows device runs; no P0/P1; migration, upgrade, and recovery pass.
5. `v0.2.0`: only when RC evidence supports it.

## v1 Stable

- macOS Developer ID signing and notarization;
- Windows Authenticode signing;
- signed updater metadata, checksums, SBOM, and build provenance;
- no high-severity dependency findings;
- complete restore, rollback, upgrade, and clean-device acceptance on both supported platforms.

## Later, only after evidence

- multiple interactive entities;
- video backgrounds;
- built-in WebGL / 3D renderer;
- community theme or companion index;
- cloud sync, accounts, or an online store;
- additional architectures and Linux.
