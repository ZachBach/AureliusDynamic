/**
 * CAUSTICS — the bright web light draws on a pool floor. Two worley fields
 * drift against each other on different axes; where both sit near a cell
 * boundary at once the sum spikes, and that intersection is the caustic.
 * Sharpening with pow keeps the web thin instead of blooming into fog.
 *
 * @cost    see REGISTRY materials/caustics
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1 } from '../noise/worley.js';

export const name = 'CAUSTICS';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const a = worleyF1(TSL, TSL.positionLocal.mul(3.1).add(TSL.vec3(clock.mul(0.07), 0, 0)), { impl: 'fallback' });
  const b = worleyF1(TSL, TSL.positionLocal.mul(3.7).sub(TSL.vec3(0, clock.mul(0.05), 0)), { impl: 'fallback' });
  const web = TSL.smoothstep(0.55, 0.98, a.add(b).mul(0.5)).pow(3);
  mat.colorNode = terra.ocean.mul(0.35)
    .add(terra.atmo.mul(web.mul(1.4)))
    .add(brand.ice.mul(web.pow(2).mul(1.2)));
  return { impl: 'fallback' };
};

export const source = () => `const a = worleyF1(posL.mul(3.1)
  .add(vec3(clock.mul(.07), 0, 0)));
const b = worleyF1(posL.mul(3.7)
  .sub(vec3(0, clock.mul(.05), 0)));
const web = smoothstep(.55, .98,
  a.add(b).mul(.5)).pow(3);    // both near an edge
colorNode = ocean.mul(.35)
  .add(atmo.mul(web.mul(1.4)))
  .add(ice.mul(web.pow(2).mul(1.2)));`;
