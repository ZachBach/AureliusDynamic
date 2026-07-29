# TSL Material Library — Master Backlog

The Shader Lab's four materials share an ad-hoc basis: a fresnel term, `mx_fractal_noise_float` everywhere, one `uFlux` uniform. This backlog promotes that basis into a proper composable TSL node library — noise family, ramp tools, fresnel/rim kit, pattern generators — with **every entry verified on both WGSL (WebGPU) and GLSL (WebGL2) backends and documented with its cost**. The Lab (`05 · The Lab` in the landing bundle) is the public test bench: new materials appear there first, source visible, frame time attached.

---

## 0 · Definition of Done — gate for every node checkbox below

A node/material is **done** only when all five hold:

1. **Dual-backend verified** — renders on WebGPU (WGSL) and WebGL2 (GLSL) of the embedded three.js r178 build; screenshot parity within per-node tolerance; no NaN/black output, zero console errors.
2. **Doc block** — signature, params + ranges, return type, cost class, backend caveats, one usage example.
3. **Cost measured** — recorded number on the baseline device per the methodology in Phase 4.
4. **Displayed-source is derived, not written** — each node exports a `source()` template alongside its implementation, in the same file, same commit; display text is never free-standing prose. Registry validation rejects entries whose snippet doesn't come from the implementation module. (Today's Lab `code:` strings are hand-maintained duplicates that can silently drift — this rule retires that class of bug.)
5. **Lab presence** — appears in the Lab, either as/inside a material or a node-gallery demo.

**Execution order: Phase 0 → 1 → 3 → 2 → 4 → 5 → 6.** The verification harness (Phase 3) is built *before* the node library (Phase 2) so every node is verified as it's written, never retrofitted.

---

## 1 · Phase 0 — Decisions & scaffolding

- [x] **DECIDED (2026-07-27):** library home = `tsl-lib/` in this repo — shares the exact pinned three build, keeps screenshot-parity testing and Lab integration cheap, avoids version skew. Revisit a sibling-repo split only after the API stabilizes.
- [x] **DECIDED (2026-07-27):** module format — ES modules; nodes are factories taking the TSL namespace as first argument (`(TSL, opts) => node`), so the library never imports three itself. Import surface audited at runtime → `docs/tsl-exports.json` (r178, 556 symbols, 22 `mx_*` — includes worley float/vec2/vec3, so F2/F2−F1 may be native; verify in Phase 2).
- [x] Scaffold tree: `src/{noise{,/adapters},ramp,fresnel,pattern,util,materials}/`, `bench/`, `docs/`, `tools/` + `tsl-lib/.gitignore` (build/, bench/vendor/, node_modules, shots, chrome profiles).
- [x] **Toolchain in `tools/`** (2026-07-27): `extract.py` (template → `build/template.html`; `--assets` decodes the three builds into `bench/vendor/` identifying them by content; `--check` proves the encode/decode round-trip byte-identical — verified against the live bundle), `pack.py` (`--dry`, self-checks re-decode before writing). `tools/README.md` documents the contract.
- [x] Dev harness `bench/index.html` (2026-07-27): `?node=&backend=&geo=knot|quad|sphere`; forced-WebGL2 by deleting `navigator.gpu` before the module runs; `window.__bench` protocol for the runner; `data:,` favicon so the console-error gate stays clean.
- [x] Runner `bench/run.mjs` (2026-07-27): serves `tsl-lib/`, puppeteer matrix {webgpu, webgl2} × nodes, screenshots to `bench/shots/`, hard-fails on console errors and backend mismatch, regenerates `docs/tsl-exports.json`. **First full matrix (3 demo nodes × 2 backends): all PASS, screenshots visually verified.**
- [x] three.js pin recorded in `docs/CONVENTIONS.md` (r178; manifest uuids `7c31e1a2-…4f10` core / `b58f0e77-…ab34` webgpu; vendor files always regenerated from the bundle, never committed; upgrades are deliberate backlog items that re-verify every node).
- [x] `docs/CONVENTIONS.md` (2026-07-27): factory signature, options-object params, no owned uniforms, no baked `time` (clock node injected — flux-scaled clocks pass through), mx_* isolation to adapters, derived `source()`, in-node constraint clamps (fire-ramp 0.95), palette-only colors, doc-block template, registry schema.

## 2 · Phase 1 — Mine the existing code (inventory before writing anything new)

Promote, don't rewrite. **COMPLETE 2026-07-27 — deliverable: [docs/INVENTORY.md](docs/INVENTORY.md)** (full-module read + census: 22 hash sites / 18 salts, 11 mx_fbm calls, 46 color() calls / 4 natural palettes, 5 trig-lattice fields, 4 fresnel variants, 3 sphere-point copies).

- [x] Shared fresnel term — 4 variants found (Lab abs, sun-body front-only, atmo pow 3.5 + day factor, earth cheap z-rim) → one `fresnel()` with a `facing` option.
- [x] `uFlux`-scaled clock idiom + per-instance rate clocks (`time.mul(hash·range + base)`).
- [x] `cellsOf()` worley fallback.
- [x] `mx_fractal_noise_float` census — 11 sites, lacunarity always 2.0, octaves 3–5, gain 0.5–0.55.
- [x] Hash-salt census — 22 sites, 18 distinct salts; **constraint found: channel pairs are shared across compute + render passes (1234/7777, 2468 in three places), so `hashChannels` must be deterministic per seed everywhere**.
- [x] Lab patterns + more found in the wider hero: corona streaks, aurora curtain falloff, lightning flash + waxing envelope, vignette, sprite disc/diamond.
- [x] Fire ramp with load-bearing 0.95 clamp.
- [x] Palette census — **bigger than brand**: brand (9) + solar (8) + terra (8) + nebula groups; `palette.js` exports all four.
- [x] Terra lat/lon sampling → `latlonUv(dir)`.
- [x] **Census discoveries not in the original backlog**: trig-lattice noise (5 shipped fields — granulation, continents, clouds, storm cells, turbulence — cost class ①, cheaper than fbm and proven on-screen) → `trigLattice()`/`trigFlow()`; sphere-point-from-hashes idiom (3 verbatim copies) → `spherePoint()`; day/night terminator → `terminator()`; luminance auto-scale JS helper; opacity-gate convention (`uIntro`/`uDim`/`uDyson`) — library materials take an `opacityGate` option. Compute-pass dynamics (spring/damping, pointer repulsion, CME capture) logged as deferred — not material nodes.

## 3 · Phase 2 — Core node collection

### Noise family — `src/noise/`

**Architecture rule (de-risks the `mx_*` dependence — the biggest technical risk in the plan):** library interfaces are defined first (`fbm`, `worleyF1`, `gradientNoise`, `valueNoise`); MaterialX implementations live behind adapters in `src/noise/adapters/mx.js` and **nothing outside the adapters touches `mx_*` directly**; every interface has a guaranteed pure-TSL fallback implementation. The registry records, per node per backend, `impl: native | fallback` plus parity status. A future three.js update dropping mx_ nodes then degrades gracefully instead of silently removing half the library.

**Wave 1 SHIPPED 2026-07-27** — 16 modules under `src/`, 16 bench entries, all through the gate (parity 0% everywhere but fresnel-sphere 0.003%; both fallback paths parity-verified too). Finds: **`mx_worley_noise_vec2` = (F1, F2) CONFIRMED visually — F2−F1 cell walls are native**; dot-product lattice hashes correlate around zero (fixed with positive offset in valueNoise + worley, caught by eyeballing the bench shots); `hash()` cross-backend parity confirmed safe (BACKEND-NOTES watch list updated).

- [x] Interface signatures — `(TSL, p, opts)` domain-positional refinement recorded in CONVENTIONS §API-1.
- [x] `src/noise/adapters/mx.js` — fractal/gradient/worley-float/worley-vec2/cell adapters, all feature-detected; only file touching `mx_*`.
- [x] Pure-TSL fallbacks: valueNoise-based fbm; 27-neighborhood worley F1/F2 (functional two-minima tracking). Both bench-forced and parity-gated (`noise/fbm@fallback`, `noise/worleyF1F2@fallback`).
- [x] `hashChannels(seed, n)` — `CHANNEL_STRIDE = 7919`, frozen; determinism contract documented (cross-pass identity). Exercised via the hash-lattice fallbacks.
- [ ] Value noise 2D (3D shipped: `noise/valueNoise`).
- [ ] Gradient (perlin-style) 3D public node (`mxGradientNoise` adapter exists; fallback + bench entry pending).
- [x] `fbm(p, {octaves, lacunarity, gain, base})` — mx-native + fallback, matching mx's unnormalized amplitude sum.
- [ ] Ridged fbm (the aurora `ridge` shape, generalized).
- [x] Worley F1 + F1F2 — `noise/worleyF1`, `noise/worleyF1F2`; F2−F1 native-confirmed.
- [x] `trigLattice` / `trigFlow` — the census-discovered cost-class-① tier (`noise/trigLattice` verified; terra ocean/land preset in the bench).
- [ ] `warp(p, noiseFn, amp)` domain-warp helper.
- [ ] Turbulence (|fbm|) variant.
- [ ] Curl noise (future particle/flow work; the hero will want it).

### Ramp tools — `src/ramp/`
- [ ] `ramp(stops[])` N-stop gradient.
- [x] `fireRamp(b)` — `ramp/fireRamp` verified; 0.95 clamp inside the node, sweep confirms no inversion at gain 3.4.
- [ ] Cosine palette (IQ: `a + b·cos(2π(c·t+d))`).
- [ ] Posterize / quantize.
- [x] `remap(x, inLo, inHi, outLo, outHi)` (`ramp/remap.js`; exercised in the fire bench entry). Smoothstep-chain helper pending.

### Fresnel / rim kit — `src/fresnel/`
- [x] `fresnel({power, bias, facing})` — all four shipped variants unified (`abs` / `front` / `z`); `fresnel/fresnel` verified on sphere.
- [ ] Rim light (colored, direction-biased).
- [ ] Fake-chrome horizon band (LIQUID METAL's `band`, generalized: axis, frequency, shear field).
- [ ] Atmosphere shell (Terra limb ring: additive fresnel lit from a light-direction uniform).
- [ ] Thin-film iridescence approx (stretch).

### Pattern generators — `src/pattern/`
- [x] `scanlines(axisPos, {freq, speed, sharpness, clock})` — verified.
- [x] `radialPulse(p, {freq, speed, clock})` — verified.
- [ ] Grid + hex-grid lines.
- [ ] Stripes / checker.
- [ ] SDF minis: circle, box, line + smooth union/subtract (HUD-style materials).
- [x] `dissolve(n, threshold, {edgeWidth})` → `{alive, edge}` — verified with animated threshold.
- [x] `flicker` + `flash` (spiky sibling with waxing envelope — the Terra lightning pair) — verified.
- [x] `vignette` + `spriteDisc`/`spriteDiamond` (census additions) — verified.
- [ ] Truchet tiles (stretch).

### Utilities — `src/util/`
- [x] `palette.js` — all four census groups (brand/solar/terra/nebula) as `color()` nodes + raw `HEX` export; bench visualizations consume it (zero hex literals in entries).
- [x] `latlonUv(dir)` — verified on sphere (`util/latlonUv`).
- [x] `makeFlux()` + `spherePoint()` — implemented with doc blocks; bench-visual entries pending (exercised implicitly).
- [ ] `spinY`, `luminanceScale` (JS helper) — pending.

## 4 · Phase 3 — Dual-backend verification harness — `bench/`

**COMPLETE 2026-07-27.** First full gate run: 3 demo nodes, parity 0% / 0% / 0.003%, all impl native/native, negative test (cross-node diff) correctly fails at 56.6%.

- [x] Node test page with parameter-sweep grid: `?node=X&sweep=1&freeze=<t>` renders the node's `sweep` param sets as a frozen grid. **Determinism comes from the conventions**: nodes take an injected clock, so parity mode substitutes `float(t)` for `time` — every frame identical.
- [x] Puppeteer matrix runner (Phase 0 `run.mjs` for quick smoke; `verify-all.mjs` is the gate).
- [x] Parity compare — `bench/compare.mjs`: pixelmatch diff + validity checks (blank/constant-frame detection catches NaN/dead shaders), per-node `parityTolerance`, diff heat maps to `shots/parity-*-diff.png`.
- [x] Console-error gate: zero tolerance, enforced per capture in `verify-all.mjs` (and the bench page suppresses the favicon request that would otherwise trip it).
- [x] `docs/BACKEND-NOTES.md` seeded with the four known divergences **plus one newly confirmed**: silhouette AA differs between backends (flat quads diff at 0%, curved edges accumulate — hence `parityGeo`/`parityTolerance` per node). Watch list: hash u32-vs-float determinism, negative-base `pow`, derivative nodes.
- [x] Mobile-tier check: 390×844 @ DPR 2 pass in verify-all, `mobileOverBudget` flag at 20 ms — **advisory** (desktop GPU measures fill-rate scaling, not real phone perf).
- [x] `bench/verify-all.mjs` — one command: parity + live smoke + mobile per node, merges into `docs/REGISTRY.json` (status, impl per backend, parity metrics, wall-ms; gpuMs/costClass reserved for Phase 4), exit 1 on any failure.

## 5 · Phase 4 — Cost measurement & documentation

- [ ] `docs/COST-METHOD.md`: warm N frames → median + p95 frame-ms over M frames; fixed stage (800×600, pixelRatio 1). **DECIDED:** one explicitly named baseline device; each record captures GPU, browser version, OS, three.js revision, and test date.
- [ ] Honest GPU time: investigate three r178 WebGPU timestamp queries (`renderer.resolveTimestampsAsync` / `TimestampQuery`) — the Lab's current number is wall-clock rAF EMA, not GPU cost. Use GPU time where available; annotate wall-clock elsewhere.
- [ ] Cost record per node: `{ "gpuMs": …, "wallMs": …, "costClass": ①–⑤ }`. **Cost class is the public-facing metric** — raw ms age badly as hardware changes; they stay in the registry as provenance.
- [ ] Per-node doc-block template (signature / params / cost / backends / example / derived display snippet).
- [ ] `docs/REGISTRY.json` — **the single source of truth** for verification status, impl (native/fallback per backend), parity, cost record, and verified date. Everything downstream is *generated* from it:
  `src/**/*.js → bench/verify-all.mjs → REGISTRY.json → NODES.md + Lab badges + node gallery` — nothing the registry can generate is ever hand-edited.
- [ ] `tools/gen-docs` — generate `docs/NODES.md` from doc blocks + registry.

## 6 · Phase 5 — Lab integration (the public test bench)

- [ ] Rebuild HOLOGRAM, SHIELD, LIQUID METAL, DISSOLVE purely from library nodes; screenshot-parity against the current bundle **before** swapping.
- [ ] Single source of truth for displayed code: the `<pre>` snippet comes from library metadata, never handwritten strings.
- [ ] Frame-time attachment: keep the live ms/fps EMA readout, add the registry's measured baseline per material ("≈0.8 ms @ baseline · verified 2026-07-xx").
- [ ] Backend badges per material: WGSL ✓ / GLSL ✓ + verified date, from the registry.
- [ ] New-material pipeline: drop a file in `src/materials/` + registry entry + repack = it's live in the Lab. Documented in `tools/README`.
- [ ] Repack workflow: `tools/pack.py` injects the built lab module into the bundle template; verify with the existing puppeteer smoke scripts (webgpu/webgl2/mobile).
- [ ] Preserve the bundle's hard-won invariants: `window.__aurShaderLab` singleton guard, the reattach/purge loop against dc-runtime re-renders, lazy scroll-armed init. Refactor must not disturb these.
- [ ] Mobile: decide Lab behavior on the 20k tier (reduced knot segments vs static fallback).
- [x] **DECIDED (2026-07-27):** hybrid UI — the default Lab view stays materials-only (approachable); an advanced drawer holds the registry-generated node gallery (the technical bench). 

## 7 · Phase 6 — New materials (prove the library)

Each ships Lab-first: source visible, frame time attached, built only from library nodes.

- [ ] **MAGMA** — fireRamp + domain-warped fbm + emissive crack edges.
- [ ] **ICE** — fresnel + worley cracks + depth tint.
- [ ] **FORCE FIELD** — hex grid + fresnel + slider-linked impact pulse.
- [ ] **GLITCH** — scanlines + posterize + hash-row uv tear.
- [ ] **MARBLE** — domain-warped fbm veins + polish fresnel.
- [ ] **AURORA SILK** — ridged-fbm curtain as a material (reuses the aurora recipe).
- [ ] **NEBULA GLASS** — dual-fbm veil + fresnel (reuses the backdrop recipe).
- [ ] **TOON CEL** — quantize ramp + rim.
- [ ] Stretch: brushed-metal anisotropy, starfield, plasma arcs.

## 8 · Later / stretch

- [ ] Hero adopts library nodes (sun granulation, storms, nebula) — high regression risk; only after the parity harness has earned trust.
- [ ] Standalone repo / npm publish decision.
- [ ] three.js upgrade pass (re-verify everything).
- [ ] Public docs page on the site — editorial rules apply; one page at a time.
- [ ] Upstream any confirmed mx_ backend divergences to three.js.

## 9 · Decisions log (resolved 2026-07-27)

1. **Library home — RESOLVED:** in-repo `tsl-lib/`. Split to a standalone repo only after the API stabilizes.
2. **Baseline device — RESOLVED:** one explicitly named baseline device; records capture GPU / browser version / OS / three.js revision / date; cost class is the public metric.
3. **Lab UI — RESOLVED:** hybrid — materials-only default view + advanced node-gallery drawer.
4. **M365 — CHOSEN:** Planner (task tracking) + Loop (design notes/specs) + To Do (personal execution queue). **Blocked on connector authorization** — no M365 connector is wired into the Claude environment yet; authorize via claude.ai connector settings. Until then, this file is the tracker.
