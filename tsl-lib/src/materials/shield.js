/**
 * SHIELD — worley cell lattice + fresnel rim + radial pulse. Library rebuild
 * of the shipped Lab material.
 *
 * @param   {object} TSL
 * @param   {object} mat
 * @param   {object} opts  { clock }
 * @cost    see REGISTRY materials/shield
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { worleyF1 } from '../noise/worley.js';
import { radialPulse } from '../pattern/radialPulse.js';

export const name = 'SHIELD';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const fres = fresnel(TSL);
  // fallback impl by choice: measures ~40% faster than mx native on the
  // baseline (registry: 3.58 vs 5.92 ms/pass) with identical cell character
  const w = worleyF1(TSL, TSL.positionLocal.mul(3.2).add(TSL.vec3(0, clock.mul(0.5), 0)), { impl: 'fallback' });
  const lattice = TSL.smoothstep(0.45, 0.92, w);
  const pulse = radialPulse(TSL, TSL.positionLocal, { freq: 9, speed: 5, sharpness: 2, clock });
  mat.colorNode = brand.blue.mul(lattice.mul(1.5))
    .add(brand.cyan.mul(fres.mul(1.2)))
    .add(brand.ice.mul(pulse.mul(lattice).mul(0.6)));
  mat.opacityNode = lattice.mul(0.5).add(fres.mul(0.55)).add(pulse.mul(0.12));
  return { impl: 'fallback' };
};

export const source = () => `const w = worleyF1(posL.mul(3.2),
  { impl: 'fallback' }); // faster than mx here
const lattice = smoothstep(.45, .92, w);
const pulse = radialPulse(posL,
  { freq: 9, clock: t });
colorNode = blue.mul(lattice.mul(1.5))
  .add(cyan.mul(fresnel().mul(1.2)))
  .add(ice.mul(pulse.mul(lattice).mul(.6)));
opacityNode = lattice.mul(.5)
  .add(fresnel().mul(.55)).add(pulse.mul(.12));`;
