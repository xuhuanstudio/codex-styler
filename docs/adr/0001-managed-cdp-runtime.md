# ADR 0001: Managed CDP runtime instead of application patching

- Status: Accepted
- Date: 2026-07-16

## Context

Codex Styler needs to render a scene behind the Codex interface while preserving the official installation and making recovery immediate. Patching Electron archives or signatures would be brittle, invasive, and difficult to explain safely to non-technical users.

## Decision

Styler launches a user-approved, managed Codex process with a random loopback debugging port. It connects only to an expected page target from that session and injects one versioned, idempotent root. Themes remain data-only. DOM selectors and semantic overrides are owned exclusively by compatibility adapters.

## Consequences

- Restore is removal and disconnect, not file repair.
- An already running Codex instance cannot be themed silently; a restart flow requires explicit confirmation.
- Compatibility must be tested per Codex version.
- The local debugging port is a security-sensitive capability and must never bind beyond loopback.
- Unknown versions can still receive an isolated safe-mode scene, while semantic styling stays disabled.

## Rejected alternatives

- Modifying `app.asar` or the signed application bundle.
- Shipping arbitrary CSS or JavaScript plugins.
- Installing a persistent proxy or background service.
- Exposing a fixed debugging port or attaching to any discoverable Electron target.
