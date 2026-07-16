# Third-party notices

Codex Styler depends on open-source libraries whose copyrights and licenses remain with their respective authors.

Direct runtime dependencies include React, Tauri, Ajv, JSZip, Lucide, Reqwest, Tokio Tungstenite, Sysinfo, Astro, and the Astro sitemap integration. They are used under their published open-source licenses; exact resolved versions are recorded in `pnpm-lock.yaml` and `apps/desktop/src-tauri/Cargo.lock`.

Release builds must generate a complete transitive license inventory and SBOM from those lockfiles. Apache-2.0 and MIT license texts required by bundled dependencies must ship with the desktop distribution. This file is not permission to omit a dependency's own required notice.

No source code or asset from `Fei-Away/Codex-Dream-Skin` or `xplol/KaMenisACat` is included. The repositories were used only as conceptual references. At the time of the initial review, `KaMenisACat` did not provide a root license, so its contents are treated as all-rights-reserved by default.
