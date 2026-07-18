<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/site/public/media/codex-styler-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="apps/site/public/media/codex-styler-logo-light.png">
    <img src="apps/site/public/media/codex-styler-logo-light.png" width="112" alt="Codex Styler icon">
  </picture>
</p>

<h1 align="center">Codex Styler</h1>

<p align="center">
  <strong>An open-source Codex theme editor and Codex skin creator for OpenAI Codex Desktop.</strong><br />
  Safe, reversible, local-first, and deliberately unofficial.
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/xuhuanstudio/codex-styler/releases/tag/v0.2.0-beta.5">Download Beta</a> ·
  <a href="https://xuhuanstudio.github.io/codex-styler/">Website</a> ·
  <a href="https://xuhuanstudio.github.io/codex-styler/docs/getting-started/">Documentation</a>
</p>

<p align="center">
  <a href="https://github.com/xuhuanstudio/codex-styler/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/xuhuanstudio/codex-styler/ci.yml?branch=main&label=CI&style=flat-square"></a>
  <a href="https://github.com/xuhuanstudio/codex-styler/releases/tag/v0.2.0-beta.5"><img alt="Preview version" src="https://img.shields.io/badge/preview-v0.2.0--beta.5-2563EB?style=flat-square"></a>
  <a href="LICENSE"><img alt="Apache-2.0" src="https://img.shields.io/badge/code-Apache--2.0-365443?style=flat-square"></a>
  <a href="ASSET_LICENSES.md"><img alt="CC BY 4.0 assets" src="https://img.shields.io/badge/art-CC%20BY%204.0-9B6E3F?style=flat-square"></a>
  <img alt="macOS and Windows" src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-555D57?style=flat-square">
</p>

> [!IMPORTANT]
> Codex Styler 0.2 is a Creator Beta. The macOS DMG is ad-hoc signed but not notarized, and the Windows EXE is not Authenticode-signed. Windows Beta 5 retains the rebuilt Store launch and bounded restart lifecycle and still awaits community real-device verification; v1 Stable remains gated on complete evidence and platform code signing.

![Gilded Grandeur Codex theme with the Reset God companion](docs/media/codex-theme-gilded-grandeur.webp)

<p align="center"><sub><strong>Gilded Grandeur + Reset God</strong> — a live Codex Desktop workspace styled by Codex Styler.</sub></p>

## Themes that reshape Codex

Codex Styler treats a Codex theme as a coordinated visual system—not a background swap. Semantic surfaces, navigation, icons, borders, depth, motion, the composer, and an optional companion change together while the familiar Codex structure remains intact.

![Merry Big Top Codex skin with the Token Thief companion](docs/media/codex-theme-merry-big-top.webp)

<p align="center"><sub><strong>Merry Big Top + Token Thief</strong> — the same Codex skeleton, rebuilt with a different color, material, motion, and companion direction.</sub></p>

## Meet the companions

Companions are draggable, pointer-aware, and independent from themes. A built-in theme can recommend a pairing, but you can combine any companion with any visual system—or use no companion at all.

<table>
  <tr>
    <td align="center" width="33%"><img src="docs/media/companions/moss-chameleon.webp" width="180" alt="Moss, the green chameleon Codex companion"><br><strong>Moss</strong><br><sub>Curious chameleon</sub></td>
    <td align="center" width="33%"><img src="docs/media/companions/reset-god.webp" width="180" alt="Reset God, the gilded Codex companion"><br><strong>Reset God</strong><br><sub>Gilded calm</sub></td>
    <td align="center" width="33%"><img src="docs/media/companions/token-thief.webp" width="180" alt="Token Thief, the circus clown Codex companion"><br><strong>Token Thief</strong><br><sub>Circus mischief</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/media/companions/pico-parrot.webp" width="180" alt="Pico, the red parrot Codex companion"><br><strong>Pico</strong><br><sub>Expressive parrot</sub></td>
    <td align="center"><img src="docs/media/companions/puddle-frog.webp" width="180" alt="Puddle, the blue frog Codex companion"><br><strong>Puddle</strong><br><sub>Grounded frog</sub></td>
    <td align="center"><img src="docs/media/companions/mochi-cat.webp" width="180" alt="Mochi, the orange cat Codex companion"><br><strong>Mochi</strong><br><sub>Warm orange cat</sub></td>
  </tr>
</table>

## Why Codex Styler

OpenAI Codex Desktop already includes useful appearance controls and Pets. Codex Styler focuses on the layer they do not cover: image-led environments, restrained material styling, and replaceable 2D entities that can react to the pointer.

- **Reversible runtime:** launches Codex with a temporary loopback CDP session; never edits <code>app.asar</code>, application resources, or signatures.
- **Image-adaptive creator:** import a local PNG, JPEG, or WebP and Styler derives luminance, dominant color, accent, and contrast before fitting the image to one of four curated visual systems. You can then refine layout, icon treatment, details, surfaces, radius, motion, and companion placement without authoring CSS.
- **Companion Studio:** turn a still image, naturally sorted sequence, short video, or existing atlas into calibrated pointer directions and pose-aware idle motion through a visual timeline and direction dial—without editing atlas coordinates or JSON.
- **Open scene model:** themes declare <code>layers[]</code>, <code>entities[]</code>, a renderer, and behaviors instead of reaching into Codex DOM internals.
- **Data-only packages:** local raster assets and JSON; no scripts, arbitrary CSS, SVG, video, remote URLs, or executable fonts.
- **Local-first:** no account, telemetry, cloud sync, or online store; optional update checks only contact GitHub Releases.
- **Bilingual from v1:** English and Simplified Chinese in the desktop app, repository, and documentation site.

### One manager, light or dark

The Codex Styler manager follows the system or uses an explicit light or dark appearance. Its interface appearance is independent from the theme applied to Codex.

<table>
  <tr>
    <td align="center" width="50%"><a href="docs/media/manager-light.webp"><img src="docs/media/manager-light.webp" alt="Codex Styler desktop manager in light mode"></a><br><sub>Light</sub></td>
    <td align="center" width="50%"><a href="docs/media/manager-dark.webp"><img src="docs/media/manager-dark.webp" alt="Codex Styler desktop manager in dark mode"></a><br><sub>Dark</sub></td>
  </tr>
</table>

## Built-in themes

| Theme           | Direction                                            | Interaction                  |
| --------------- | ---------------------------------------------------- | ---------------------------- |
| Native Refined  | Low-distraction calibration of the native workspace  | Moss + restrained motion     |
| Gilded Grandeur | Obsidian architecture and controlled gilded detail   | Reset God + golden parallax  |
| Merry Big Top   | Playful circus color and rounded theatrical surfaces | Token Thief + buoyant motion |
| Nocturne Studio | Ink-dark architecture, smoked glass, and amber light | Moss + cinematic parallax    |
| Quiet Garden    | Soft natural depth and readable translucent surfaces | Moss + natural parallax      |

Companions are selected independently from themes. Native Refined, Nocturne Studio, and Quiet Garden recommend **Moss**; Gilded Grandeur recommends **Reset God**; Merry Big Top recommends **Token Thief**. **Pico**, **Puddle**, and **Mochi** remain available from the companion library. Choosing another companion or **No companion** becomes an explicit preference and is never overwritten by later theme changes. Each video-derived companion uses a calibrated, non-linear direction map instead of assuming constant source-video speed; natural pose changes remain intact, while every frame shares one lossless-alpha crop and ground line. Companions can be dragged freely or snapped to a semantic Codex surface, and a resize observer keeps them attached when the composer changes height.

Every shipped image and sprite is original project artwork. The reference repositories are studied for ideas only; their assets and source are not redistributed.

## Download Creator Beta 5

- **[macOS 13+ / Apple Silicon — DMG](https://github.com/xuhuanstudio/codex-styler/releases/download/v0.2.0-beta.5/Codex-Styler_0.2.0-beta.5_aarch64-unsigned.dmg)**
- **[Windows 11 / x64 — installer EXE](https://github.com/xuhuanstudio/codex-styler/releases/download/v0.2.0-beta.5/Codex-Styler_0.2.0-beta.5_x64-unsigned-setup.exe)**

On macOS, open the DMG, drag Codex Styler to Applications, then Control-click the app and choose **Open** on first launch. On Windows, SmartScreen may warn because this Beta does not yet have an Authenticode certificate; inspect the published checksum and provenance before continuing. Never disable Gatekeeper or SmartScreen globally.

The [pre-release page](https://github.com/xuhuanstudio/codex-styler/releases/tag/v0.2.0-beta.5) includes SHA-256 checksums, an SPDX SBOM, build attestations, updater artifacts, tested scope, and known limitations. Intel macOS is not included. Windows Beta 5 is CI-built and structurally verified but remains marked as awaiting community real-device validation.

## Run from source

### Requirements

- Node.js 22 or newer
- pnpm 11 or newer
- Rust stable
- OpenAI Codex Desktop for real runtime testing

```bash
pnpm install
pnpm check
pnpm tauri dev
```

Run only the browser-based interface:

```bash
pnpm dev
```

Run the bilingual documentation site:

```bash
pnpm dev:site
```

## Safety model

Codex Styler reserves a random port on <code>127.0.0.1</code>, starts the installed Codex executable with that temporary debugging port, validates the returned page target, and injects one idempotent scene root plus one style node. Restore removes both.

The default **Enhanced mode** first applies the complete semantic treatment—including navigation, content surfaces, composer, dialogs, and the thread summary panel—then checks live anchors and computed styles. A different Codex version is informational, not a failure. Styler falls back only when the runtime health check detects an actual structural or rendering problem. **Conservative mode** always limits styling to the isolated background and scene layer. When Codex is already open, Styler asks for confirmation before restarting it. On Windows, where the packaged app may turn a normal close request into a background hide, Styler waits first and then terminates only the verified Codex UI process tree covered by that confirmation.

See [the security model](docs/security-model.md), [theme package specification](docs/theme-format.md), [companion creation guide](docs/creating-companions.md), [companion package specification](docs/companion-format.md), [diagnostics guide](docs/diagnostics.md), and [security policy](SECURITY.md).

## Data-only package formats

A <code>.codex-styler-theme</code> file is a validated ZIP containing:

```text
theme.json
LICENSES.json
assets/*.png | *.jpg | *.webp
previews/*.png | *.jpg | *.webp
```

The public format identifier is <code>codex-styler-theme-v1</code>. The JSON Schema and TypeScript interfaces live in <code>packages/theme-core</code>.

A <code>.codex-styler-companion</code> archive uses <code>codex-styler-companion-v1</code> and stores calibrated poses, pose-aware idle clips, paged atlases, a dedicated portrait, and licenses. Source videos and local project history are never exported.

Validate a manifest or package:

```bash
pnpm theme:validate path/to/theme.json
pnpm theme:validate path/to/theme.codex-styler-theme
pnpm package:validate path/to/companion.codex-styler-companion
```

## Project structure

```text
apps/desktop          React editor + Tauri desktop shell
apps/site             Astro bilingual website and documentation
packages/theme-core   Theme schema, validation, archives, built-in themes
docs                  Architecture, safety, assets, and decisions
```

The runtime is intentionally split into four boundaries:

1. Desktop manager
2. Theme engine
3. Versioned Codex adapter
4. Injected scene runtime

Theme packages never contain Codex selectors. Compatibility-sensitive behavior stays inside the adapter.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Original themes, accessibility improvements, adapter fixtures, documentation, and real-device compatibility reports are especially useful.

Please report security issues through GitHub private vulnerability reporting, not a public issue.

## Status and roadmap

The repository is now in Reliability & Creator Beta. The next public gates are:

- two independent Windows 11 x64 Beta diagnostics and complete macOS/Windows RC acceptance
- migration, upgrade, recovery, screenshot, and performance evidence for RC
- signed and notarized v1 Stable on both platforms

See [ROADMAP.md](ROADMAP.md) and [COMPATIBILITY.md](COMPATIBILITY.md).

## Licensing and trademark notice

Code is licensed under [Apache-2.0](LICENSE). Original bundled artwork is licensed under [CC BY 4.0](ASSET_LICENSES.md).

Codex Styler is not affiliated with, endorsed by, or sponsored by OpenAI. OpenAI and Codex are trademarks of OpenAI, L.L.C.; their names are used only to describe compatibility.
