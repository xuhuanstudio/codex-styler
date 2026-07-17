# Architecture

Codex Styler is a local desktop manager around a data-only theme format. It does not patch Codex, replace `app.asar`, alter the application signature, or install a resident agent.

```text
React manager, theme editor, and Companion Studio
        │ validated commands
        ▼
Tauri command boundary ── theme package validator
        │
        ├── app-data theme, companion, project, and diagnostics storage
        ├── Codex detector and managed launcher
        └── CDP compatibility adapter
                    │
                    ▼
          isolated scene runtime
          (one idempotent root)
```

## Boundaries

- **Desktop manager** owns onboarding, theme and companion libraries, visual editing, app-data indexes, import/export, diagnostics, and recovery controls.
- **Theme core** owns both public package schemas, archive limits, validation, legacy migration, and renderer-neutral types.
- **Compatibility adapter** is the only layer allowed to know Codex DOM details. Enhanced mode attempts semantic application and falls back only after a live health failure; Conservative mode stays isolated.
- **Scene runtime** renders isolated background and pointer-aware entities. Its root uses `pointer-events: none` and can be removed in one operation.

Theme packages are portable data. They cannot invoke Tauri commands, execute scripts, request remote resources, or reference arbitrary local paths.

## Managed Codex lifecycle

1. Detect the installed Codex application and whether a verified Codex UI process is already running. A custom path is a validated fallback.
2. Select an unused random loopback port.
3. Launch Codex with the debugging port only after the user chooses to start a managed session.
4. Query the loopback `/json/list` endpoint and connect only to an expected page target from that process.
5. Inject a versioned, idempotent runtime root.
6. Apply a revisioned configuration. Theme changes update the complete configuration; companion and placement changes update only the entity root.
7. Pause or restore by removing every Styler-owned node, attribute, listener, cache, and connection state.

The user-visible lifecycle is `disconnected → restart-required → launching → connected → applying → applied / paused / fallback / error`. Every apply increments a revision, and a response from an older revision cannot overwrite the latest selection.

## Companion project pipeline

Source media is copied to the Tauri application-data directory and represented by `codex-styler-companion-project-v1`. Image work runs in a Worker when available and falls back to small UI-yielding batches. Extracted frames share crop, scale, and ground geometry; direction anchors and idle clips compile into a data-only `.codex-styler-companion` package. Original video and edit history remain local.

The runtime lazily decodes the current atlas page and one neighbor. Each page targets no more than 48 MiB decoded RGBA area, and the LRU never retains more than two pages for the active companion.

See [ADR 0001](adr/0001-managed-cdp-runtime.md) for the decision record.

## Repository layout

```text
apps/desktop/       React manager and Tauri host
apps/site/          Astro documentation and project site
packages/theme-core public types, schema, archive validator, CLI
docs/               architecture, security, protocol, assets, ADRs
.github/             CI, security analysis, issue and PR workflows
```

## Compatibility policy

Compatibility is explicit rather than assumed:

- `conservative`: isolated background, scene, and companion layers only;
- `enhanced`: adapter rules may style approved semantic surfaces, with automatic fallback after a measured health failure;
- `blocked`: a confirmed incompatible version cannot be themed.

Version changes alone never select fallback. The compatibility matrix records only versions tested on real hardware. A successful build, a DOM fixture, or a community report without diagnostics is not compatibility evidence.
