/**
 * trigLattice / trigFlow — the site's cheap deterministic noise: summed
 * products of axis-pair sines. Five shipped fields use exactly this shape
 * (sun granulation, Terra continents, cloud clumps, storm cells, particle
 * turbulence — docs/INVENTORY.md §1). Far cheaper than fbm and reads
 * beautifully at planetary scales; the library's cost-class-① noise tier.
 *
 * Term parameters derive deterministically from `seed` via a JS PRNG at
 * build time — same seed, same field, forever.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec3 sample position
 * @param   {object} opts
 * @param   {number} [opts.terms=3]   sin-product pairs to sum (shipped: 2–3)
 * @param   {number} [opts.freq=3]    base spatial frequency
 * @param   {number} [opts.seed=0]    parameter-set selector
 * @param   {Node}   [opts.drift]     node added to the first axis phase
 *                                    (e.g. clock·rate for slow morphing)
 * @returns {Node} float in ≈[-1, 1] (normalized by term count)
 * @cost    class ① — 2 sins per term
 * @backend wgsl ✓ / glsl ✓
 */
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const AXES = ['x', 'y', 'z'];

export const trigLattice = (TSL, p, { terms = 3, freq = 3, seed = 0, drift } = {}) => {
  const { sin } = TSL;
  const rnd = mulberry32(seed * 2654435761 + 1);
  let sum = null;
  for (let t = 0; t < terms; t++) {
    const a = AXES[t % 3], b = AXES[(t + 1) % 3];
    const fa = freq * (0.7 + rnd() * 0.6), fb = freq * (0.7 + rnd() * 0.6);
    const pa = rnd() * Math.PI * 2, pb = rnd() * Math.PI * 2;
    let argA = p[a].mul(fa).add(pa);
    if (drift) argA = argA.add(drift);
    const term = sin(argA).mul(sin(p[b].mul(fb).add(pb)));
    sum = sum ? sum.add(term) : term;
  }
  return sum.div(terms);
};

// vec3 variant — the particle-turbulence shape (one independent lattice per
// component). Use as a cheap flow/force field.
export const trigFlow = (TSL, p, { terms = 2, freq = 0.7, seed = 0, drift } = {}) => {
  const { vec3 } = TSL;
  return vec3(
    trigLattice(TSL, p, { terms, freq, seed: seed * 3 + 1, drift }),
    trigLattice(TSL, p, { terms, freq, seed: seed * 3 + 2, drift }),
    trigLattice(TSL, p, { terms, freq, seed: seed * 3 + 3, drift }));
};

export const source = () => `const land = trigLattice(bodyDir, { terms: 3, freq: 3 });
const continents = smoothstep(.15, .55, land);`;
