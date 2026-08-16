/**
 * valueNoise2D — the 2D sibling of valueNoise: hashed lattice corners,
 * smoothstep fade, bilinear blend. Four corner hashes instead of eight, so
 * it is half the cost of sampling the 3D field on a uv-space material and
 * carries none of the third axis' wasted work.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 sample position
 * @returns {Node} float in [-1, 1]
 * @cost    class ② — 4 corner hashes + 3 mixes
 * @backend wgsl ✓ / glsl ✓ — corner hashes ride TSL's hash(); cross-backend
 *          agreement is exactly what the parity gate checks
 */
// lattice offset into positive territory: dot-product hashes correlate
// symmetrically around zero (see the matching note in worley.js).
// Named corner2, not corner: the inline Lab build concatenates every module
// into one scope, so a module-private name shared with valueNoise.js is a
// redeclaration that kills the whole widget (build-lab asserts this now).
const corner2 = (TSL, i) =>
  TSL.hash(i.add(TSL.vec2(101.3, 211.7)).dot(TSL.vec2(1.0, 57.0)));

export const valueNoise2D = (TSL, p) => {
  const { vec2, mix } = TSL;
  const i = p.floor();
  const f = p.fract();
  const u = f.mul(f).mul(f.mul(-2).add(3)); // smoothstep fade per axis
  const c = (dx, dy) => corner2(TSL, i.add(vec2(dx, dy)));
  const x0 = mix(c(0, 0), c(1, 0), u.x);
  const x1 = mix(c(0, 1), c(1, 1), u.x);
  return mix(x0, x1, u.y).mul(2).sub(1);
};

export const source = () => `const n = valueNoise2D(posL.xy.mul(9));
colorNode = ice.mul(n.mul(.5).add(.5));`;