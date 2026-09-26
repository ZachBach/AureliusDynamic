/**
 * simplex3D — 3D simplex noise. Ported from the `snoise` shipped with
 * three.js PR #33848 (`examples/jsm/tsl/math/curlNoise.js`, sunag), which is
 * the Ashima/Gustavson skewed-lattice construction: skew into a simplex grid,
 * take the four surrounding corners, hash a gradient at each through a
 * permutation polynomial, and sum with a radial falloff.
 *
 * Two deliberate differences from upstream, both auditable:
 *   • Upstream returns `.5 + 12·d` (unit range). The library's noise contract
 *     is signed, so this returns `24·d` — the same field, one multiply apart.
 *   • Upstream wraps the body in `Fn()` and uses `.assign()` / `.mulAssign()`.
 *     Library nodes build their graph inline and own no statement stack, so
 *     the two rebinds (`i`, the normalized gradients) become fresh consts.
 *
 * Why it earns a slot next to gradientNoise: the simplex lattice has no
 * axis-aligned grid artefacts, and its four-corner kernel costs less than the
 * eight-corner trilinear blend as dimensions rise. It is also what
 * curlSimplex needs as a potential.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec3 sample position
 * @returns {Node} float ≈[-1, 1] — a simplex lattice has no tunables
 * @cost    class ③ — four corners, three permute rounds, no texture fetch
 * @backend wgsl ✓ / glsl ✓
 */

// permutation polynomial: (34x² + x) mod 289, the Ashima hash
const permute4 = (TSL, x) => TSL.mod(x.mul(x).mul(34).add(x), 289);

// upstream's unit-range scale was 12; signed doubles it
const GAIN = 24;

export const simplex3D = (TSL, p) => {
  const { vec2, vec3, vec4, div, dot, floor, step, sub, min, max, mul, abs, inverseSqrt, mod } = TSL;
  const C = div(1, vec2(6, 3));
  const D = vec4(0, 0.5, 1, 2);

  // skew to the simplex lattice, then unskew the corner offset back
  const cell = floor(p.add(dot(p, C.yyy)));
  const x0 = p.sub(cell).add(dot(cell, C.xxx));
  const i = mod(cell, 289);

  // rank the components to pick which of the six simplices we are inside
  const g = step(x0.yzx, x0.xyz);
  const l = sub(1, g);
  const i1 = min(g.xyz, l.zxy);
  const i2 = max(g.xyz, l.zxy);
  const x1 = x0.sub(i1).add(C.x);
  const x2 = x0.sub(i2).add(C.y);
  const x3 = x0.sub(D.yyy);

  const h4 = permute4(TSL, permute4(TSL, permute4(TSL,
    i.z.add(vec4(0, i1.z, i2.z, 1)))
    .add(i.y).add(vec4(0, i1.y, i2.y, 1)))
    .add(i.x).add(vec4(0, i1.x, i2.x, 1)));

  // unpack each hash into a gradient on the 7x7 points of an octahedron
  const ns = mul(0.142857142857, D.wyz).sub(D.xzx);
  const j = h4.sub(mul(49, floor(h4.mul(ns.z).mul(ns.z))));
  const jx = floor(j.mul(ns.z));
  const x = jx.mul(ns.x).add(ns.yyyy);
  const y = floor(j.sub(mul(7, jx))).mul(ns.x).add(ns.yyyy);
  const h = sub(1, abs(x)).sub(abs(y));
  const b0 = vec4(x.xy, y.xy);
  const b1 = vec4(x.zw, y.zw);
  const sh = step(h, vec4(0)).negate();
  const a0 = b0.xzyw.add(floor(b0).mul(2).add(1).xzyw.mul(sh.xxyy));
  const a1 = b1.xzyw.add(floor(b1).mul(2).add(1).xzyw.mul(sh.zzww));
  const p0 = vec3(a0.xy, h.x);
  const p1 = vec3(a0.zw, h.y);
  const p2 = vec3(a1.xy, h.z);
  const p3 = vec3(a1.zw, h.w);

  const norm = inverseSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  const n0 = p0.mul(norm.x);
  const n1 = p1.mul(norm.y);
  const n2 = p2.mul(norm.z);
  const n3 = p3.mul(norm.w);

  // radial falloff: corners outside the simplex contribute nothing
  const m = max(sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))), 0);
  const m3 = m.mul(m).mul(m);
  return dot(m3, vec4(dot(n0, x0), dot(n1, x1), dot(n2, x2), dot(n3, x3))).mul(GAIN);
};

/**
 * simplexVec3 — three decorrelated simplex samples as one vector. The vector
 * potential curlSimplex differentiates; the offsets are upstream's.
 *
 * Upstream's `snoiseVec3` remaps its three components inconsistently — two of
 * the three `.mul(2).sub(1)` calls landed on the *input* coordinate rather
 * than the output, so only the middle component was actually centred. This
 * takes the already-signed value from each sample, which is what a potential
 * field wants and what the upstream form was reaching for.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec3 sample position
 * @returns {Node} vec3, each component ≈[-1, 1]
 * @cost    three simplex3D evaluations — not separately registered; it is a
 *          helper for curlSimplex, which carries the measured entry
 * @backend wgsl ✓ / glsl ✓
 */
export const simplexVec3 = (TSL, p) => TSL.vec3(
  simplex3D(TSL, p),
  simplex3D(TSL, potentialAxis(TSL, p, 1)),
  simplex3D(TSL, potentialAxis(TSL, p, 2)));

// the three decorrelating shuffles, shared with curlSimplex so both read the
// same potential field — a mismatch here would silently break divergence-free
export const potentialAxis = (TSL, q, axis) => {
  if (axis === 0) return q;
  if (axis === 1) return TSL.vec3(q.y.sub(19.1), q.z.add(33.4), q.x.add(47.2));
  return TSL.vec3(q.z.add(74.2), q.x.sub(124.5), q.y.add(99.4));
};

export const source = () => `const n = simplex3D(posL.mul(3));
// skewed lattice: four corners, not eight —
// no axis-aligned grid in the result
colorNode = cyan.mul(n.mul(.5).add(.5))
  .add(blue.mul(n.abs()));`;
