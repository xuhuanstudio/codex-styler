# Release process

Codex Styler does not call an unsigned artifact “stable.” Alpha and beta previews must be labelled unsigned in both the filename and release notes.

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

Signing credentials and real-device evidence are intentionally not committed to this repository. Until those are supplied, the repository remains an alpha foundation rather than a v1 Stable release.
