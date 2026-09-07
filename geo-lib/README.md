# geo-lib

Procedural geometry for the studio's three.js projects. The counterpart to
[`tsl-lib`](../tsl-lib/): that one shades surfaces, this one makes them.

Zero dependencies — not even three.js. Every builder takes the three.js
namespace as its first argument, which is what lets the same file run inside
the Aurelius landing bundle (three inlined as a blob URL), inside Fallen-Heroes
(a vendored `.min.js` behind an import map), and inside echoGalaxy (npm, via
Vite). See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

```js
import { loft, assembly, roundedBox } from '../geo-lib/src/index.js';

const a = assembly(THREE);
a.part(loft(THREE, spine, { radial: 24 }), 0, 0, 0);
a.part(roundedBox(THREE, 2, 0.3, 2, 0.04), 0, -0.15, 0);
const mesh = a.build(material);        // forty pieces, one draw call
```

## What is in it

| module | what it is for |
| --- | --- |
| `core/loft` | a surface swept along a spine, its cross-section changing as it goes |
| `core/merge` | many geometries into one, so many parts cost one draw call |
| `core/assembly` | place pieces, then collapse them — `part`, `along`, `inFrame`, `build` |
| `solid/revolve` | a profile turned about Y, with the option not to be circular about it |
| `solid/tube` | a swept round section along a path, radius free to vary |
| `solid/roundedBox` | a box whose edges catch a highlight |
| `model/normalize` | put a loaded model where you meant it to go |

### loft is the one that matters

A lathe can only produce a body of revolution: a candle, a column, a bell, and
a traffic cone wherever you wanted a figure. Everything organic is a
cross-section carried along a curve — an arm, a neck, an animal's back, a
serpent, a single feather. One function covers all of them, and getting it
right is most of the difference between a diagram of a thing and the thing.

Three details in it are worth knowing before you use it:

- **Frames come from parallel transport.** Each section's frame is the previous
  one rotated by whatever carries the previous tangent onto this one. Deriving
  the frame from a fixed world up-vector instead flips wherever the spine
  passes through vertical, and the flip appears as a 180° twist in the middle
  of a neck.
- **`seed` names which way `rx` points at the first section**, so a caller can
  say "rx is the width across the shoulders" and mean it. Get it wrong and the
  section is correct but rotated ninety degrees — a bug that looks exactly like
  bad modelling.
- **`shape(angle, t)` is what makes a section something other than an ellipse.**
  Drapery folds, a keel, a crease, a scalloped rim. Watch the sampling: a
  pattern of 11 lobes against 26 radial segments is under three samples per
  lobe and vanishes completely into the smooth shading. Four or five per lobe
  is the floor.

`arc: [a0, a1]` sweeps part of a turn instead of all of it, which turns the
same function into a maker of open shells — a mantle, a cowl, a hood.

## The bench renders, it does not assert

```bash
node bench/render.mjs                  # both backends, every case
node bench/render.mjs webgl2           # one backend
node bench/render.mjs webgpu loft-arc  # one backend, one case
```

Writes `bench/out/<backend>/<case>-<angle>.png` at four angles each, and gates
on no console errors, the backend actually reached, finite bounds, and a
non-zero triangle count.

**Assertions are the wrong primary tool here**, and this is the reason the
bench looks the way it does. Every real bug found while building this library
produced a geometry that was perfectly valid and completely wrong:

- a wing of carefully shaped feathers, each one rotated individually from world
  axes, so every flat face ended up edge-on to the camera and twenty-six
  feathers rendered as twenty-six black threads;
- a brow ridge that rendered as sunglasses, because anything spanning the eyes
  catches a shadow across both of them;
- a profile flange silently deleted, because co-located sections were being
  dropped as duplicates;
- a down-facing rim on a silhouette going black and drawing a hard outline
  round a whole figure.

Not one of those would fail a unit test. All four are obvious in a picture.

Where a number genuinely is better — a fitted height, a base sitting on zero —
a case can carry a `check()` and the driver fails on it. `normalize` does.

For the interactive version: `python -m http.server 8631` from `geo-lib/`, then
`http://localhost:8631/bench/index.html`.

### three.js for the bench

geo-lib imports three from nowhere, so the bench has to supply one. It copies a
build into `bench/vendor/` (gitignored) from the first of these that exists:

1. `$GEO_THREE` — a `three/build` directory
2. `../echoGalaxy/node_modules/three/build`
3. `../El-Sol/node_modules/three/build`
4. `./node_modules/three/build`

It prints which one and which revision it found. That the library runs against
whatever three the machine happens to have is the point, not an accident.

`puppeteer-core` is borrowed from `../tsl-lib/bench` rather than installed
twice.

## Where this came from

Extracted from the Fallen-Heroes memorial renderer, where the three statues at
the crossing were first built out of boxes and spheres. That is honest for a
plinth and dishonest for a body: nothing alive has a constant cross-section,
and an assembly of primitives reads as an assembly of primitives however
carefully it is arranged. Replacing all of it with one loft is what made the
figures read.

The pieces that were specific to that room — the limestone shader, the
feather profile, the church itself — stayed there. What is here is what any
project would want.
