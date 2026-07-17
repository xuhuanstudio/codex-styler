# Diagnostics and compatibility reports

Settings → **Diagnostics & compatibility** runs local checks for installation discovery, the matching process, loopback CDP state, runtime adapter result, recovery availability, and updater configuration. The result is previewed before export.

The exported ZIP contains:

```text
diagnostics.json
summary.txt
```

It excludes chat and project content, DOM text, page titles, usernames, full paths, machine identifiers, and source media. The lifecycle ring contains at most the latest 80 actions with a redacted outcome and duration. Codex Styler does not upload the report; the user attaches it manually to a GitHub issue.

For Windows discovery or restart problems, use the dedicated Windows compatibility issue form and attach the ZIP. A custom application path in Settings is a fallback for nonstandard installations; automatic discovery of Store packages, standard install locations, and a verified running process remains the first choice.
