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

Promote, don't rewrite. Every primitive below already ships in the hero module / Lab today:

- [ ] Shared fresnel term `fres = 1 − |eye·normalWorld|` (Lab shared const; variants in Terra atmosphere shell + sun limb darkening).
- [ ] `uFlux`-scaled clock idiom.
- [ ] `cellsOf()` — worley with fbm-abs fallback (`mx_worley_noise_float` feature-detect). The fallback pattern itself is a library concern: mx_ nodes are not guaranteed present.
- [ ] `mx_fractal_noise_float` call census: Lab `wob`/`swirl`/dissolve-`n`, nebula `f1`/`f2`, aurora `ridge`/`ray`/`ridge2`, sun `n1`/`n2` (octaves 3–5, lacunarity 2.0, gain 0.5–0.55).
- [ ] `hash(instanceIndex.add(SALT))` multi-channel idiom (~20 magic salts: 91, 517, 1234, 7777, 31337, 2468, …).
- [ ] Patterns in the four materials: scanlines (sin on `posW.y`), radial pulse (sin on `length()`), horizon band (sin on `normal.y` sheared by a swirl field), dissolve threshold + ember edge, flicker.
- [ ] Fire ramp `vec3(b, b², b⁴)` with the **b ≤ 0.95 clamp** — above 0.95 the channel ordering inverts and plasma turns blue-white. Codify the clamp inside the node.
- [ ] Brand palette hexes repeated as literals across materials: cyan `57D4FF`, blue `2B6CF6`, ice `EAF7FF`, gold `F4C95D`, ember `FF7A1A`, void `0A0E14`, silver `98A8BE`, slate `1E2836`, mist `9AA7BC` → single `util/palette.js`.
- [ ] Terra storm-map lat/lon direction→uv sampling → `util/latlon.js` candidate.
- [ ] Deliverable: `docs/INVENTORY.md` — each primitive → where it lives today → target library module.

## 3 · Phase 2 — Core node collection

### Noise family — `src/noise/`

**Architecture rule (de-risks the `mx_*` dependence — the biggest technical risk in the plan):** library interfaces are defined first (`fbm`, `worleyF1`, `gradientNoise`, `valueNoise`); MaterialX implementations live behind adapters in `src/noise/adapters/mx.js` and **nothing outside the adapters touches `mx_*` directly**; every interface has a guaranteed pure-TSL fallback implementation. The registry records, per node per backend, `impl: native | fallback` plus parity status. A future three.js update dropping mx_ nodes then degrades gracefully instead of silently removing half the library.

- [ ] Interface signatures for `fbm` / `worleyF1` / `gradientNoise` / `valueNoise` — land before any implementation.
- [ ] `src/noise/adapters/mx.js` — MaterialX adapters (`mx_fractal_noise_float`, `mx_noise_float`, `mx_worley_noise_float`), each feature-detected.
- [ ] Pure-TSL fallback impls for every interface.
- [ ] `hashChannels(seed, n)` — deterministic multi-channel hash; kills the magic-salt idiom. Document cross-backend determinism caveats.
- [ ] Value noise 2D/3D.
- [ ] Gradient (perlin-style) 3D — mx adapter + own fallback, parity-compared.
- [ ] `fbm(p, {octaves, lacunarity, gain, base})` — generic over base noise; the mx adapter becomes one instantiation.
- [ ] Ridged fbm (the aurora `ridge` shape, generalized).
- [ ] Worley F1 — promote `cellsOf` behind the adapter + fallback; F2 / F2−F1 if the build exposes them, else registry marks them fallback-only.
- [ ] `warp(p, noiseFn, amp)` domain-warp helper.
- [ ] Turbulence (|fbm|) variant.
- [ ] Curl noise (future particle/flow work; the hero will want it).

### Ramp tools — `src/ramp/`
- [ ] `ramp(stops[])` N-stop gradient.
- [ ] `fireRamp(b)` — the clamped b/b²/b⁴ blackbody ramp.
- [ ] Cosine palette (IQ: `a + b·cos(2π(c·t+d))`).
- [ ] Posterize / quantize.
- [ ] `remap(x, inLo, inHi, outLo, outHi)` + smoothstep-chain helper.

### Fresnel / rim kit — `src/fresnel/`
- [ ] `fresnel({power, bias})` — parameterized; today's ad-hoc `.pow(3/5/6)` uses become arguments.
- [ ] Rim light (colored, direction-biased).
- [ ] Fake-chrome horizon band (LIQUID METAL's `band`, generalized: axis, frequency, shear field).
- [ ] Atmosphere shell (Terra limb ring: additive fresnel lit from a light-direction uniform).
- [ ] Thin-film iridescence approx (stretch).

### Pattern generators — `src/pattern/`
- [ ] `scanlines(axisPos, freq, speed, sharpness)`.
- [ ] `radialPulse(p, freq, speed)`.
- [ ] Grid + hex-grid lines.
- [ ] Stripes / checker.
- [ ] SDF minis: circle, box, line + smooth union/subtract (HUD-style materials).
- [ ] `dissolve(n, threshold, edgeWidth)` → `{alive, edge}` — DISSOLVE generalized.
- [ ] `flicker(t, freq, depth)`.
- [ ] Truchet tiles (stretch).

### Utilities — `src/util/`
- [ ] `palette.js` — brand colors as `color()` nodes, single source.
- [ ] `latlon.js` — direction↔uv helpers.
- [ ] Uniform-bundle conventions (e.g. `makeFlux()` returning the uniform + scaled clock).

## 4 · Phase 3 — Dual-backend verification harness — `bench/`

- [ ] Node test page: fullscreen-quad render of one node with a parameter-sweep grid; one URL per node.
- [ ] Puppeteer matrix runner: {webgpu, webgl2} × node list → screenshots.
- [ ] Parity compare: pixel-diff/SSIM per node with tolerances; hard fail on NaN/black.
- [ ] Console-error gate: zero tolerance (Open-Meteo 429 noise is landing-page-only and must not appear in bench).
- [ ] `docs/BACKEND-NOTES.md` divergence ledger, seeded with the known ones:
  - `instancedArray('vec3').toAttribute()` is vec4-padded on WebGPU — take `.xyz` before building a `vec4` (WebGL2 tolerates the bug, so WebGPU must be tested specifically).
  - `positionView` evaluates to view-z≈0 inside SpriteNodeMaterial's billboard path — use `modelViewMatrix.mul(vec4(pos,1)).z`.
  - `mx_worley_noise_float` availability varies — always feature-detect.
  - Headless Chrome supplies WebGPU via Dawn regardless of flags — forced-WebGL2 requires deleting `navigator.gpu`.
- [ ] Mobile-tier check: DPR 2, small viewport; flag nodes too heavy for the 20k mobile tier.
- [ ] `bench/verify-all.mjs` — one command, writes statuses into the registry.

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
