# Backend divergence ledger — WGSL (WebGPU) vs GLSL (WebGL2)

Every confirmed behavioral difference between the two backends of the
embedded three.js r178 build. Add an entry the moment a divergence is
confirmed — most shader libraries only discover these when they become bugs.

Format: symptom → cause → rule.

## Confirmed (paid for in production)

1. **`instancedArray('vec3').toAttribute()` is vec4-padded on WebGPU.**
   `vec4(attr, 1)` throws "exceeds maximum length" on WGSL; WebGL2 tolerates
   it silently. → Always take `.xyz` before widening. Because GLSL forgives
   this, **WebGPU must be tested explicitly** — a WebGL2-only pass proves
   nothing here.

2. **`positionView` is dead inside `SpriteNodeMaterial`'s billboard path.**
   It evaluates to view-z ≈ 0 and silently zeroes any term built on it
   (opacity fades, depth cues). → Use
   `modelViewMatrix.mul(vec4(instancePos.xyz, 1)).z` for instance depth.

3. **`mx_worley_noise_*` availability varies by build.** Feature-detect,
   never import unconditionally — this is why all `mx_*` access lives behind
   `src/noise/adapters/mx.js`. (The audited r178 surface *does* export
   worley float/vec2/vec3 — see `tsl-exports.json` — but the rule stands for
   any build change.)

4. **Headless Chrome supplies WebGPU via Dawn regardless of flags.**
   `--disable-features=WebGPU` does not disable it. The only reliable
   forced-WebGL2 is deleting the adapter before any module runs:
   `Object.defineProperty(navigator, 'gpu', { get: () => undefined })`
   (the bench does this from a classic inline script when
   `?backend=webgl2`).

5. **Rasterization/AA differs slightly at geometry silhouettes.** Same
   scene, same camera, pixelRatio 1: flat-quad renders diff at ~0%, but
   curved-silhouette geometry (sphere/knot) accumulates edge-pixel
   differences. → Parity defaults run on quads; view-dependent nodes that
   need curvature (fresnel family) declare `parityGeo: 'sphere'` with a
   wider `parityTolerance`.

6. **`THREE.Points` + `PointsMaterial` cannot render sized/textured points
   under `WebGPURenderer` — on either backend.** WebGPU's point-list
   topology is fixed at 1 px, and the node pipeline samples `map`/`alphaMap`
   through the geometry `uv` attribute (console warns "Vertex attribute
   'uv' not found on geometry"), which lands on the sprite texture's
   transparent corner → alpha 0 → the object draws *nothing at all*, not
   small points. Confirmed 2026-07-29 on r184 (echoGalaxy Phase G0: the
   v0.1 galaxy point cloud rendered fully black under WebGPURenderer on
   both its WebGPU and WebGL2 backends). → Render sized points as
   instanced sprites: `new Sprite(new PointsNodeMaterial({...}))` with
   `positionNode`/`colorNode` fed from `instancedBufferAttribute(...)`,
   `sprite.count = N`, `frustumCulled = false`. Cross-check: r184's
   `PointsNodeMaterial` overrides `setupPositionView` with exactly the
   `modelViewMatrix.mul(...)` workaround from entry 2, so `sizeAttenuation`
   is safe in this path (verified: echoGalaxy per-type parity diffs across
   backends show channel means identical to ±0.01).

## Version portability (the r178-verified library on other three builds)

First cross-version consumer: **echoGalaxy on three r184** (vendored copy of
upstream `666284f`, verified 2026-07-29). Library verdict: **r184 clean — no
library-code changes needed.** The dependency-injection design (nodes take
the TSL namespace as a parameter, zero imports) is what made this a
docs-level exercise rather than a port.

- All **28** distinct `TSL.<member>` accesses the library makes exist on
  r184. (echoGalaxy automates this per sync: `scripts/check-tsl-lib.mjs`
  checks the member surface against whatever three is installed.)
- All **26** gallery entries build their node graphs on r184 in plain node
  (`scripts/smoke-tsl-lib.mjs`) and compile + render in the browser lab
  (`?lab=1`) on **both backends**: zero errors, zero dark renders,
  cross-backend brightness matched per entry (time-animated entries show
  capture-time skew, not divergence).
- Consumer-facing moves found *around* the library (recipe/docs level, not
  library code):
  - **r183 renamed `PostProcessing` → `RenderPipeline`** (old name still
    exported, warns deprecated once). Update any recipe text that says
    `PostProcessing` when upstream moves past r182.
  - `bloom` remains an addon — `three/addons/tsl/display/BloomNode.js`,
    signature `bloom(node, strength, radius, threshold)` — not part of
    `three/tsl`.
  - r184's `PointsNodeMaterial` internalizes the entry-2 `positionView`
    workaround (its own `setupPositionView` override), making the
    points-as-instanced-sprites pattern of entry 6 safe there.
  - r184 deprecation warning: `THREE.Clock` → `THREE.Timer` (cosmetic,
    triggered by consumers, not the library).

## Watch list (unconfirmed, check when relevant)

- ~~Precision of `hash()` across WGSL vs GLSL~~ **CONFIRMED SAFE 2026-07-27**:
  the pure-TSL value-noise and 27-cell worley fallbacks (dense hash-driven
  lattices) parity at 0% diff across backends. Related shader gotcha found the
  same day (not a backend divergence): dot-product lattice hashes correlate
  symmetrically around zero — always offset lattice coords positive before
  hashing (see notes in `src/noise/worley.js` / `valueNoise.js`).
- `pow()` of negative bases (undefined in GLSL, defined-ish in WGSL) — audit
  any `x.pow(k)` where x can go negative.
- Derivative-based nodes (`fwidth`, AA helpers like `mx_aastep`) may differ
  at tile edges between backends.
- **WebGL2 storage-compute re-dispatch: alternate dispatches invisible**
  (observed 2026-07-30, echoGalaxy G3 on r184): dispatching the same
  `instancedArray` compute repeatedly with changed uniforms shows stale
  buffer contents on every second dispatch — a clean dispatch-parity
  pattern (1st ✓ 2nd ✗ 3rd ✓ 4th ✗). Transform-feedback ping-pong reading
  the wrong half is the suspect; mechanism unconfirmed. WebGPU is
  byte-perfect under the same sequence. Rule until confirmed: treat
  repeated compute-into-render-buffer as **WebGPU-only**; keep a live
  vertex-path fallback on WebGL2 (echoGalaxy does exactly this).
