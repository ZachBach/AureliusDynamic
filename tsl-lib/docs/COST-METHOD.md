# Cost methodology

How every number in `REGISTRY.json`'s cost records is measured, and what the
public-facing cost class means. Nothing here is hand-entered — the bench
writes it all (`node bench/verify-all.mjs --cost-only`).

## Protocol

- **Stage:** fixed 800×600 canvas, pixelRatio 1, the node's `parityGeo`
  (quad unless the node needs curvature), default parameters, clock frozen
  at t = 2.5 — the same deterministic frame as the parity gate.
- **Browser:** headless Chrome with `--disable-gpu-vsync
  --disable-frame-rate-limit`, so wall dt reflects real frame throughput,
  not the compositor's 16.7 ms cadence.
- **Warm-up:** 30 frames (shader compilation, pipeline caches).
- **Wall phase:** 150 frames of pure render + rAF; per-frame dt collected;
  **median** and **p95** recorded. No timestamp queries run during this
  phase — awaiting them forces a GPU sync that inflates wall time.
- **GPU phase (WebGPU only):** 60 frames with three's timestamp queries
  (`trackTimestamp: true` + `resolveTimestampsAsync(TimestampQuery.RENDER)`),
  feature-detected against `'timestamp-query'`. The reader detects a
  monotonically-accumulating counter and differences it. Median + p95
  recorded as `gpuMs` / `gpuP95`.
- **Basis:** `gpuMs` when available (`basis: "gpu"`), else WebGPU wall
  median (`basis: "wall"`). WebGL2 has no timestamp path in this build —
  its wall numbers are recorded but treated as indicative only (deep
  pipelining makes submit-bound wall dt undercount GPU-bound nodes).

## Cost class — the public metric

Raw milliseconds age with hardware; the class is what the Lab shows.
Thresholds in `bench/verify-all.mjs` (`CLASS_MS`), calibrated 2026-07-29 to
the baseline device below:

| Class | gpuMs (baseline) | Reads as |
|---|---|---|
| ① | ≤ 0.25 | free — constants, single trig/step patterns |
| ② | ≤ 1 | cheap — single noise, fresnel composites |
| ③ | ≤ 3 | moderate — low-octave fbm, worley |
| ④ | ≤ 8 | heavy — 4-octave fbm tier, fallback worley |
| ⑤ | > 8 | expensive — domain warp, multi-fbm composites; budget it |

## Baseline device

Recorded in `REGISTRY.json` → `_baseline` on every cost run: GPU (adapter
info + WebGL renderer string), Chrome version, OS, three.js revision, date.
Current baseline is an **Intel Gen9 integrated GPU** — a deliberately humble
floor: nodes that are viable there are viable everywhere, and the 20 ms
mobile advisory means something.

## Caveats

- **Stage floor:** the fixed stage itself (clear + quad raster + pass
  overhead) measures ≈ 0.46 ms on the gen-9 baseline — every simple pattern
  node clusters there. Numbers are recorded raw (not floor-subtracted);
  a node at ≈ 0.47 ms is effectively free. This is also why class ① is
  currently empty: nothing can measure below the floor.

- Cross-geometry comparisons are approximate: quads and spheres cover
  different pixel counts on the fixed stage. Compare within a geometry.
- The mobile number (`mobileWallMs`, from the full gate's 390×844 @ DPR 2
  pass) is fill-rate scaling on the desktop GPU, not a phone measurement —
  advisory only.
- Chrome quantizes WebGPU timestamps for fingerprinting resistance; at the
  magnitudes measured here (≥ 0.1 ms) that noise is negligible.
- Doc-block `@cost` lines in `src/` are design-time estimates; the registry
  (and the generated `NODES.md`) is the authority.
