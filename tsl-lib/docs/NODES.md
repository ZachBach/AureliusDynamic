# tsl-lib nodes

> **GENERATED** by `tools/gen-docs.mjs` from `docs/REGISTRY.json` — do not edit.
> Regenerate after any `verify-all` run. Methodology: [COST-METHOD.md](COST-METHOD.md).

Baseline: **intel gen-9 · ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)** · Chrome/150.0.0.0 · Windows 10 · three r178 · measured 2026-07-29

## fresnel

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `fresnel/atmosphereShell` | ② | 0.59 (0.94) | 0.4/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/fresnel` | ② | 0.77 (0.86) | 0.4/1.8 | native/native | ✓ 0.003% | 16.7 ms | 2026-07-29 |
| `fresnel/horizonBand` | ④ | 3.06 (3.24) | 0.3/0.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/rimLight` | ② | 0.77 (0.91) | 0.4/1.9 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/terminator` | ② | 0.76 (0.88) | 0.5/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `fresnel/atmosphereShell` — additive fresnel limb ring lit from a light direction, *(src/fresnel/atmosphereShell.js)*
- `fresnel/fresnel` — view-angle rim term, unifying the four shipped variants *(src/fresnel/fresnel.js)*
- `fresnel/horizonBand` — fake-chrome horizon reflections: sine bands across a normal *(src/fresnel/horizonBand.js)*
- `fresnel/rimLight` — colored silhouette light, optionally biased toward a *(src/fresnel/rimLight.js)*
- `fresnel/terminator` — day/night shading terms from a surface direction and a light *(src/fresnel/terminator.js)*

## materials

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `materials/auroraSilk` | ⑤ | 45.73 (47.36) | 0.4/1.2 | native/native | ✓ 0.001% | 34.3 ms ⚠ | 2026-07-29 |
| `materials/dissolve` | ⑤ | 13.64 (14.44) | 0.4/0.4 | native/native | ✓ 0.001% | 16.7 ms | 2026-07-29 |
| `materials/forceField` | ③ | 1.83 (2.68) | 0.5/3.8 | native/native | ✓ 0.027% | 16.7 ms | 2026-07-29 |
| `materials/glitch` | ④ | 5.07 (5.81) | 0.4/1.7 | native/native | ✓ 0.005% | 16.7 ms | 2026-07-29 |
| `materials/hologram` | ③ | 1.47 (1.88) | 0.4/2.7 | native/native | ✓ 0.019% | 16.7 ms | 2026-07-29 |
| `materials/ice` | ⑤ | 11.51 (13.36) | 0.4/0.9 | fallback/fallback | ✓ 0.001% | 16.7 ms | 2026-07-29 |
| `materials/liquidMetal` | ④ | 5.21 (5.45) | 0.3/0.4 | native/native | ✓ 0.025% | 16.7 ms | 2026-07-29 |
| `materials/magma` | ⑤ | 21.01 (24.06) | 0.4/0.7 | native/native | ✓ 0.01% | 16.7 ms | 2026-07-29 |
| `materials/marble` | ⑤ | 21.00 (24.46) | 0.5/0.9 | native/native | ✓ 0.011% | 16.7 ms | 2026-07-29 |
| `materials/nebulaGlass` | ⑤ | 18.00 (23.06) | 0.4/1.4 | native/native | ✓ 0.067% | 16.7 ms | 2026-07-29 |
| `materials/shield` | ⑤ | 25.35 (25.94) | 0.4/0.4 | native/native | ✓ 0.097% | 19.3 ms | 2026-07-29 |
| `materials/toonCel` | ③ | 1.41 (1.76) | 1.4/3.1 | native/native | ✓ 0.008% | 16.7 ms | 2026-07-29 |

- `materials/auroraSilk` — AURORA SILK — the hero's aurora curtain draped over geometry via uv space: *(src/materials/auroraSilk.js)*
- `materials/forceField` — FORCE FIELD — hex lattice + fresnel shell + impact pulse rings. The *(src/materials/forceField.js)*
- `materials/glitch` — row-hashed uv tears over posterized noise bands, scanlines, and *(src/materials/glitch.js)*
- `materials/hologram` — fresnel shell + traveling scanlines + flicker. Library rebuild *(src/materials/hologram.js)*
- `materials/ice` — worley crack veins + fresnel glaze + depth tint. Deliberately uses *(src/materials/ice.js)*
- `materials/liquidMetal` — LIQUID METAL — fbm vertex ripple + dark chrome via sheared horizon bands. *(src/materials/liquidMetal.js)*
- `materials/magma` — domain-warped fbm through the fire ramp, with a cooling crust and *(src/materials/magma.js)*
- `materials/marble` — domain-warped fbm veins through an N-stop ramp, with a polish *(src/materials/marble.js)*
- `materials/nebulaGlass` — NEBULA GLASS — the deep-space backdrop recipe sealed inside a fresnel *(src/materials/nebulaGlass.js)*
- `materials/shield` — worley cell lattice + fresnel rim + radial pulse. Library rebuild *(src/materials/shield.js)*
- `materials/toonCel` — TOON CEL — posterized lambert bands from a fixed key light, gold-on-slate, *(src/materials/toonCel.js)*

## noise

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `noise/fbm` | ④ | 3.43 (3.57) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/fbm@fallback` | ③ | 1.83 (1.91) | 0.3/0.9 | fallback/fallback | ✓ 0% | 16.6 ms | 2026-07-29 |
| `noise/gradientNoise` | ③ | 1.12 (1.17) | 0.4/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/gradientNoise@fallback` | ③ | 1.34 (1.40) | 0.3/1.6 | fallback/fallback | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/ridgedFbm` | ④ | 3.46 (3.59) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/trigLattice` | ② | 0.47 (0.52) | 0.9/1.3 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/turbulence` | ④ | 3.40 (3.57) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/valueNoise` | ② | 0.72 (0.76) | 0.4/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/warp` | ⑤ | 10.23 (10.88) | 0.4/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1` | ④ | 5.92 (6.26) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1F2` | ⑤ | 11.17 (11.56) | 0.3/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1F2@fallback` | ④ | 3.58 (3.63) | 0.3/0.5 | fallback/fallback | ✓ 0% | 16.7 ms | 2026-07-29 |

- `noise/fbm` — fractal Brownian motion over a base noise. Native path is the mx *(src/noise/fbm.js)*
- `noise/gradientNoise` — 3D perlin-style noise. Native path is the mx adapter *(src/noise/gradientNoise.js)*
- `noise/ridgedFbm` — fbm with per-octave ridge transform (1−|n|)²: sharp crests *(src/noise/ridgedFbm.js)*
- `noise/trigLattice` — trigLattice / trigFlow — the site's cheap deterministic noise: summed *(src/noise/trigLattice.js)*
- `noise/turbulence` — fbm over |noise|: all-positive billows with sharp creases. *(src/noise/turbulence.js)*
- `noise/valueNoise` — pure-TSL 3D value noise: hashed lattice corners, smoothstep *(src/noise/valueNoise.js)*
- `noise/warp` — domain warping: displace a sample position by three offset fbm *(src/noise/warp.js)*
- `noise/worleyF1` — cellular noise. worleyF1 = distance to nearest feature point *(src/noise/worley.js)*
- `noise/worleyF1F2` — cellular noise. worleyF1 = distance to nearest feature point *(src/noise/worley.js)*

## pattern

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `pattern/curtain` | ④ | 5.00 (5.22) | 0.4/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/dissolve` | ④ | 3.59 (3.72) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/flicker` | ② | 0.47 (0.52) | 1.3/1.5 | native/native | ✓ 0% | 16.6 ms | 2026-07-29 |
| `pattern/grid` | ② | 0.46 (0.51) | 0.6/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/hexGrid` | ② | 0.51 (0.59) | 0.4/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/radialPulse` | ② | 0.46 (0.53) | 0.9/1.7 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/scanlines` | ② | 0.47 (0.52) | 2.1/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/sdf` | ② | 0.49 (0.59) | 1.0/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/spriteDisc` | ② | 0.47 (0.55) | 0.5/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/streaks` | ② | 0.54 (0.60) | 0.9/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/stripes` | ② | 0.46 (0.52) | 0.6/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/vignette` | ② | 0.46 (0.50) | 1.5/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `pattern/curtain` — aurora curtain: an fbm ridgeline the glow hangs from, hard top *(src/pattern/curtain.js)*
- `pattern/dissolve` — noise-threshold cutout with a glowing edge band, generalized *(src/pattern/dissolve.js)*
- `pattern/flicker` — bounded sinusoidal brightness wobble. Five hand-rolled shipped *(src/pattern/flicker.js)*
- `pattern/grid` — grid / hexGrid — line lattices over 2D coordinates. *(src/pattern/grid.js)*
- `pattern/hexGrid` — grid / hexGrid — line lattices over 2D coordinates. *(src/pattern/grid.js)*
- `pattern/radialPulse` — rings expanding from a center, as shipped in the Lab SHIELD *(src/pattern/radialPulse.js)*
- `pattern/scanlines` — traveling emission bands along an axis, as shipped in the Lab *(src/pattern/scanlines.js)*
- `pattern/sdf` — 2D signed-distance minis + smooth boolean ops, for HUD-style *(src/pattern/sdf.js)*
- `pattern/spriteDisc` — spriteDisc / spriteDiamond — per-sprite alpha falloffs from sprite uv, *(src/pattern/spriteDisc.js)*
- `pattern/streaks` — angular lobes around a center: the sun's corona streamers *(src/pattern/streaks.js)*
- `pattern/stripes` — stripes / checker — the elementary tilings. *(src/pattern/stripes.js)*
- `pattern/vignette` — radial edge fade over centered uv, as shipped on the nebula *(src/pattern/vignette.js)*

## ramp

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `ramp/cosinePalette` | ③ | 2.66 (2.76) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/fireRamp` | ④ | 3.43 (3.56) | 0.3/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/posterize` | ③ | 2.67 (2.81) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/ramp` | ② | 0.46 (0.52) | 2.0/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `ramp/cosinePalette` — IQ's procedural palette: a + b·cos(2π(c·t + d)). *(src/ramp/cosinePalette.js)*
- `ramp/fireRamp` — blackbody-ish fire colors from a scalar: vec3(b, b², b⁴), *(src/ramp/fireRamp.js)*
- `ramp/posterize` — quantize a scalar or color into discrete steps. The toon/cel *(src/ramp/posterize.js)*
- `ramp/ramp` — N-stop color gradient: smoothstep-blended stops along a scalar. *(src/ramp/ramp.js)*

## util

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `util/latlonUv` | ② | 0.75 (0.84) | 1.0/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `util/latlonUv` — unit direction → equirectangular uv (0..1)², as shipped in the *(src/util/latlonUv.js)*

## Not yet bench-verified

Doc'd in source; no registry entry (JS helpers, adapters, or pending bench wiring):

- `src/materials/dissolveMat.js` — DISSOLVE — noise-threshold cutout with a glowing ember edge. Library
- `src/noise/adapters/mx.js` — MaterialX adapters — the ONLY file allowed to touch mx_* symbols
- `src/noise/hashChannels.js` — hashChannels — n independent deterministic hash channels from one seed.
- `src/ramp/remap.js` — remap — map x from [inLo, inHi] to [outLo, outHi], clamped by default.
- `src/util/luminanceScale.js` — luminanceScale — JS-side (not a node): keep an additive particle field's
- `src/util/makeFlux.js` — makeFlux — the Lab's shared parameter: one uniform driving a scaled clock.
- `src/util/palette.js` — palette — every brand color in the Aurelius universe as color() nodes.
- `src/util/spherePoint.js` — spherePoint — uniform point on the unit sphere from two hash channels.
- `src/util/spinY.js` — spinY — rotate a direction around the y axis, as shipped for Terra's
