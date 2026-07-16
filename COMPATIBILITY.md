# Compatibility

Compatibility is claimed only after real-device validation.

| Platform | Architecture | Current status | Release target |
| --- | --- | --- | --- |
| macOS 13+ | Apple Silicon | Installable unnotarized Alpha preview; runtime verification continuing | Alpha |
| macOS | Intel | Not yet verified | Post-Alpha |
| Windows 11 | x64 | Implementation present; real-device test pending | Beta |
| Windows | ARM64 | Not yet verified | Later |
| Linux | — | Out of scope for v1 | Unplanned |

## Codex versions

Codex Styler does not treat every new Codex Desktop build as incompatible. In the
default **Automatic** strategy it first applies semantic styling, verifies the
required anchors and resulting surface styles, and falls back to the isolated
compatibility layer only when that health check fails. The runtime repeats the
check after Codex redraws its interface.

Users can select **Compatibility mode** to always use isolated background and
scene layers, or **Developer mode** to force semantic styling without automatic
fallback. Developer mode is intended for adapter development and can produce a
partially styled or unreadable interface; Restore official remains available.

A version is added to the tested matrix only after detection, launch, injection,
route changes, pause, restore, and normal restart are verified.

The semantic adapter currently recognizes `26.707.72221` and `26.707.91948`. For
`26.707.91948`, the adapter selector signatures were verified directly against the
installed application resources on macOS. Full release-chain verification remains
part of the Alpha acceptance checklist.

Codex Styler does not promise permanent compatibility with every Codex release.
