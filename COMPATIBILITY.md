# Compatibility

Compatibility is claimed only after real-device validation.

| Platform   | Architecture  | Beta 9 status                                                                   | RC requirement                            |
| ---------- | ------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| macOS 13+  | Apple Silicon | Ad-hoc signed Beta; multi-page CDP restart/apply verified on an affected device | Two complete real-device runs             |
| Windows 11 | x64           | CI-built unsigned Beta; lifecycle fixes await community device evidence         | Two complete independent real-device runs |
| macOS      | Intel         | Not verified                                                                    | Out of 0.2 scope                          |
| Windows    | ARM64         | Not verified                                                                    | Out of 0.2 scope                          |
| Linux      | —             | Unsupported                                                                     | Out of 0.2 scope                          |

## Codex versions and runtime strategy

Codex Styler does not treat every new Codex Desktop build as incompatible.

- **Enhanced** is the default. It applies the complete semantic theme first, then verifies application-root anchors, visible surfaces, stacking, stylesheet presence, and readable computed styles. A different version number is informational. Only an actual health failure falls back to the isolated background, scene, and companion layer.
- **Conservative** always applies only the isolated background, scene, and companion. It is appropriate while investigating an adapter regression.
- A force-semantic developer mode remains an internal development input and is not exposed to normal users.

The health check runs after initial application and again after Codex route or DOM reconstruction. Settings, dialogs, alert dialogs, menus, listboxes, tooltips, toasts, the right-side task panel, and dynamically recreated composers retain their native application or Portal layer. Restore removes all Styler roots and attributes in one operation.

The semantic adapter currently has direct fixture evidence for Codex versions `26.707.72221` and `26.707.91948`. A version enters the public tested matrix only after detection, launch, application, route changes, companion update, pause, restore, normal restart, and the supported-platform lifecycle are verified on a real device.

Beta 9 also has focused Apple Silicon evidence for Codex `26.715.61943` in a
multi-page CDP session where an avatar-overlay page preceded the main
workspace. Managed restart and theme application succeeded after the target
selection fix. This focused regression run is recorded separately and does not
claim the complete lifecycle evidence required to add that Codex version to the
public tested matrix.

Codex Styler does not promise permanent compatibility with every Codex release. Run Settings → **Diagnostics & compatibility**, preview the redacted report, and attach the exported ZIP manually to a compatibility issue when reporting a regression.

## Installation discovery

Automatic discovery remains primary. On Windows it checks Microsoft Store packages, standard per-user and system locations, and verified running Codex UI processes while rejecting CLI and resource processes. On macOS it checks the supported application bundles and running desktop process. A validated custom executable or application path in Settings is a fallback for nonstandard installations, not a required setup step.
