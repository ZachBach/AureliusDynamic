/**
 * LAVA LAMP — worley blobs climbing through a warped domain. The domain
 * drifts downward, which reads as the wax rising; the warp keeps the cells
 * from ever looking like a lattice.
 *
 * @cost    see REGISTRY materials/lavaLamp
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1 } from '../noise/worley.js';
import { warp } from '../noise/warp.js';
import { fireRamp } from '../ramp/fireRamp.js';
import { remap } from '../ramp/remap.js';

export const name = 'LAVA LAMP';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const rise = TSL.positionLocal.mul(1.5).add(TSL.vec3(0, clock.mul(-0.09), 0));
  const blob = worleyF1(TSL, warp(TSL, rise, { amp: 0.45, octaves: 2 }), { impl: 'fallback' });
  const body = TSL.smoothstep(0.55, 0.12, blob);
  mat.colorNode = brand.void.mul(0.7)
    .add(fireRamp(TSL, remap(TSL, body, 0, 1, 0.4, 3.6)).mul(body.mul(0.8).add(0.2)))
    .add(brand.gold.mul(TSL.smoothstep(0.3, 0.1, blob).mul(0.25)));
  return { impl: 'fallback' };
};

export const source = () => `const rise = posL.mul(1.5)
  .add(vec3(0, clock.mul(-.09), 0));
const blob = worleyF1(warp(rise, { amp: .45 }),
  { impl: 'fallback' });
const body = smoothstep(.55, .12, blob);
colorNode = void.mul(.7)
  .add(fireRamp(remap(body, 0, 1, .4, 3.6))
    .mul(body.mul(.8).add(.2)))
  .add(gold.mul(smoothstep(.3, .1, blob).mul(.25)));`;