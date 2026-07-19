# Product Quality Execution Plan

Codex Styler is moving from a feature-complete Beta toward a dependable,
ordinary-user product. This plan turns visual completion, usability, and
functionality into evidence gates instead of an open-ended polish backlog.

## Product promise

An ordinary Codex Desktop user should be able to:

1. understand what Styler changes and how to restore the official interface;
2. choose a theme and an optional independent companion;
3. start or reconnect Codex through one clearly named action;
4. see whether the selected setup is pending, applying, active, paused,
   degraded, or in error;
5. recover from a failed launch, lost connection, incompatible interface, or
   invalid package without reading source code or editing configuration files.

Creators should additionally be able to build, inspect, correct, validate,
save, export, and reinstall a theme or companion without destructive edits.

## Decision rule

Every product change must pass all four checks before it is retained:

- **Clarity:** the next action and its result are easier to understand;
- **Efficiency:** the common task uses no more decisions or navigation;
- **Resilience:** errors remain recoverable and do not destroy user work;
- **Evidence:** the improvement is visible in a task test, fixture assertion,
  screenshot comparison, or real-device run.

A visually different result is not evidence of improvement. If a change only
spreads sparse content, enlarges decoration, duplicates state, or hides a
working control behind another page, revert it.

## Quality scorecard

| Area                        | Release threshold                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| First successful setup      | No documentation required; one guided flow; one final apply action                                                 |
| Application model           | One selected theme, one variant, one independent companion, one placement, one runtime policy                      |
| Runtime feedback            | Pending, applying, applied, paused, fallback, and error are visually and textually distinct                        |
| Recovery                    | Every launch, connection, package, update, and compatibility error exposes a safe next action                      |
| Compact layout              | All supported tasks remain operable at 960×680 without overlap or hidden primary actions                           |
| Desktop layout              | Home and resource libraries use the 1320×840 first viewport efficiently without artificial empty regions           |
| Readability                 | Text adapts to its actual surface; light/dark, theme imagery, overlays, dialogs, and right panels remain legible   |
| Keyboard and assistive tech | Named controls, visible focus, logical order, focus restoration, and decorative previews excluded from navigation  |
| Responsiveness              | Loaded companion updates target <500 ms; connected theme application targets <2 s                                  |
| Data safety                 | Drafts autosave locally; destructive reset/delete requires confirmation; restore is always available               |
| Verification                | Unit/integration, browser E2E, paired screenshots, fixture injection, and real-device evidence all pass their gate |

## Beta 6 — ordinary-user foundation

### Workstream 1: activation and application clarity

- replace page-specific application cards with one persistent setup bar;
- show the selected theme, companion, runtime state, connection state, safest
  primary action, and official restore in that bar;
- use `Start Codex & apply` only while disconnected, `Apply changes` while
  connected, and `Restart Codex & apply` only when a new controlled session is
  required;
- make first run a safety check → setup choice → review and apply journey;
- block progression while installation detection is incomplete and route a
  missing install to the validated Settings fallback.

### Workstream 2: library comprehension

- keep Themes and Companions structurally symmetrical;
- use an explicit list → detail flow at compact sizes instead of silently
  removing the preview or squeezing two unusable columns together;
- keep theme recommendation separate from the user's explicit companion
  selection;
- keep import, create, export, delete, and edit attached to the resource they
  affect.

### Workstream 3: visual and accessibility convergence

- use one neutral manager design system in light and dark appearances;
- converge type sizes, spacing, control heights, focus states, scroll chrome,
  Toast placement, and modal layering;
- make miniature Codex previews decorative unless placement editing is active;
- verify English and Simplified Chinese at 1320×840, 960×680, and a tall
  1600×1000 Home viewport.

### Beta 6 exit evidence

- first-run flow applies the reviewed configuration in an automated test;
- only one global primary application action is present outside editors;
- compact resource selection reaches a usable detail view and can return to
  the list;
- screenshot baselines are individually reviewed before being updated;
- production build, type check, unit/integration tests, and browser E2E pass.

### Beta 6 implementation evidence

- Home, Themes, and Companions now defer application guidance and runtime state
  to the single persistent setup bar instead of repeating instructions;
- reopening the setup guide preserves an explicitly selected companion and uses
  return-visit copy instead of claiming it is the user's first setup;
- compatibility copy explains when verification happens without presenting a
  version change as a failure;
- Home, the persistent setup bar, and the top compatibility indicator now use
  one tested presentation model for ready, restart-required, applying, active,
  paused, fallback, missing-install, and error states. A missing install routes
  to Codex location settings instead of repeating a launch that cannot work;
- a successfully applied Enhanced session is no longer mislabeled as
  Conservative mode when the runtime reports a safe compatibility value;
- unrelated saving or library work can temporarily disable the setup bar
  without falsely changing its primary action to `Applying`; only an actual
  runtime application reports that progress state;
- launch and connection failures now share a typed recovery model instead of
  exposing raw desktop errors through transient Toasts. Store identity,
  permission, connection, target-timeout, and unknown failures each lead to one
  specific next action;
- recovery actions open the relevant Codex location or local diagnostics
  setting, scroll it into view, and move keyboard focus to that section. Compact
  layouts retain the actionable error detail instead of hiding it;
- pause and official restore now share the same revision and busy guards as
  application. Repeated clicks are ignored, restore failures remain visible,
  and the user is routed to a recoverable diagnostics action instead of an
  unhandled promise;
- theme performance and interaction facts are calculated from the theme package
  itself, not from the independently selected companion;
- English and Simplified Chinese light/dark layouts have been reviewed at
  1320×840, 960×680, and 1600×1000, including the three-step setup guide.

## Beta 7 — creator task completion

### Companion Studio

- test still image, image sequence, video, and atlas as separate user journeys;
- show local validation beside the operation that caused it, with retry or
  discard actions that preserve original frames;
- expose processing estimates, source/output resolution, logical frame count,
  atlas pages, direction coverage, idle clips, and package limits before save;
- make history, before/after inspection, shared crop, baseline, edge cleanup,
  direction anchors, and motion clips observable rather than implicit;
- verify the exported package by immediately re-importing it in an automated
  round trip.

### Theme Editor

- maintain a runtime mapping registry for every visible control;
- cover Home, Task, Settings, Dialog, Right panel, and dynamic composer in the
  preview and Codex fixture;
- remove or disable controls that cannot produce a verified runtime change;
- validate surface-aware text, icons, borders, overlays, layout, and motion as
  one visual system rather than isolated color substitutions.

### Beta 7 exit evidence

- a prepared video can become an eight-direction companion in ten minutes
  without typing angle values;
- every visible creator control has an observable preview or validation result;
- no recoverable error requires restarting Styler or discarding the project;
- the four import paths pass export/re-import equivalence tests.

### Beta 7 implementation evidence

- Companion Studio now makes direct click or drag-and-drop import the primary
  path and automatically detects still images, sequences, video, and atlases.
  The format cards are optional file-picker constraints, show the active
  constraint, and provide a reversible return to automatic detection before
  files are imported. The primary import target remains visible at 960×680;
- the final Companion Studio step now previews the exact shared canvas,
  included and excluded logical frames, compiled direction poses, idle clips,
  optimized image or atlas-page plan, and decoded-page memory before build;
- package readiness includes the compiler limits as a blocking check instead
  of revealing an oversized atlas only after the user presses Build;
- the compiler applies the 8192 px raster-dimension and 20 MiB encoded-asset
  limits to static images, portraits, and atlas pages through shared validation
  paths;
- static-image creation remains keyboard-completable and the accepted
  Test & Save screenshot now covers the compiled-output summary.
- the Theme Editor now keeps a typed inventory of all 21 visible authoring
  controls, including the runtime signal, compatibility mode, preview coverage,
  and best verification scenario for each control;
- the Theme Editor now uses a reversible list-to-detail workspace below 1120
  px: selecting a layer opens its properties and temporarily gives the preview
  the layer panel's width, while closing properties restores the layer list and
  keyboard focus. Wider desktop layouts retain the full three-column editor;
- each editor section explains whether it is an isolated live effect, an
  Enhanced-mode semantic effect, or recommendation metadata, and can switch
  directly to the most useful Codex preview for verification;
- scene layers use user-facing names instead of internal ids, while the Task
  preview is explicitly named `Task & composer` so dynamic input coverage is
  no longer hidden behind an ambiguous scenario label.
- dirty theme drafts can now be compared against the saved version without a
  reset or second editor. The saved preview is explicitly read-only, removes
  its controls from keyboard navigation, and returns to the current edit as
  soon as the user chooses a layer to change.
- theme parameters, scene layers, recommended pairings, resets, and motion
  recipes now participate in a 50-step undo/redo history. Rapid slider input
  and multi-field recipes are grouped into one meaningful step, while toolbar
  controls and platform keyboard shortcuts remain available after saving.
- leaving a dirty theme draft now requires an explicit choice to keep editing,
  discard only the unsaved edits, or save before navigation. Escape returns to
  the editor, failed saves keep the draft open, and compact layouts retain all
  three recovery actions.
- the Theme Editor save control now reflects the actual draft state. A clean
  draft disables the redundant save action and identifies itself as saved;
  editing enables a restrained dirty-state treatment, while saving returns the
  same control to its clean state. The control remains understandable when the
  longer status label is hidden at 960×680.
- the persistent setup bar now occupies its own application row instead of
  floating above library content. Theme and companion libraries size their
  list/detail workspaces to the remaining viewport, expose at least three
  items at 1280×720, and retain complete compact detail actions at 960×680;
- disconnected theme, variant, and companion selection now communicates
  through the selected row and live setup bar instead of redundant Toasts that
  could cover the next action. Save, apply, recovery, and error Toasts remain.
- final companion output now includes a guided black, white, and theme-surface
  edge review for color spill, halos, broken transparency, and residual
  background pixels. Review evidence is stored with a compact output
  fingerprint and automatically expires after any pixel, crop, scale,
  inclusion, or alignment change.
- edge review now shares the compiler's exact crop, baseline, scale, and canvas
  renderer and performs a bounded local scan across behavior-defining and
  representative frames. Advisory findings identify likely retained
  backgrounds, canvas contact, isolated residue, and sampled-color spill, then
  return the user to an affected cleanup frame. Heuristic findings never block
  packaging or replace the explicit three-surface review.
- semantic theme rendering now protects component boundaries as part of the
  same surface-aware color contract used for text, status colors, and accent
  controls. Authored border hues are retained when safe and move only as far
  as required to preserve subtle, regular, and strong interface hierarchy;
- the Theme Editor replaces its generic contrast promise with an expandable
  visual safety result derived from the exact preview/runtime palette. It shows
  primary and secondary text, accent-control, boundary, and image-surface guard
  evidence without mutating the authored theme data.

## RC — reliability proof

- exercise the current Codex Desktop on Home, Task, Settings, Dialog, Right
  panel, route changes, dynamic composer, sleep/wake, disconnect, reconnect,
  pause, restore, and update;
- complete at least two independent macOS Apple Silicon and two Windows 11 x64
  install → apply → switch → recover → restore → update → uninstall reports;
- verify Windows packaged and Store installation discovery without visible
  terminal windows or unbounded restart waits;
- close all P0/P1 issues and attach diagnostics for every unresolved platform
  failure;
- require migration, updater channel, dependency, package-size, memory, and
  recovery checks in CI.

## Execution discipline

- Work on one user journey at a time and record its baseline before editing.
- Refactor and behavior changes must be reviewable separately when practical.
- Do not add themes, companions, formats, 3D, video backgrounds, marketplace,
  accounts, or cloud features while these gates remain open.
- Do not publish a release merely because the package builds. Release only when
  the gate's user task and evidence are complete.
- Keep unsigned Beta labeling until macOS and Windows system signing are in
  place.
