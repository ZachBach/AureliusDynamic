# reels

Storyboards for the studio's app reels, rendered headless by
[`../reel.mjs`](../reel.mjs).

```bash
node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/helix.mjs            # every format
node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/ikos.mjs youtube     # one
node tsl-lib/tools/reel.mjs <board> [format ...] [--test] [--keep]   # --test: 45 frames per shot
```

| Storyboard | App | Output |
| --- | --- | --- |
| `helix.mjs` | Electromagnetic Helix Reactor, the deployed copy at `/helix/` | `video/helix-<format>-<w>x<h>.mp4` |
| `ikos.mjs` | IKOS, the deployed copy at `/ikos/` | `video/ikos-<format>-<w>x<h>.mp4` |

`video/` is gitignored: a reel is a few megabytes and a few minutes to remake.
Two other reels use the same engine from their own repositories —
`helixPulse/tools/video.mjs` (PulseMask, with its own copy of the loop and an
`--ad` cut) and `project-phoenix-uav/site/tools/reel-phoenix.mjs` (private).

## What a reel is

Not a screen recording. The app runs in headless Chrome on a real WebGPU
adapter with its clock gated — `performance.now` and `Date.now` advance only
when the capture loop advances them, one thirtieth of a second per frame —
so every frame is exactly one frame of the app's own animation, however long
the screenshot took. Four formats, one storyboard per aspect: the wide board
is the desktop layout at 1920×1080; the tall boards render the app's own
phone layout at 540 CSS px wide and two device pixels per CSS pixel, which is
what a phone is shown, at the sharpness a phone shows it.

| Format | Size | For |
| --- | --- | --- |
| `youtube` | 1920×1080 · 16:9 | YouTube |
| `linkedin` | 1080×1080 · 1:1 | LinkedIn feed |
| `facebook` | 1080×1350 · 4:5 | Facebook feed |
| `instagram` | 1080×1920 · 9:16 | Instagram Reels · YouTube Shorts |

No narration, no audio, no captions: the app's own chrome is the copy. A
silent AAC track is muxed in because some players refuse a file without one.

The render reports console errors and any off-site request per format and
exits non-zero on either. Then watch the file — the numbers cannot see a
cut that lands wrong.
