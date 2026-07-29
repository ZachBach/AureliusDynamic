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
- [x] Gradient (perlin-style) 3D — `noise/gradientNoise`, mx-native + pure-TSL hashed-gradient fallback, both parity-gated (Wave 2).
- [x] `fbm(p, {octaves, lacunarity, gain, base})` — mx-native + fallback, matching mx's unnormalized amplitude sum.
- [x] Ridged fbm — `noise/ridgedFbm` (Wave 2).
- [x] Worley F1 + F1F2 — `noise/worleyF1`, `noise/worleyF1F2`; F2−F1 native-confirmed.
- [x] `trigLattice` / `trigFlow` — the census-discovered cost-class-① tier (`noise/trigLattice` verified; terra ocean/land preset in the bench).
- [x] `warp(p, {amp, freq, octaves})` — `noise/warp` (marble verified; honest cost: ~33–39 ms live at 4 fbm evals — expect class ④).
- [x] Turbulence (|noise| fbm) — `noise/turbulence` (Wave 2).
- [ ] Curl noise (future particle/flow work; the hero will want it).

### Ramp tools — `src/ramp/`
- [x] `ramp(stops[])` N-stop gradient — `ramp/ramp` (Wave 2).
- [x] `fireRamp(b)` — `ramp/fireRamp` verified; 0.95 clamp inside the node, sweep confirms no inversion at gain 3.4.
- [x] Cosine palette — `ramp/cosinePalette` with 'aurelius'/'ember' presets (Wave 2).
- [x] Posterize / quantize — `ramp/posterize` (Wave 2).
- [x] `remap(x, inLo, inHi, outLo, outHi)` (`ramp/remap.js`; exercised in the fire bench entry). Smoothstep-chain helper pending.

### Fresnel / rim kit — `src/fresnel/`
- [x] `fresnel({power, bias, facing})` — all four shipped variants unified (`abs` / `front` / `z`); `fresnel/fresnel` verified on sphere.
- [x] Rim light — `fresnel/rimLight` (colored, direction-biased) (Wave 2).
- [x] Horizon band — `fresnel/horizonBand` (axis/freq/shear/clock) (Wave 2).
- [x] Atmosphere shell — `fresnel/atmosphereShell` → `{color, opacity}` (Wave 2).
- [x] Terminator — `fresnel/terminator` → `{day, shade, night}` (Wave 2; verified with trigLattice continents + night-side city glow).
- [ ] Thin-film iridescence approx (stretch).

### Pattern generators — `src/pattern/`
- [x] `scanlines(axisPos, {freq, speed, sharpness, clock})` — verified.
- [x] `radialPulse(p, {freq, speed, clock})` — verified.
- [x] Grid + hex-grid — `pattern/grid` (gridLines + hexGrid → `{edge, dist}`; hex-metric orientation bug caught visually and fixed — parity can't see deterministic wrongness) (Wave 2).
- [x] Stripes / checker — `pattern/stripes` (Wave 2).
- [x] SDF minis — `pattern/sdf`: sdCircle/sdBox/sdSegment + opSmoothUnion/Subtract + sdFill/sdOutline (Wave 2).
- [x] Streaks + curtain (census additions) — `pattern/streaks`, `pattern/curtain` → `{glow, edge}` parameterizing both shipped aurora layers (Wave 2).
- [x] `dissolve(n, threshold, {edgeWidth})` → `{alive, edge}` — verified with animated threshold.
- [x] `flicker` + `flash` (spiky sibling with waxing envelope — the Terra lightning pair) — verified.
- [x] `vignette` + `spriteDisc`/`spriteDiamond` (census additions) — verified.
- [ ] Truchet tiles (stretch).

### Utilities — `src/util/`
- [x] `palette.js` — all four census groups (brand/solar/terra/nebula) as `color()` nodes + raw `HEX` export; bench visualizations consume it (zero hex literals in entries).
- [x] `latlonUv(dir)` — verified on sphere (`util/latlonUv`).
- [x] `makeFlux()` + `spherePoint()` — implemented with doc blocks; bench-visual entries pending (exercised implicitly).
- [x] `spinY`, `luminanceScale` (JS helper) — shipped Wave 2 (doc'd; trivial, no bench entries).

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

- [x] `docs/COST-METHOD.md` (2026-07-29): 30 warm + 150 measured frames, 800×600 px-ratio-1 stage, frozen clock, **vsync-disabled browser** (`--disable-gpu-vsync --disable-frame-rate-limit` — without it wall dt is just the compositor's 16.7 ms). Baseline recorded in `REGISTRY._baseline`: **Intel Gen9 iGPU** — a deliberately humble floor.
- [x] Honest GPU time (2026-07-29): three r178 `trackTimestamp: true` + `resolveTimestampsAsync(TimestampQuery.RENDER)`, feature-detected. Two protocol gotchas found and handled: awaiting timestamp resolution per-frame forces a GPU sync that inflates wall dt (→ wall and GPU measured in separate phases), and the timestamp counter can accumulate (→ monotonic series detected and differenced). WebGL2 has no timestamp path — wall-only, annotated via `basis`.
- [x] Cost record per node: `{gpuMs, gpuP95, wallMs{webgpu,webgl2}, mobileWallMs, costClass, basis}`; `CLASS_MS = [0.25, 1, 3, 8]` calibrated to the gen-9 baseline. Cost class is the public metric.
- [x] Per-node doc-block template — in place across all 30 src files since Wave 1/2 (`@param/@returns/@cost/@backend` + `source()`); doc-block `@cost` lines are design-time estimates, registry is authority (noted in COST-METHOD).
- [x] `docs/REGISTRY.json` — single source of truth, now with full cost records for all 34 entries + `_baseline` (Intel UHD 630 / gen-9, Chrome 150, Win10, r178, 2026-07-29). Distribution: ② ×17 · ③ ×5 · ④ ×9 · ⑤ ×2 (① unreachable — 0.46 ms stage floor, documented).
- [x] `tools/gen-docs.mjs` (2026-07-29) — generates `docs/NODES.md`: baseline banner, per-family cost/parity/impl tables, description lines from src doc blocks, plus a "not yet bench-verified" completeness section (currently the 8 helper/adapter files). Regenerate after every verify-all run.

## 6 · Phase 5 — Lab integration (the public test bench)

**COMPLETE 2026-07-29** — the bundle's Lab now runs the library.

- [x] Four materials rebuilt as `src/materials/*` from library nodes, bench-gated (parity 0.001–0.097%, cost: hologram ③ 1.47 · liquidMetal ④ 5.21 · dissolve ⑤ 13.64 · shield ⑤ 25.35 ms — **optimization lead: shield via the faster pure-TSL worley fallback**). Before/after site shots diff 0.39–0.66% (dissolve 4.07% — moving burn-line artifact; bench parity 0.001% proves the math).
- [x] Displayed code is generated: `build-lab.mjs` embeds each module's `source()` — the bundle's old handwritten strings are gone.
- [x] Badges live under the chips: "③ · 1.47 MS @ UHD 630 · WGSL ✓ GLSL ✓ · VERIFIED 2026-07-29" per material, from the registry; live ms/fps EMA readout kept.
- [x] New-material pipeline documented in `tools/README.md` (5 steps, extract → build-lab → pack → verify-site).
- [x] Repack workflow: `tools/build-lab.mjs` splices between stable anchors (`const uFlux…` → `// ---- widget DOM`), idempotent; `tools/verify-site.mjs` (committed — scratchpad fragility ended) smokes hero + Lab on both backends with per-chip shots and a console-error gate (`--root=` serves a pre-change baseline from git).
- [x] Invariants preserved: singleton guard, reattach/purge loop, lazy scroll-armed init untouched (splice ends before the widget DOM); verified live on both backends, zero console errors.
- [x] Mobile: full widget kept on the 20k tier — one material at a time on a 12.8k-tri knot fits budget (bench mobile advisory 16.7 ms).
- [x] **DECIDED (2026-07-27):** hybrid UI — the default Lab view stays materials-only (approachable); an advanced drawer holds the registry-generated node gallery (the technical bench). *(Drawer not yet built — deferred to a follow-up wave; materials-only default shipped 2026-07-29.)*

## 7 · Phase 6 — New materials (prove the library)

**COMPLETE 2026-07-29** — all eight shipped Lab-first (12 chips live on both backends, zero console errors), library nodes only, generated sources, registry badges. Bench parity ≤0.067%.

- [x] **MAGMA** ⑤ 21.0 ms — warp+fbm through fireRamp, obsidian crust, ember crack edges (gold magma — on brand).
- [x] **ICE** ⑤ 11.5 ms — **deliberately uses the pure-TSL worley fallback** (faster than mx native: the tiered impl system earning its keep, noted in its source snippet).
- [x] **FORCE FIELD** ③ 1.83 ms — the Wave-2 hexGrid + fresnel + impact pulses.
- [x] **GLITCH** ④ 5.07 ms — row-hashed uv tears, stutter-quantized reroll, posterized bands, slice flashes.
- [x] **MARBLE** ⑤ 21.0 ms — warp+fbm veins through a 4-stop ramp, gold seams, polish fresnel.
- [x] **AURORA SILK** ⑤ 45.7 ms — two curtain layers over uv space; the Lab's most expensive material and honestly badged as such (optimization candidate: fewer curtain octaves).
- [x] **NEBULA GLASS** ⑤ 18.0 ms — the backdrop's dual-fbm recipe in a fresnel shell.
- [x] **TOON CEL** ③ 1.41 ms — 3-step posterized lambert, ink outline, biased rim.
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
