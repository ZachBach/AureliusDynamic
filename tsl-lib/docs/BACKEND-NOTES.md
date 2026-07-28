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

## Watch list (unconfirmed, check when relevant)

- Precision of `hash()` / integer ops across WGSL u32 vs GLSL float paths —
  matters for `hashChannels` determinism guarantees; verify in Phase 2.
- `pow()` of negative bases (undefined in GLSL, defined-ish in WGSL) — audit
  any `x.pow(k)` where x can go negative.
- Derivative-based nodes (`fwidth`, AA helpers like `mx_aastep`) may differ
  at tile edges between backends.
