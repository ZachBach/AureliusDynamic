/**
 * worley — cellular noise. worleyF1 = distance to nearest feature point
 * (the SHIELD lattice's base field); worleyF1F2 = vec2(F1, F2), whose
 * y−x difference darkens at cell borders (the classic cell-wall shape).
 *
 * Native path: mx worley adapters. Fallback: pure-TSL 27-neighborhood
 * search, JS-unrolled, tracking two minima functionally
 * (F1' = min(F1, d); F2' = min(F2, max(F1, d))).
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec3 sample position
 * @param   {object} opts
 * @param   {string} [opts.impl='auto']  'auto' | 'fallback'
 * @returns {Node} float F1 (worleyF1) · vec2 (F1, F2) (worleyF1F2)
 * @cost    class ③ native · class ④ fallback (27 cells × 3 hashes)
 * @backend wgsl ✓ / glsl ✓ — availability of mx_worley_* varies by build:
 *          BACKEND-NOTES #3; that risk is why this adapter+fallback exists
 */
import { mxWorleyFloat, mxWorleyVec2 } from './adapters/mx.js';

const hash3 = (TSL, v) => {
  const { vec3, hash } = TSL;
  // offset the lattice into strictly positive territory first — dot-product
  // hashes correlate symmetrically around zero, which degenerates negative
  // regions into a regular grid (caught visually by the bench, 2026-07-27)
  const q = v.add(vec3(101.3, 211.7, 313.1));
  return vec3(
    hash(q.dot(vec3(1.0, 57.0, 113.0))),
    hash(q.dot(vec3(57.0, 113.0, 1.0))),
    hash(q.dot(vec3(113.0, 1.0, 57.0))));
};

const fallbackF1F2 = (TSL, p) => {
  const { vec3, vec2, float, min, max } = TSL;
  const i = p.floor();
  const f = p.fract();
  let f1 = float(1e3), f2 = float(1e3);
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const o = vec3(dx, dy, dz);
        const fp = o.add(hash3(TSL, i.add(o))).sub(f);
        const d = fp.dot(fp);
        const nf1 = min(f1, d);
        f2 = min(f2, max(f1, d));
        f1 = nf1;
      }
  return vec2(f1.sqrt(), f2.sqrt());
};

export const worleyF1 = (TSL, p, { impl = 'auto' } = {}) => {
  const mx = impl === 'auto' ? mxWorleyFloat(TSL) : null;
  return mx ? mx(p) : fallbackF1F2(TSL, p).x;
};

export const worleyF1F2 = (TSL, p, { impl = 'auto' } = {}) => {
  const mx = impl === 'auto' ? mxWorleyVec2(TSL) : null;
  return mx ? mx(p) : fallbackF1F2(TSL, p);
};

export const worleyImpl = (TSL, opts = {}) =>
  (opts.impl === 'auto' || opts.impl === undefined) && mxWorleyFloat(TSL) ? 'native' : 'fallback';

export const source = () => `const w = worleyF1(posL.mul(3.2));
const walls = worleyF1F2(posL.mul(3.2));
colorNode = blue.mul(walls.y.sub(walls.x)); // bright cores, dark borders`;
