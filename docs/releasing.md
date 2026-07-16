# Release process

Codex Styler does not call an unsigned artifact “stable.” Alpha and beta previews must be labelled unsigned in both the filename and release notes.

## macOS Alpha previews

Preview releases are started by a deliberate version-tag push, not by every merge to `main`:

1. synchronize all versions and add `.github/release-notes/v<version>.md`;
2. run `pnpm check:release-version <version>` and the normal test/audit suite;
3. create and push an annotated `v<version>` tag that matches `v*-alpha.*`;
4. let `preview-release.yml` produce an ad-hoc signed Apple Silicon DMG, SHA-256 checksums, SPDX SBOM, and GitHub attestations;
5. inspect the generated draft release and download the assets to verify the published checksum;
6. only then publish the draft as a GitHub Pre-release.

Ad-hoc signing is not Developer ID signing and does not provide notarization. It is used only to keep downloaded Apple Silicon previews structurally valid. Release notes and filenames must continue to say `unsigned` until Developer ID signing and notarization are enabled.

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
