# Creating companions

Companion Studio turns a still image, naturally sorted image sequence, short video, or existing sprite atlas into the same logical-frame project. Users do not need to understand atlas coordinates or edit JSON.

## Prepare source media

For the easiest cleanup, use a static, evenly lit background that differs from the subject. Keep the complete character, shadow, feet, and props inside the frame. Avoid camera movement, zoom, perspective changes, motion blur, and objects crossing the subject.

For directional video, move the character through a full rotation slowly enough to show at least eight recognizably different directions. The motion does not need to be uniform: calibration corrects timing. Looking, blinking, breathing, and small pose changes are useful, but long unrelated actions should be recorded separately or marked as idle motion. If the video turns back before completing a circle, split, reverse, or exclude that range during calibration.

Supported video input depends on the system WebView. MP4 or MOV with H.264 is the portable choice. Clips default to 30 seconds, 250 MiB, and 4K; select a useful range before extracting longer media. Decode failures explain how to convert the source instead of silently returning an empty project.

## Seven-step workflow

1. **Import** — choose a still, sequence, video, or atlas. Source files are copied into the local draft and never included in the public package.
2. **Extract / Slice** — select a video range and extraction density, or configure atlas rows, columns, cell size, margins, gaps, order, and page. The grid exposes every cell and any overflow.
3. **Clean up** — preserve alpha or sample a background color; adjust tolerance, feathering, despill, connected-subject retention, corner masks, and non-destructive keep/erase strokes for one or all frames.
4. **Align** — inspect opaque bounds, set one shared crop and ground line, then use baseline translation only. Never resize individual frames.
5. **Calibrate** — select a frame and point the direction dial toward the pointer position that should use it. The dial, angle number, anchor, and timeline are bidirectionally linked. Set at least four anchors; eight is recommended.
6. **Motions** — mark blink, breathing, or gesture ranges, their playback direction, speed, delay, and compatible direction poses. Exclude damaged or unrelated frames.
7. **Test & Save** — move a real pointer, resize the simulated composer, drag and snap the companion, inspect reduced motion, follow any automated edge-risk links back to the affected cleanup frame, review the final pixels on black, white, and theme-colored surfaces, then build and re-import the package. The local scan is advisory: it does not replace the visual review or block packaging by itself.

## Direction calibration

The timeline visualizes cumulative visual change rather than assuming equal frame intervals. Warnings identify uncovered directions, large jumps, reversed motion, duplicate anchors, and the `0°/360°` seam. The dial is the primary input; the numeric angle is an exact, keyboard-accessible companion control.

For a turn that moves forward and then backward, keep only one monotonic pass or explicitly reverse the selected range. Do not force both passes into one clockwise mapping. A blink near the upward pose belongs in an idle clip associated with that pose; it is not another upward direction anchor.

## Edge inspection

Before saving, inspect the result on transparent, black, white, and a representative theme-color background. Look for pink or blue spill, gray speckles, watermark remnants, broken thin details, disconnected shadows, and missing feet. Automatic local color cleanup is intentionally controllable and does not claim to solve arbitrary complex backgrounds.

Drafts autosave to the Tauri application-data directory. Undo/redo, reset current step, and reset project operate on the non-destructive project; exported packages contain only compiled assets, metadata, licenses, poses, and idle clips.
