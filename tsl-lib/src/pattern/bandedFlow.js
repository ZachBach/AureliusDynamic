/**
 * bandedFlow — gas-giant latitude banding: a unit direction's y wobbled by
 * fbm turbulence, folded through sin into repeating flow bands. Born on
 * echoGalaxy's gas giant (Phase G1); defaults are that shipped
 * Jupiter-ish look. A storm-spot vortex option was considered and left
 * out of v1 to keep the option surface small — callers composite their
 * own ovals (worley) until real demand appears.
 *
 * @param   {object} TSL
 * @param   {Node}   dir  unit vec3 in the body frame
 * @param   {object} opts
 * @param   {number} [opts.bands=6]      band pairs pole to pole
 * @param   {number} [opts.warpAmp=0.22] latitude wobble amplitude
 * @param   {number} [opts.warpFreq=2.4] wobble field frequency
 * @param   {number} [opts.seed=0]       field offset (vary per body)
 * @param   {Node}   [opts.drift]        slow flow drift (clock·rate)
 * @returns {Node} float 0..1 — band field; map through ramp/palette
 * @cost    class ③ — one fbm evaluation
 * @backend wgsl ✓ / glsl ✓ — parity-gated (bench pattern-bandedflow)
 */
import { fbm } from '../noise/fbm.js';

export const bandedFlow = (TSL, dir, { bands = 6, warpAmp = 0.22, warpFreq = 2.4, seed = 0, drift = null } = {}) => {
  let p = dir.mul(warpFreq);
  if (seed) p = p.add(TSL.vec3(0, seed, 0));
  if (drift) p = p.add(TSL.vec3(drift, 0, 0));
  const wobble = fbm(TSL, p, { octaves: 3 }).mul(warpAmp);
  return dir.y.add(wobble).mul(bands * Math.PI).sin().mul(0.5).add(0.5);
};

export const source = () => `const t = bandedFlow(bodyDir,
  { bands: 6, drift: clock.mul(.03) });
colorNode = ramp(t, stops);`;
