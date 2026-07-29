/**
 * curtain — aurora curtain: an fbm ridgeline the glow hangs from, hard top
 * edge, exponential decay downward, vertical rays. Parameterizes both
 * shipped curtains (docs/INVENTORY.md §4 — the near and far layers differ
 * only in these knobs).
 *
 * @param   {object} TSL
 * @param   {Node}   u  vec2: x across the curtain, y up (0..1)
 * @param   {object} opts
 * @param   {number} [opts.ridgeFreq=0.8]   ridgeline frequency across x
 * @param   {number} [opts.ridgeAmp=0.20]   ridgeline wobble
 * @param   {number} [opts.ridgeBase=0.62]  ridgeline height
 * @param   {number} [opts.decay=4.6]       downward falloff rate
 * @param   {number} [opts.rayFreq=3.0]     vertical-ray frequency
 * @param   {number} [opts.seed=3.1]        field offset (vary per layer)
 * @param   {Node}   [opts.clock]           drift (frozen in parity)
 * @returns {object} { glow, edge } — curtain body 0..1; ridgeline highlight
 * @cost    class ③ — two fbm evaluations
 * @backend wgsl ✓ / glsl ✓
 */
import { fbm } from '../noise/fbm.js';

export const curtain = (TSL, u, { ridgeFreq = 0.8, ridgeAmp = 0.20, ridgeBase = 0.62, decay = 4.6, rayFreq = 3.0, seed = 3.1, clock } = {}) => {
  const { vec3, float, smoothstep, exp } = TSL;
  const t = clock || float(0);
  const ridge = fbm(TSL, vec3(u.x.mul(ridgeFreq), t, seed), { octaves: 4, gain: 0.55 })
    .mul(ridgeAmp).add(ridgeBase);
  const ray = fbm(TSL, vec3(u.x.mul(rayFreq), t.mul(1.8), seed + 6.3), { octaves: 3 })
    .mul(0.5).add(0.5);
  const d = ridge.sub(u.y);
  const fall = smoothstep(0.0, 0.05, d).mul(exp(d.mul(-decay)));
  const glow = fall.mul(ray.pow(2).mul(0.8).add(0.2));
  const edge = smoothstep(0.035, 0.0, d.abs()).mul(ray.pow(2).mul(0.8).add(0.2));
  return { glow, edge };
};

export const source = () => `const { glow, edge } = curtain(uv(), { clock: t });
colorNode = cyan.mul(glow.mul(1.15))
  .add(gold.mul(edge.mul(.9)));`;
