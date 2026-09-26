/**
 * curlSimplex — divergence-free flow from a simplex vector potential, the
 * turbulence term in three.js PR #33848 (`curlNoise`, sunag). Taking the curl
 * of any vector field gives a field with zero divergence, which is why it
 * reads as fluid: nothing sources or sinks, so advected detail swirls instead
 * of piling up.
 *
 * Distinct from `noise/curl`, which differentiates three fbm potentials. Same
 * mathematics, different base field: fbm gives soft billowing, the simplex
 * potential gives the tighter high-frequency curl the fire example wants.
 * It is also the cheaper of the two by a wide margin — `noise/curl` spends 12
 * fbm evaluations where this spends 12 simplex ones, and only this side of
 * the pair comes in under the mobile advisory budget. Both entries in
 * REGISTRY.json carry the measured numbers.
 *
 * ⚠ Cost note, and it is the honest reason to read before using: upstream
 * builds the full `snoiseVec3` at all six offset points — 18 simplex
 * evaluations — but only two of each three components are ever read. Taking
 * just the six needed component pairs gives a bit-identical result for 12
 * evaluations. That is the only change; the differencing is upstream's.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec3 sample position
 * @param   {object} opts
 * @param   {number} [opts.eps=0.1]  central-difference step — smaller is a
 *                                   truer derivative and a noisier one
 * @returns {Node} vec3 divergence-free flow vector
 * @cost    class ⑤ — 12 simplex3D evaluations
 * @backend wgsl ✓ / glsl ✓
 */
import { simplex3D, potentialAxis } from './simplex3D.js';

// component `axis` of the vector potential at q
const psi = (TSL, q, axis) => simplex3D(TSL, potentialAxis(TSL, q, axis));

export const curlSimplex = (TSL, p, { eps = 0.1 } = {}) => {
  const { vec3 } = TSL;
  const dx = vec3(eps, 0, 0), dy = vec3(0, eps, 0), dz = vec3(0, 0, eps);
  const inv = 1 / (2 * eps);
  // central difference of potential component `axis` along `step`
  const d = (axis, step) => psi(TSL, p.add(step), axis).sub(psi(TSL, p.sub(step), axis));
  // curl = (∂Ψz/∂y − ∂Ψy/∂z, ∂Ψx/∂z − ∂Ψz/∂x, ∂Ψy/∂x − ∂Ψx/∂y)
  return vec3(
    d(2, dy).sub(d(1, dz)),
    d(0, dz).sub(d(2, dx)),
    d(1, dx).sub(d(0, dy))).mul(inv);
};

export const source = () => `const flow = curlSimplex(posL.mul(1.5));
// curl of a potential has zero divergence, so
// advected detail swirls instead of piling up
colorNode = flow.mul(.5).add(.5);`;
