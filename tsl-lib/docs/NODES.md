# tsl-lib nodes

> **GENERATED** by `tools/gen-docs.mjs` from `docs/REGISTRY.json` — do not edit.
> Regenerate after any `verify-all` run. Methodology: [COST-METHOD.md](COST-METHOD.md).

Baseline: **intel gen-9 · ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)** · Chrome/151.0.0.0 · Windows 10 · three r178 · measured 2026-08-16

## fresnel

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `fresnel/anisoSheen` | ② | 0.83 (0.97) | 1.3/2.9 | native/native | ✓ 0.001% | 16.7 ms | 2026-08-16 |
| `fresnel/atmosphereShell` | ② | 0.59 (0.94) | 0.4/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/fresnel` | ② | 0.77 (0.86) | 0.4/1.8 | native/native | ✓ 0.003% | 16.7 ms | 2026-07-29 |
| `fresnel/horizonBand` | ④ | 3.06 (3.24) | 0.3/0.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/rimLight` | ② | 0.77 (0.91) | 0.4/1.9 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/terminator` | ② | 0.76 (0.88) | 0.5/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `fresnel/thinFilm` | ② | 0.80 (1.01) | 1.7/2.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `fresnel/anisoSheen` — the Kajiya–Kay fibre highlight: a surface made of parallel *(src/fresnel/anisoSheen.js)*
- `fresnel/atmosphereShell` — additive fresnel limb ring lit from a light direction, *(src/fresnel/atmosphereShell.js)*
- `fresnel/fresnel` — view-angle rim term, unifying the four shipped variants *(src/fresnel/fresnel.js)*
- `fresnel/horizonBand` — fake-chrome horizon reflections: sine bands across a normal *(src/fresnel/horizonBand.js)*
- `fresnel/rimLight` — colored silhouette light, optionally biased toward a *(src/fresnel/rimLight.js)*
- `fresnel/terminator` — day/night shading terms from a surface direction and a light *(src/fresnel/terminator.js)*
- `fresnel/thinFilm` — soap-bubble/oil-slick iridescence approximation: the fresnel *(src/fresnel/thinFilm.js)*

## materials

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `materials/auroraSilk` | ⑤ | 45.73 (47.36) | 0.4/1.2 | native/native | ✓ 0.001% | 34.3 ms ⚠ | 2026-07-29 |
| `materials/bark` | ⑤ | 9.51 (10.03) | 0.6/0.6 | native/native | ✓ 0.002% | 16.7 ms | 2026-08-11 |
| `materials/blueprint` | ③ | 1.45 (1.57) | 3.3/4.9 | native/native | ✓ 0.004% | 16.7 ms | 2026-08-11 |
| `materials/brushedMetal` | ④ | 5.23 (5.51) | 0.4/0.4 | native/native | ✓ 0.014% | 16.7 ms | 2026-07-29 |
| `materials/carbonWeave` | ③ | 1.69 (1.82) | 0.5/3.1 | native/native | ✓ 0.011% | 16.7 ms | 2026-08-16 |
| `materials/caustics` | ⑤ | 12.69 (13.80) | 0.7/0.7 | fallback/fallback | ✓ 0.002% | 16.7 ms | 2026-08-11 |
| `materials/chainmail` | ③ | 1.24 (1.44) | 0.4/3.1 | native/native | ✓ 0.008% | 16.7 ms | 2026-08-16 |
| `materials/circuitMaze` | ③ | 2.05 (2.46) | 0.4/3.5 | native/native | ✓ 0.036% | 16.6 ms | 2026-08-03 |
| `materials/coral` | ⑤ | 12.60 (13.12) | 0.6/0.6 | fallback/fallback | ✓ 0.005% | 16.7 ms | 2026-08-11 |
| `materials/crackedClay` | ⑤ | 14.13 (14.69) | 0.4/0.3 | fallback/fallback | ✓ 0.009% | 16.7 ms | 2026-08-16 |
| `materials/crtScreen` | ④ | 5.03 (8.84) | 0.7/1.1 | native/native | ✓ 0.001% | 16.7 ms | 2026-08-11 |
| `materials/crystal` | ④ | 7.06 (7.45) | 0.6/0.8 | fallback/fallback | ✓ 0.005% | 16.7 ms | 2026-08-11 |
| `materials/cumulus` | ⑤ | 10.89 (12.09) | 0.4/0.8 | native/native | ✓ 0.006% | 16.7 ms | 2026-08-16 |
| `materials/damascus` | ④ | 5.13 (5.38) | 0.8/0.9 | native/native | ✓ 0.02% | 16.7 ms | 2026-08-11 |
| `materials/dissolve` | ⑤ | 13.64 (14.44) | 0.4/0.4 | native/native | ✓ 0.001% | 16.7 ms | 2026-07-29 |
| `materials/ferrofluid` | ④ | 6.82 (7.44) | 0.3/0.7 | fallback/fallback | ✓ 0.006% | 16.7 ms | 2026-08-16 |
| `materials/forceField` | ③ | 1.83 (2.68) | 0.5/3.8 | native/native | ✓ 0.027% | 16.7 ms | 2026-07-29 |
| `materials/glitch` | ④ | 5.07 (5.81) | 0.4/1.7 | native/native | ✓ 0.005% | 16.7 ms | 2026-07-29 |
| `materials/halftone` | ④ | 5.96 (6.27) | 0.6/1.1 | native/native | ✓ 0.01% | 16.7 ms | 2026-08-11 |
| `materials/hologram` | ③ | 1.47 (1.88) | 0.4/2.7 | native/native | ✓ 0.019% | 16.7 ms | 2026-07-29 |
| `materials/ice` | ⑤ | 11.51 (13.36) | 0.4/0.9 | fallback/fallback | ✓ 0.001% | 16.7 ms | 2026-07-29 |
| `materials/kaleidoscope` | ③ | 1.25 (1.49) | 0.5/2.7 | native/native | ✓ 0.037% | 16.6 ms | 2026-08-16 |
| `materials/lavaLamp` | ⑤ | 15.38 (16.78) | 0.5/0.6 | fallback/fallback | ✓ 0.003% | 16.7 ms | 2026-08-11 |
| `materials/liquidMetal` | ④ | 5.21 (5.45) | 0.3/0.4 | native/native | ✓ 0.025% | 16.7 ms | 2026-07-29 |
| `materials/magma` | ⑤ | 21.01 (24.06) | 0.4/0.7 | native/native | ✓ 0.01% | 16.7 ms | 2026-07-29 |
| `materials/malachite` | ⑤ | 16.00 (19.02) | 0.8/0.6 | fallback/fallback | ✓ 0.032% | 16.7 ms | 2026-08-11 |
| `materials/marble` | ⑤ | 21.00 (24.46) | 0.5/0.9 | native/native | ✓ 0.011% | 16.7 ms | 2026-07-29 |
| `materials/matrixRain` | ③ | 1.49 (5.37) | 3.0/3.1 | native/native | ✓ 0.005% | 16.7 ms | 2026-08-11 |
| `materials/moire` | ③ | 1.21 (1.48) | 0.6/2.7 | native/native | ✓ 0.012% | 16.7 ms | 2026-08-16 |
| `materials/nebulaGlass` | ⑤ | 18.00 (23.06) | 0.4/1.4 | native/native | ✓ 0.067% | 16.7 ms | 2026-07-29 |
| `materials/neonTubes` | ③ | 1.54 (2.28) | 0.9/4.1 | native/native | ✓ 0.005% | 16.7 ms | 2026-08-11 |
| `materials/oilSlick` | ④ | 6.57 (6.74) | 0.7/0.6 | native/native | ✓ 0.03% | 16.7 ms | 2026-08-11 |
| `materials/opal` | ⑤ | 11.42 (15.67) | 0.8/0.6 | fallback/fallback | ✓ 0.012% | 16.7 ms | 2026-08-11 |
| `materials/plasmaArcs` | ⑤ | 16.38 (19.64) | 0.4/0.4 | native/native | ✓ 0.017% | 16.7 ms | 2026-07-29 |
| `materials/plasmaGlobe` | ④ | 5.61 (5.67) | 0.7/0.8 | native/native | ✓ 0.007% | 16.7 ms | 2026-08-11 |
| `materials/prismaticField` | ③ | 2.27 (2.75) | 0.4/2.5 | native/native | ✓ 0.055% | 16.7 ms | 2026-08-03 |
| `materials/radarSweep` | ③ | 1.39 (1.53) | 1.8/2.9 | native/native | ✓ 0.006% | 16.7 ms | 2026-08-11 |
| `materials/rainGlass` | ③ | 1.86 (1.97) | 0.4/2.8 | native/native | ✓ 0.001% | 16.7 ms | 2026-08-16 |
| `materials/rippleTank` | ③ | 1.37 (1.61) | 0.7/3.2 | native/native | ✓ 0.007% | 16.7 ms | 2026-08-16 |
| `materials/rust` | ⑤ | 12.64 (12.76) | 0.6/0.7 | fallback/fallback | ✓ 0.009% | 16.7 ms | 2026-08-11 |
| `materials/sandDunes` | ⑤ | 9.58 (10.47) | 0.6/0.6 | native/native | ✓ 0.026% | 16.7 ms | 2026-08-11 |
| `materials/shield` | ⑤ | 16.82 (18.41) | 0.4/0.4 | fallback/fallback | ✓ 0.073% | 16.7 ms | 2026-07-29 |
| `materials/snakeScales` | ④ | 5.70 (8.88) | 0.7/0.6 | native/native | ✓ 0.014% | 16.7 ms | 2026-08-11 |
| `materials/snowflake` | ④ | 6.85 (7.58) | 0.4/0.5 | native/native | ✓ 0.002% | 16.7 ms | 2026-08-16 |
| `materials/soapBubble` | ④ | 5.16 (5.73) | 0.8/0.8 | native/native | ✓ 0.077% | 16.7 ms | 2026-08-11 |
| `materials/spiralGalaxy` | ③ | 1.66 (1.73) | 0.7/3.0 | native/native | ✓ 0.001% | 16.7 ms | 2026-08-16 |
| `materials/stainedGlass` | ④ | 7.11 (7.47) | 0.6/0.8 | fallback/fallback | ✓ 0.02% | 16.7 ms | 2026-08-11 |
| `materials/starfield` | ④ | 5.05 (5.29) | 0.4/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `materials/thermalCam` | ④ | 7.05 (10.92) | 0.7/0.7 | native/native | ✓ 0.002% | 16.7 ms | 2026-08-11 |
| `materials/tigersEye` | ⑤ | 10.13 (10.66) | 0.4/0.7 | native/native | ✓ 0.01% | 16.7 ms | 2026-08-16 |
| `materials/toonCel` | ③ | 1.41 (1.76) | 1.4/3.1 | native/native | ✓ 0.008% | 16.7 ms | 2026-07-29 |
| `materials/topoMap` | ④ | 7.68 (8.07) | 0.5/0.7 | native/native | ✓ 0.018% | 16.7 ms | 2026-08-11 |
| `materials/velvet` | ④ | 3.63 (3.87) | 0.6/1.2 | native/native | ✓ 0.021% | 16.7 ms | 2026-08-11 |
| `materials/vortexFlow` | ⑤ | 37.46 (38.78) | 0.7/0.4 | native/native | ✓ 0.016% | 34.6 ms ⚠ | 2026-08-03 |

- `materials/auroraSilk` — AURORA SILK — the hero's aurora curtain draped over geometry via uv space: *(src/materials/auroraSilk.js)*
- `materials/bark` — ridged fbm with the domain squashed on Y, so the fissures run *(src/materials/bark.js)*
- `materials/blueprint` — two grid frequencies (fine ruling under a heavier major grid) *(src/materials/blueprint.js)*
- `materials/brushedMetal` — BRUSHED METAL — anisotropically stretched noise grooves shearing a *(src/materials/brushedMetal.js)*
- `materials/carbonWeave` — CARBON WEAVE — the plain-weave twill, shaded as fibre rather than as paint. *(src/materials/carbonWeave.js)*
- `materials/caustics` — the bright web light draws on a pool floor. Two worley fields *(src/materials/caustics.js)*
- `materials/chainmail` — two ring lattices offset by half a cell, which alone would give *(src/materials/chainmail.js)*
- `materials/circuitMaze` — CIRCUIT MAZE — animated Truchet traces driven by radial signal pulses: *(src/materials/circuitMaze.js)*
- `materials/coral` — turbulence for the branching mass, a tight worley for the polyp *(src/materials/coral.js)*
- `materials/crackedClay` — CRACKED CLAY — a dry lakebed. The crack network is worley's F2−F1 cell *(src/materials/crackedClay.js)*
- `materials/crtScreen` — CRT SCREEN — the shadow mask done properly: phosphor triads striping across *(src/materials/crtScreen.js)*
- `materials/crystal` — worley cells read as gem facets: F1 posterized into flat planes, *(src/materials/crystal.js)*
- `materials/cumulus` — a cloud is not a shape, it is a density with light dying inside *(src/materials/cumulus.js)*
- `materials/damascus` — pattern-welded steel. Folded layers are just stripes; the *(src/materials/damascus.js)*
- `materials/ferrofluid` — the Rosensweig instability. Magnetised fluid wants to follow *(src/materials/ferrofluid.js)*
- `materials/forceField` — FORCE FIELD — hex lattice + fresnel shell + impact pulse rings. The *(src/materials/forceField.js)*
- `materials/glitch` — row-hashed uv tears over posterized noise bands, scanlines, and *(src/materials/glitch.js)*
- `materials/halftone` — print screen. The tone is sampled once per cell, at the cell *(src/materials/halftone.js)*
- `materials/hologram` — fresnel shell + traveling scanlines + flicker. Library rebuild *(src/materials/hologram.js)*
- `materials/ice` — worley crack veins + fresnel glaze + depth tint. Deliberately uses *(src/materials/ice.js)*
- `materials/kaleidoscope` — the angle is folded into one wedge and then mirrored about *(src/materials/kaleidoscope.js)*
- `materials/lavaLamp` — LAVA LAMP — worley blobs climbing through a warped domain. The domain *(src/materials/lavaLamp.js)*
- `materials/liquidMetal` — LIQUID METAL — fbm vertex ripple + dark chrome via sheared horizon bands. *(src/materials/liquidMetal.js)*
- `materials/magma` — domain-warped fbm through the fire ramp, with a cooling crust and *(src/materials/magma.js)*
- `materials/malachite` — botryoidal banding. The mineral grows in nested shells around *(src/materials/malachite.js)*
- `materials/marble` — domain-warped fbm veins through an N-stop ramp, with a polish *(src/materials/marble.js)*
- `materials/matrixRain` — MATRIX RAIN — one falling head per column, each with its own rate and *(src/materials/matrixRain.js)*
- `materials/moire` — MOIRÉ — two identical rulings, one turned by a slow angle. The wide dark *(src/materials/moire.js)*
- `materials/nebulaGlass` — NEBULA GLASS — the deep-space backdrop recipe sealed inside a fresnel *(src/materials/nebulaGlass.js)*
- `materials/neonTubes` — NEON TUBES — truchet routing sampled twice at the same cell count: once *(src/materials/neonTubes.js)*
- `materials/oilSlick` — OIL SLICK — thin-film interference over near-black water. The film's *(src/materials/oilSlick.js)*
- `materials/opal` — play-of-colour is diffraction off stacked silica spheres, so the *(src/materials/opal.js)*
- `materials/plasmaArcs` — PLASMA ARCS — ridged-fbm filaments thresholded into crawling lightning, *(src/materials/plasmaArcs.js)*
- `materials/plasmaGlobe` — PLASMA GLOBE — angular streaks give the filaments their radial anchor, *(src/materials/plasmaGlobe.js)*
- `materials/prismaticField` — PRISMATIC FIELD — thin-film interference under a drifting Truchet lattice: *(src/materials/prismaticField.js)*
- `materials/radarSweep` — RADAR SWEEP — a PPI scope. The beam is one angular position with an *(src/materials/radarSweep.js)*
- `materials/rainGlass` — RAIN GLASS — drops on a window, treated as lenses rather than as decals. *(src/materials/rainGlass.js)*
- `materials/rippleTank` — RIPPLE TANK — two dippers on a water surface. The moving crests are the *(src/materials/rippleTank.js)*
- `materials/rust` — oxide blooming across steel. A low-frequency fbm decides where the *(src/materials/rust.js)*
- `materials/sandDunes` — SAND DUNES — a transverse dune train: one sine ridge system warped so the *(src/materials/sandDunes.js)*
- `materials/shield` — worley cell lattice + fresnel rim + radial pulse. Library rebuild *(src/materials/shield.js)*
- `materials/snakeScales` — SNAKE SCALES — hexGrid's `dist` term doing double duty: it darkens toward *(src/materials/snakeScales.js)*
- `materials/snowflake` — twelve mirror sectors, which is six-fold rotation plus a *(src/materials/snowflake.js)*
- `materials/soapBubble` — SOAP BUBBLE — the film drains under gravity, so it is thin and nearly *(src/materials/soapBubble.js)*
- `materials/spiralGalaxy` — SPIRAL GALAXY — the arms are drawn as a logarithmic spiral in the angle, *(src/materials/spiralGalaxy.js)*
- `materials/stainedGlass` — STAINED GLASS — worley cells as leaded panes. Each pane's hue rides its *(src/materials/stainedGlass.js)*
- `materials/starfield` — hash-cell stars (worley machinery pointed at points of light): *(src/materials/starfield.js)*
- `materials/thermalCam` — THERMAL CAM — an fbm heat field remapped onto a real Planckian range and *(src/materials/thermalCam.js)*
- `materials/tigersEye` — TIGER'S EYE — chatoyancy, the cat's-eye band. The stone is crocidolite *(src/materials/tigersEye.js)*
- `materials/toonCel` — TOON CEL — posterized lambert bands from a fixed key light, gold-on-slate, *(src/materials/toonCel.js)*
- `materials/topoMap` — TOPO MAP — a cartographer's reading of an fbm height field: posterized *(src/materials/topoMap.js)*
- `materials/velvet` — the sheen lobe, not a diffuse lobe. Velvet's signature is that *(src/materials/velvet.js)*
- `materials/vortexFlow` — VORTEX FLOW — curl-noise directions folded into moving color bands: *(src/materials/vortexFlow.js)*

## noise

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `noise/curl` | ⑤ | 27.92 (28.93) | 0.3/0.3 | native/native | ✓ 0% | 36.5 ms ⚠ | 2026-07-29 |
| `noise/fbm` | ④ | 3.43 (3.57) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/fbm@fallback` | ③ | 1.83 (1.91) | 0.3/0.9 | fallback/fallback | ✓ 0% | 16.6 ms | 2026-07-29 |
| `noise/gradientNoise` | ③ | 1.12 (1.17) | 0.4/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/gradientNoise@fallback` | ③ | 1.34 (1.40) | 0.3/1.6 | fallback/fallback | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/ridgedFbm` | ④ | 3.46 (3.59) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/trigLattice` | ② | 0.47 (0.52) | 0.9/1.3 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/turbulence` | ④ | 3.40 (3.57) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/valueNoise` | ② | 0.72 (0.76) | 0.4/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/valueNoise2D` | ② | 0.67 (0.74) | 2.6/2.5 | native/native | ✓ 0% | 16.7 ms | 2026-08-16 |
| `noise/warp` | ⑤ | 10.23 (10.88) | 0.4/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1` | ④ | 5.92 (6.26) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1F2` | ⑤ | 11.17 (11.56) | 0.3/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `noise/worleyF1F2@fallback` | ④ | 3.58 (3.63) | 0.3/0.5 | fallback/fallback | ✓ 0% | 16.7 ms | 2026-07-29 |

- `noise/curl` — divergence-free curl noise via central differences over three *(src/noise/curl.js)*
- `noise/fbm` — fractal Brownian motion over a base noise. Native path is the mx *(src/noise/fbm.js)*
- `noise/gradientNoise` — 3D perlin-style noise. Native path is the mx adapter *(src/noise/gradientNoise.js)*
- `noise/ridgedFbm` — fbm with per-octave ridge transform (1−|n|)²: sharp crests *(src/noise/ridgedFbm.js)*
- `noise/trigLattice` — trigLattice / trigFlow — the site's cheap deterministic noise: summed *(src/noise/trigLattice.js)*
- `noise/turbulence` — fbm over |noise|: all-positive billows with sharp creases. *(src/noise/turbulence.js)*
- `noise/valueNoise` — pure-TSL 3D value noise: hashed lattice corners, smoothstep *(src/noise/valueNoise.js)*
- `noise/valueNoise2D` — the 2D sibling of valueNoise: hashed lattice corners, *(src/noise/valueNoise2D.js)*
- `noise/warp` — domain warping: displace a sample position by three offset fbm *(src/noise/warp.js)*
- `noise/worleyF1` — cellular noise. worleyF1 = distance to nearest feature point *(src/noise/worley.js)*
- `noise/worleyF1F2` — cellular noise. worleyF1 = distance to nearest feature point *(src/noise/worley.js)*

## pattern

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `pattern/bandedFlow` | ③ | 2.69 (2.80) | 0.3/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-30 |
| `pattern/curtain` | ④ | 5.00 (5.22) | 0.4/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/dissolve` | ④ | 3.59 (3.72) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/flicker` | ② | 0.47 (0.52) | 1.3/1.5 | native/native | ✓ 0% | 16.6 ms | 2026-07-29 |
| `pattern/grid` | ② | 0.46 (0.51) | 0.6/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/hexGrid` | ② | 0.51 (0.59) | 0.4/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/interference` | ② | 0.60 (0.74) | 2.5/1.9 | native/native | ✓ 0% | 16.7 ms | 2026-08-16 |
| `pattern/polarFold` | ② | 0.66 (0.74) | 0.5/2.6 | native/native | ✓ 0% | 16.7 ms | 2026-08-16 |
| `pattern/radialPulse` | ② | 0.46 (0.53) | 0.9/1.7 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/scanlines` | ② | 0.47 (0.52) | 2.1/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/sdf` | ② | 0.49 (0.59) | 1.0/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/spriteDisc` | ② | 0.47 (0.55) | 0.5/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/streaks` | ② | 0.54 (0.60) | 0.9/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/stripes` | ② | 0.46 (0.52) | 0.6/1.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/truchet` | ② | 0.51 (0.63) | 0.5/2.3 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/vignette` | ② | 0.46 (0.50) | 1.5/1.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `pattern/weave` | ② | 0.54 (0.62) | 1.3/2.5 | native/native | ✓ 0% | 16.7 ms | 2026-08-16 |

- `pattern/bandedFlow` — gas-giant latitude banding: a unit direction's y wobbled by *(src/pattern/bandedFlow.js)*
- `pattern/curtain` — aurora curtain: an fbm ridgeline the glow hangs from, hard top *(src/pattern/curtain.js)*
- `pattern/dissolve` — noise-threshold cutout with a glowing edge band, generalized *(src/pattern/dissolve.js)*
- `pattern/flicker` — bounded sinusoidal brightness wobble. Five hand-rolled shipped *(src/pattern/flicker.js)*
- `pattern/grid` — grid / hexGrid — line lattices over 2D coordinates. *(src/pattern/grid.js)*
- `pattern/hexGrid` — grid / hexGrid — line lattices over 2D coordinates. *(src/pattern/grid.js)*
- `pattern/interference` — the superposition of N circular waves, returned as both the *(src/pattern/interference.js)*
- `pattern/polarFold` — fold the plane into one wedge and MIRROR it about the wedge's *(src/pattern/polarFold.js)*
- `pattern/radialPulse` — rings expanding from a center, as shipped in the Lab SHIELD *(src/pattern/radialPulse.js)*
- `pattern/scanlines` — traveling emission bands along an axis, as shipped in the Lab *(src/pattern/scanlines.js)*
- `pattern/sdf` — 2D signed-distance minis + smooth boolean ops, for HUD-style *(src/pattern/sdf.js)*
- `pattern/spriteDisc` — spriteDisc / spriteDiamond — per-sprite alpha falloffs from sprite uv, *(src/pattern/spriteDisc.js)*
- `pattern/streaks` — angular lobes around a center: the sun's corona streamers *(src/pattern/streaks.js)*
- `pattern/stripes` — stripes / checker — the elementary tilings. *(src/pattern/stripes.js)*
- `pattern/truchet` — quarter-circle arc tiles with hash-flipped orientation: the *(src/pattern/truchet.js)*
- `pattern/vignette` — radial edge fade over centered uv, as shipped on the nebula *(src/pattern/vignette.js)*
- `pattern/weave` — interlaced warp and weft tows with a real over/under alternation. *(src/pattern/weave.js)*

## ramp

| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |
|---|---|---|---|---|---|---|---|
| `ramp/blackbody` | ② | 0.68 (1.20) | 0.4/2.6 | native/native | ✓ 0% | 16.7 ms | 2026-07-30 |
| `ramp/cosinePalette` | ③ | 2.66 (2.76) | 0.4/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/fireRamp` | ④ | 3.43 (3.56) | 0.3/0.4 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/posterize` | ③ | 2.67 (2.81) | 0.3/0.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |
| `ramp/ramp` | ② | 0.46 (0.52) | 2.0/1.5 | native/native | ✓ 0% | 16.7 ms | 2026-07-29 |

- `ramp/blackbody` — star/ember color from temperature in Kelvin. Chromaticity *(src/ramp/blackbody.js)*
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

- `src/gallery.js` — gallery — the Lab's node-gallery drawer: curated live visualizers for the
- `src/materials/dissolveMat.js` — DISSOLVE — noise-threshold cutout with a glowing ember edge. Library
- `src/materialsGallery.js` — materialsGallery — the material roster as iterable data, the counterpart to
- `src/noise/adapters/mx.js` — MaterialX adapters — the ONLY file allowed to touch mx_* symbols
- `src/noise/hashChannels.js` — hashChannels — n independent deterministic hash channels from one seed.
- `src/ramp/remap.js` — remap — map x from [inLo, inHi] to [outLo, outHi], clamped by default.
- `src/util/luminanceScale.js` — luminanceScale — JS-side (not a node): keep an additive particle field's
- `src/util/makeFlux.js` — makeFlux — the Lab's shared parameter: one uniform driving a scaled clock.
- `src/util/palette.js` — palette — every brand color in the Aurelius universe as color() nodes.
- `src/util/spherePoint.js` — spherePoint — uniform point on the unit sphere from two hash channels.
- `src/util/spinY.js` — spinY — rotate a direction around the y axis, as shipped for Terra's
