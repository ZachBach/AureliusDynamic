/**
 * atmosphereShell — additive fresnel limb ring lit from a light direction,
 * as shipped on Terra (docs/INVENTORY.md §3): crisp cyan rim, brightest on
 * the day side. Render on a slightly-larger additive sphere under/over the
 * body.
 *
 * @param   {object} TSL
 * @param   {Node}   lightDir  unit direction toward the light
 * @param   {object} opts
 * @param   {number|Node} [opts.inner=0x2B6CF6]  color at glancing angles
 * @param   {number|Node} [opts.outer=0x57D4FF]  color at the very limb
 * @param   {number} [opts.power=3.5]
 * @param   {number} [opts.strength=0.55]
 * @param   {number[]} [opts.dayEdges=[-0.3, 0.5]]  day-side smoothstep
 * @returns {object} { color, opacity } — assign both; material should be
 *                   transparent + additive, depthWrite false
 * @cost    class ① — fresnel + dot + mixes
 * @backend wgsl ✓ / glsl ✓ — view-dependent (parity on sphere)
 */
import { fresnel } from './fresnel.js';

export const atmosphereShell = (TSL, lightDir, { inner = 0x2B6CF6, outer = 0x57D4FF, power = 3.5, strength = 0.55, dayEdges = [-0.3, 0.5] } = {}) => {
  const col = (c) => (typeof c === 'number' ? TSL.color(c) : c);
  const fres = fresnel(TSL, { power });
  const dayA = TSL.smoothstep(dayEdges[0], dayEdges[1], TSL.normalWorld.dot(lightDir)).mul(0.5).add(0.5);
  return {
    color: TSL.mix(col(inner), col(outer), fres).mul(dayA),
    opacity: fres.mul(strength),
  };
};

export const source = () => `const atmo = atmosphereShell(L);
colorNode = atmo.color; opacityNode = atmo.opacity;`;
