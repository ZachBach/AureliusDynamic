/**
 * cosinePalette — IQ's procedural palette: a + b·cos(2π(c·t + d)).
 * Infinite smooth cyclic gradients from four vec3 knobs.
 *
 * @param   {object} TSL
 * @param   {Node}   t  scalar driver (cyclic — any range)
 * @param   {object} opts
 * @param   {number[]} [opts.a=[.5,.5,.5]] offset
 * @param   {number[]} [opts.b=[.5,.5,.5]] amplitude
 * @param   {number[]} [opts.c=[1,1,1]]    frequency per channel
 * @param   {number[]} [opts.d=[0,.33,.67]] phase per channel
 * @param   {string} [opts.preset]  'aurelius' (gold→cyan→blue on dark) |
 *                                  'ember' (deep fire cycle)
 * @returns {Node} vec3 color (linear, 0..1 per channel when |b| ≤ a)
 * @cost    class ① — one cos
 * @backend wgsl ✓ / glsl ✓
 */
const PRESETS = {
  aurelius: { a: [0.45, 0.48, 0.55], b: [0.45, 0.35, 0.40], c: [1, 1, 1], d: [0.05, 0.42, 0.70] },
  ember: { a: [0.55, 0.30, 0.15], b: [0.45, 0.30, 0.15], c: [1, 1, 1], d: [0.00, 0.12, 0.25] },
};

export const cosinePalette = (TSL, t, opts = {}) => {
  const P = { ...(PRESETS[opts.preset] || {}), ...opts };
  const { a = [0.5, 0.5, 0.5], b = [0.5, 0.5, 0.5], c = [1, 1, 1], d = [0, 0.33, 0.67] } = P;
  const { vec3, cos } = TSL;
  return vec3(...a).add(vec3(...b).mul(cos(
    t.mul(vec3(...c)).add(vec3(...d)).mul(Math.PI * 2))));
};

export const source = () => `colorNode = cosinePalette(n, { preset: 'aurelius' });`;
