# Phase 1 Inventory — every shader primitive in the shipped site

The complete census of TSL primitives in the hero module, mapped to their
target library home. Promote, don't rewrite: each entry names working, tuned
code — Phase 2 generalizes it without changing what ships.

**Line references** are into the extracted hero module (the only
`<script type="module">` in `build/template.html`) as of the 2026-07-27
extraction. Regenerate the reference file with `python tools/extract.py`; the
module is ~1,089 lines / 57.4 KB. Section anchors (comment headings in the
module) are stable across small edits; line numbers are not.

Census totals: **22 `hash()` call sites / 18 distinct magic salts · 11
`mx_fractal_noise_float` calls · 46 `color()` calls / ~25 distinct hexes ·
5 trig-lattice noise fields · 4 fresnel variants · 3 sphere-point idioms.**

---

## 1 · Noise family → `src/noise/`

| Primitive | Today | Form | Target |
|---|---|---|---|
| fbm (mx adapter) | sun body L382–383 · nebula L411–412 · aurora L760/762/768 · Lab wob/swirl/dissolve L908/910/932 · `cellsOf` fallback L855 | `mx_fractal_noise_float(p, octaves, lacunarity, gain)` — octaves 3–5, lacunarity always 2.0, gain 0.5–0.55 | `fbm()` via `adapters/mx.js`; pure-TSL fallback |
| worley F1 | Lab `cellsOf` L854–855 | `mx_worley_noise_float` feature-detected, falls back to `|fbm|` | `worleyF1()` via adapter; audit found `mx_worley_noise_vec2/vec3` also exported — check vec2 = (F1,F2) early in Phase 2 |
| **trig-lattice noise** (not in backlog — found in census) | sun granulation L339–340 · continents L458–460 · cloud clumps L493–494 · storm cells L500 | 2–3 products of `sin(p.axis·freq + phase)` summed — the site's cheap deterministic "noise", cost class ① | `trigLattice(p, {freqs, phases})` — worth keeping: far cheaper than fbm, and five shipped fields prove it reads well |
| turbulence flow field | compute turb L165–169 | vec3 of crossed sin terms driving particle velocities | `noise/trigFlow.js` — vec3 variant of trigLattice; also the future curl-noise seat |
| multi-channel hash | 22 sites: L113–115, 127–130, 150, 201–203, 219, 276–279, 309, 441–444 | `hash(instanceIndex.add(SALT))`, salts 0·11·53·91·211·517·523·777·888·1234·2468·3111·4242·5231·7777·31337·41111·52311 | `hashChannels(seed, n)` — kills the salt zoo. **Constraint:** channel pairs shared across passes (e.g. 1234/7777 in compute *and* render, 2468 in three places) must stay stable — same seed must yield same values everywhere |

## 2 · Ramp / color tools → `src/ramp/`

| Primitive | Today | Form | Target |
|---|---|---|---|
| fire ramp | sun body L387 | `(x)=>{ b=x·0.25 clamped ≤0.95; vec3(b,b²,b⁴)·4·0.6 }` — **the 0.95 clamp is load-bearing**: above it channel ordering inverts, plasma turns blue-white | `fireRamp(x)` with the clamp inside |
| 2-stop smoothstep ramps | sun bodyCol L342–343 · earth surfCol L486–487 · Lab LIQUID METAL band mix L912 | nested `mix(a, mix(b, c, smoothstep(...)), smoothstep(...))` | `ramp(stops[])` N-stop node |
| brightness remap | sun body `bright` L385 | `nz·3.4 + 1.15, max(0.28)` — floor keeps cool lanes dark-red not green | argument of `remap()` + documented example |

## 3 · Fresnel / rim kit → `src/fresnel/`

| Primitive | Today | Form | Target |
|---|---|---|---|
| fresnel (abs) | Lab shared `fres` L851–853 | `1 − |eye·normalWorld|`, used at pow 1/3/5/6 | `fresnel({power, bias, facing:'abs'})` |
| fresnel (front-only) | sun body L388–389 | `1 − max(eye·normal, 0), pow 3` | same node, `facing:'front'` |
| atmosphere shell | Terra atmo L546–551 | fresnel pow 3.5 · day-side factor from light dir · additive cyan/blue mix | `atmosphereShell({light, colors})` — composes fresnel + terminator |
| cheap z-rim | earth `rim` L480 | `1 − |rdir.z|` (view along z assumed) | document as fresnel fast-path, `facing:'axis'` |
| day/night terminator | earth L475–478 · atmo dayA L549 | `day = dir·L`; `dayShade = smoothstep(−0.15, 0.4, day)·0.82 + 0.18`; `night = smoothstep(0.05, −0.3, day)` | `terminator(dir, lightDir, opts)` → `{day, night}` |

## 4 · Pattern generators → `src/pattern/`

| Primitive | Today | Form | Target |
|---|---|---|---|
| scanlines | Lab HOLOGRAM L863 | `sin(posW.y·46 − t·6)·.5+.5 pow 3` | `scanlines(axisPos, {freq, speed, sharpness})` |
| radial pulse | Lab SHIELD L887 | `sin(len·9 − t·5)·.5+.5 pow 2` | `radialPulse(p, {freq, speed})` |
| horizon band | Lab LIQUID METAL L911 | `sin(normal.y·5.5 + swirl·3.2 + t·.7) pow 3` — fake chrome reflections sheared by a noise field | `horizonBand(normal, {axis, freq, shear})` |
| dissolve + ember edge | Lab DISSOLVE L932–935 | `alive = step(th, n)`; `edge = (1 − smoothstep(0, .1, n − th))·alive` | `dissolve(n, threshold, {edgeWidth})` → `{alive, edge}` |
| worley lattice | Lab SHIELD L885–886 | `smoothstep(.45, .92, worley)` | thin composition, document as recipe |
| flicker / twinkle | particle twinkle L234 · crystal glint L238 · sun flick L356 · city flicker L484 · Lab flick L864 | `sin(t·rate + phase)·depth + (1−depth)` — five hand-rolled instances | `flicker(t, {rate, phase, depth})` |
| lightning flash | earth L504–506 | `sin(...)·max(0)·pow 16 × waxing envelope (sin·max(0)·0.72 + 0.28 floor)` | `flash(t, opts)` + `pulseEnvelope(t, {floor})` |
| corona streak | sun L295 | `sin(th·3)·abs()·pow 2·0.85 + 0.35` — angular streamers | `streaks(angle, {lobes, sharpness})` |
| aurora curtain | aurora L760–771 | ridge line (fbm) − y → `smoothstep edge × exp(d·−4.6)` decay, × vertical rays (finer fbm pow 2); second curtain = same at different params | `curtain(uv, {ridge, decay, rays})` — parameterizing the two shipped instances |
| vignette | nebula L419 | `smoothstep(0.72, 0.28, uv.length())` | `vignette(uv, {inner, outer})` |
| sprite disc | particles L227–233 · sun L354–355 · earth L523–524 | `smoothstep(0.5, 0.06–0.08, |uv−.5|)` squared, optional hot core `pow(7)·0.5·DIM` | `spriteDisc(uv, {edge, core})` |
| diamond facet | crystal sprites L236–237 | `|q.x|+|q.y|` manhattan-dist `smoothstep` | `spriteDiamond(uv, opts)` |

## 5 · Utilities → `src/util/`

| Primitive | Today | Form | Target |
|---|---|---|---|
| sphere point from hashes | Dyson shells L152–155 · sun L287–290 · earth L452–455 | `y = h·2−1; s = √(1−y²); θ = h·2π (+drift)` → unit vec3 — three verbatim copies | `spherePoint(h1, h2, {drift})` |
| lat/lon → equirect uv | earth storm sampling L512–514 | `asin(y)`, 2-arg `atan` = atan2, scale to [0,1]² | `latlonUv(dir)` |
| axis-angle basis | sun CME frame L270–274 | JS-side orthonormal basis around eruption axis | `basisAround(axis)` (JS helper, not a node) |
| body-frame spin | earth L464–467 | y-axis rotation `vec3(x·c + z·s, y, z·c − x·s)` | `spinY(dir, angle)` |
| flux clock | Lab L849–850 | `time.mul(uFlux·1.8 + 0.25)` | `makeFlux(TSL)` → `{uniform, clock}` |
| per-instance rate clock | drift L138 · sun swirl L289 | `time.mul(hash·range + base)` | document as idiom with `hashChannels` |
| luminance auto-scale | DIM/SIZ L73–74 · SDIM L260 · EDIM L430 | JS: `clamp(k·√(refCount/count))` — keeps additive fields luminance-stable across particle counts | `luminanceScale(count, ref)` (JS helper) — needed the moment Lab materials meet particle counts |

## 6 · Palette census → `src/util/palette.js`

46 `color()` calls, four natural groups. The palette module should export all
four, not just brand:

- **brand** (Lab + particles + aurora): gold `F4C95D` · cyan `57D4FF` · blue `2B6CF6` · ice `EAF7FF` · ember `FF7A1A` · void `0A0E14` · silver `98A8BE` · slate `1E2836` · mist `9AA7BC`
- **solar** (sun sprite + body): hot `FFF2C9` · mid `FFC24D` · limb `FF7A1A` · ember `FF5A28` · cmeCore `FFF3D6` · cmeTail `FF7A24` · swarmWarm `FFB552` · white `FFFFFF`
- **terra** (earth): ocean `2E6BF0` · land `27C08A` · cloud `EAF3FF` · bolt `BFD9FF` · atmo `7FD4FF` · city `FFC97A` · ice `E9F3FF` · swarmCool `59D6FF`
- **nebula**: deep `14264F` (+ brand blue/cyan/gold accents)

## 7 · Uniform / gating conventions (document, don't wrap)

The global gates every hero material multiplies into opacity:
`uIntro` (load fade) · `uDim` (scroll recede, always as `uDim·k + (1−k)` with
per-body floor k) · `uDyson` (finale morph) · count-derived `DIM/SDIM/EDIM`.
Library materials destined for the bundle must accept an `opacityGate` node
option so these compose without the library knowing about them.

## 8 · Deferred — compute-pass dynamics (not material nodes)

Logged for the future flow/particle family, **out of scope** for the material
library: spring-to-target + exp damping (L161, L190), pointer inverse-square
repulsion (L171–173), CME shock-capture impulse (L180–187), strand/cloud
population splitting by hash thresholds (L132–136). These are particle-system
idioms; they graduate only if/when the library grows a compute story.

## 9 · Material recipes (future `src/materials/` ports)

Shipped materials that become library-built in Phases 5–6: the four Lab
materials (HOLOGRAM L858–878 · SHIELD L880–902 · LIQUID METAL L904–926 ·
DISSOLVE L928–950), El-Sol sun body (L377–392), nebula veil (L403–425),
Terra atmosphere shell (L542–555), aurora curtains (L750–779). The sprite
materials (helix particles, sun, earth) stay bespoke — they're count-tuned
scene systems, not reusable materials — but every primitive they use is
inventoried above.
