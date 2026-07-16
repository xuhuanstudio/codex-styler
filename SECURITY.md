# Security policy

## Supported versions

Codex Styler is pre-1.0. Only the newest tagged Alpha or Beta and the current <code>main</code> branch receive security fixes.

## Report a vulnerability

Use GitHub private vulnerability reporting for:

- arbitrary code or CSS execution through a theme package;
- archive traversal, decompression abuse, MIME confusion, or unsafe asset loading;
- attachment to an unrelated browser or debugging target;
- exposure of a non-loopback CDP endpoint;
- sensitive information written to diagnostics;
- updater or release-signing issues.

Do not open a public issue, include proof-of-concept payloads in public logs, or contact unrelated OpenAI support channels.

Include:

- affected revision or release;
- operating system and architecture;
- minimal reproduction;
- impact and preconditions;
- suggested mitigation, if known.

## Security boundary

Codex Styler is an unofficial tool that launches the installed Codex Desktop application with a temporary local debugging port. It does not make Codex itself a supported security boundary and does not bypass Codex authentication or permissions.

