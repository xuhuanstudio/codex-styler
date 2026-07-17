# Release process

Codex Styler does not call an unsigned artifact “stable.” Alpha and beta previews must be labelled unsigned in both the filename and release notes.

## Cross-platform preview channels

Preview releases are started by a deliberate version-tag push, not by every merge to `main`:

1. synchronize all versions and add `.github/release-notes/v<version>.md`;
2. run `pnpm check:release-version <version>` and the normal test/audit suite;
3. create and push an annotated tag matching `v*-alpha.*`, `v*-beta.*`, or `v*-rc.*`;
4. let `preview-release.yml` produce an ad-hoc signed Apple Silicon DMG, an unsigned Windows x64 NSIS installer, Tauri-signed updater artifacts, a two-platform update manifest, SHA-256 checksums, an SPDX 2.3 export of GitHub's dependency graph, and GitHub attestations;
5. inspect the generated draft release and download the assets to verify the published checksum;
6. only then publish the draft as a GitHub Pre-release.

Updater channel progression is monotonic: Alpha may receive Beta, RC, or stable; Beta receives only a newer Beta, RC, or stable; RC receives only a newer RC or stable; stable receives stable releases only. Each release carries its own signed `latest.json`, and the application selects the newest GitHub Release allowed by its current channel before verifying that manifest.

Ad-hoc signing is not Developer ID signing and does not provide notarization. It is used only to keep downloaded Apple Silicon previews structurally valid. The Windows installer is not Authenticode-signed. Release notes and installer filenames must continue to say `unsigned` until the corresponding platform signing and notarization requirements are enabled.

The preview build passes macOS `signingIdentity: "-"` to Tauri so the executable and application bundle are ad-hoc signed before Tauri creates the DMG and updater archive. Do not replace this with a post-build signature: doing so would leave the already-created DMG and updater archive carrying the stale bundle signature.

## Stable prerequisites

- macOS Developer ID Application certificate and notarization credentials;
- Windows Authenticode code-signing identity;
- Tauri updater signing key stored only as a GitHub Actions secret;
- protected `release` GitHub Environment with required reviewer approval;
- current SBOM, checksums, dependency audits, asset-license inventory, and real-device compatibility results.

## Checklist

1. Update versions in the root workspace, desktop app, site metadata, Cargo package, and Tauri config.
2. Update `CHANGELOG.md`, `COMPATIBILITY.md`, and release notes.
3. Run `pnpm check`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo test`.
4. Test install, first launch, managed Codex launch, apply, pause, restore, sleep/wake, upgrade, and uninstall on real macOS Apple Silicon and Windows 11 x64 devices.
5. Confirm private vulnerability reporting is enabled and no high-severity dependency finding is open.
6. Build signed bundles in the protected release environment and verify signatures on clean devices.
7. Generate SHA-256 checksums and CycloneDX/SPDX SBOMs.
8. Publish a draft release, independently review it, then publish.

Signing credentials and real-device evidence are intentionally not committed to this repository. Until those are supplied, 0.2 remains a clearly marked unsigned Beta/RC and must not be described as v1 Stable.
