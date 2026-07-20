# Security and recovery model

Codex Styler is designed so a failed theme can be removed without repairing or reinstalling Codex.

## Protected assets

- the Codex installation, signature, settings, and user data;
- local project content visible inside Codex;
- the user's filesystem outside Codex Styler's application-data directory;
- the integrity of imported theme packages and release updates.

## Trust boundaries

| Boundary          | Untrusted input                         | Control                                                            |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Theme import      | ZIP paths, manifest values, image bytes | Schema, allowlist, magic bytes, size and traversal checks          |
| Codex connection  | local CDP targets                       | random loopback port, managed process, expected page target        |
| Injected runtime  | theme data                              | JSON serialization, no script fields, one removable root           |
| Composer settings | visible native configuration options    | semantic discovery, explicit confirmation, write-back verification |
| Desktop commands  | webview calls                           | Tauri capability allowlist and typed command surface               |
| Updates           | GitHub release metadata                 | opt-in checks and signed updater artifacts for stable releases     |

## Theme package controls

The v1 package accepts only `theme.json`, `LICENSES.json`, and local PNG, JPEG, or WebP files under `assets/` or `previews/`. It rejects scripts, CSS, SVG, fonts, video, executables, remote URLs, absolute paths, backslashes, traversal segments, misleading image signatures, and undeclared files.

Limits are enforced during import:

- 50 MiB compressed archive;
- 100 MiB extracted total;
- 20 MiB per file;
- 8192×8192 per image;
- at most 32 declared assets and one interactive entity in v1.

## Recovery guarantees

`Pause` removes Styler's live scene while retaining the managed connection. `Restore official` removes the entire Styler root and disconnects. No injected code is persisted in Codex. If Styler itself crashes, closing the managed Codex window and reopening Codex normally starts without the injected scene.

When applying a theme requires a managed restart, the desktop UI explains the consequence and requires confirmation before sending the operating system's normal quit request. On macOS, a failed normal quit stops the operation. On Windows, the packaged app can interpret the close request as hide/minimize; after a bounded wait, Styler may terminate only the verified Codex UI process tree covered by the user's restart confirmation. CLI processes and unrelated applications are excluded from desktop-process detection.

## Known limits

CDP is a powerful local debugging interface. Styler exposes it only on loopback for a process it starts, but other software running as the same OS user may still be able to probe local ports. Do not run untrusted local software alongside a managed session.

Codex releases can change page structure independently of their version number. Enhanced mode applies the semantic adapter, verifies required anchors and computed surface styles, and falls back to the isolated scene layer only when a runtime health check fails or a later redraw removes the injected runtime. A version mismatch alone is informational and does not trigger fallback. Conservative mode always uses the isolated layer and does not apply semantic interface styling.

Composer Interactions only inspect the model, reasoning-effort, and speed options exposed by Codex's visible native configuration control. They do not read, change, or submit prompt content. Every play produces a complete configuration diff and requires explicit confirmation. The adapter writes all three fields through the native control and accepts success only after reading the same values back. If the current control cannot be interpreted reliably, Styler does not guess a selector or silently change a setting and keeps an explicit path back to the official control.

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting entry described in [SECURITY.md](../SECURITY.md). Include the affected version, reproduction steps, and whether Codex or local files were exposed.
