# Architecture

Codex Styler is a local desktop manager around a data-only theme format. It does not patch Codex, replace `app.asar`, alter the application signature, or install a resident agent.

```text
React manager/editor
        │ validated commands
        ▼
Tauri command boundary ── theme package validator
        │
        ├── Codex detector and managed launcher
        └── CDP compatibility adapter
                    │
                    ▼
          isolated scene runtime
          (one idempotent root)
```

## Boundaries

- **Desktop manager** owns onboarding, theme editing, local storage, import/export, and recovery controls.
- **Theme core** owns the public schema, archive limits, validation, and renderer-neutral types.
- **Compatibility adapter** is the only layer allowed to know Codex DOM details. Unknown versions default to safe background-only mode.
- **Scene runtime** renders isolated background and pointer-aware entities. Its root uses `pointer-events: none` and can be removed in one operation.

Theme packages are portable data. They cannot invoke Tauri commands, execute scripts, request remote resources, or reference arbitrary local paths.

## Managed Codex lifecycle

1. Detect the installed Codex application and whether a Codex process is already running.
2. Select an unused random loopback port.
3. Launch Codex with the debugging port only after the user chooses to start a managed session.
4. Query the loopback `/json/list` endpoint and connect only to an expected page target from that process.
5. Inject a versioned, idempotent runtime root.
6. Pause or restore by removing every Styler-owned node and disconnecting.

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

- `safe`: isolated background and scene layers only;
- `semantic`: known adapter rules may style approved semantic surfaces;
- `blocked`: a confirmed incompatible version cannot be themed.

The compatibility matrix records only versions tested on real hardware. A successful build alone is not compatibility evidence.
