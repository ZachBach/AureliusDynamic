# geo-lib conventions

The rules that make these modules portable between the studio's projects. They
mirror [`tsl-lib/docs/CONVENTIONS.md`](../../tsl-lib/docs/CONVENTIONS.md)
deliberately — the two libraries are halves of the same idea, and someone who
knows one should not have to learn a second set of habits for the other.

## Builders import nothing external

Every builder takes the three.js namespace as its **first argument**:

```js
loft(THREE, spine, opts)
merge(THREE, geometries)
assembly(THREE)
```

Never `import * as THREE from 'three'`.

This is not stylistic. The studio has three live three.js situations at once
and this library claims to serve all of them:

| project | how three.js is resolved |
| --- | --- |
| Aurelius landing bundle | inlined into one HTML file, loaded as a blob URL |
| Fallen-Heroes | vendored `.min.js` behind an import map |
| echoGalaxy | npm, resolved by Vite |

A bare `import 'three'` resolves differently in the second and third and does
not resolve at all in the first. Passing the namespace in works in every case
and costs one argument.

Relative imports **between geo-lib modules** are fine — `assembly` imports
`merge`, `revolve` imports `loft`. The rule is about external packages.

## Domain input is positional, tunables are an options object

`(THREE, <the thing>, opts)`. The spine, the profile, the points, the
geometries — whatever the builder is fundamentally about — is positional.
Everything else has a default and lives in `opts`.

```js
tube(THREE, points, radius, { radial: 12, seed: [0, 0, 1] })
```

## Builders return geometry, not meshes

A builder returns a `BufferGeometry` with `position`, `normal` and `uv`, and
knows nothing about materials, lights or scenes. `assembly.build()` is the one
exception, and only because a merged mesh is the point of it.

Always emit `uv`, even where nothing samples it. `merge` requires every input
to carry the same attribute set, and a hand-built geometry missing `uv` next to
a three primitive that has one is the most common way to hit that error.

## No addons, ever

Not `BufferGeometryUtils`, not `SkeletonUtils`, nothing from `examples/jsm`.
`merge` is written out longhand here specifically so the library has a
dependency footprint of zero. If a builder needs an addon, it needs to be
rewritten or it does not belong here.

## Version range

three r178 and r184 both. Unlike `tsl-lib`, which is pinned to r178 because a
TSL node can only import symbols that exist in that build, geometry touches
almost nothing that moves: `BufferGeometry`, `BufferAttribute`,
`Float32BufferAttribute`, `Vector3`, `Quaternion`, `Matrix4`, `Box3`,
`Object3D`, and the primitive geometries. Those have been stable for years.

The bench reports which revision it ran against. If a builder ever does need
something newer, say so in its header and in the README table.

## Determinism

**No `Math.random()`.** Anywhere. These builders make things that get looked at
twice — a memorial has to be the same room on the second visit, and a bench
screenshot has to be diffable against the last one. Where scatter is wanted,
hash the index:

```js
const j = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
const wob = (j - Math.floor(j)) - 0.5;      // -0.5 .. 0.5, stable
```

## Guard the invisible failures

Geometry fails silently. A NaN does not throw, it makes the mesh vanish. A
dropped section does not warn, it deletes a feature. A flipped winding does not
error, it turns a solid inside out. So:

- Never let a degenerate input produce NaN. Detect it and throw with a message
  that names the input — `loft` widens its tangent window rather than dividing
  by a zero length, and throws if the whole spine is one point.
- Throw on mismatched inputs rather than coercing. `merge` names both attribute
  sets when they differ, because the alternative is a shrug from inside a
  typed-array copy.
- Never use a mirror matrix to make a left-hand copy of a right-hand part. The
  determinant is negative, the winding flips and the piece renders inside out.
  Build both sides from a `side` factor.

## The bench renders

See the README. A geometry test that only asserts is testing the wrong thing:
every real bug found while writing this library produced a geometry that was
perfectly valid and completely wrong.
