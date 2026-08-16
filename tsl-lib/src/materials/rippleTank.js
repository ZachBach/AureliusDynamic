/**
 * RIPPLE TANK — two dippers on a water surface. The moving crests are the
 * obvious half; the still half is the interesting one. Where the two paths
 * differ by half a wavelength the waves cancel for every phase of the clock,
 * and those cancellations lie on hyperbolae fixed in the tank. Reading them
 * off `interference`'s envelope — which has no time term at all — draws them
 * as the geometry they are instead of hoping to catch a good frame.
 *
 * @cost    see REGISTRY materials/rippleTank
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { interference } from '../pattern/interference.js';

export const name = 'RIPPLE TANK';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const p = TSL.positionLocal.xy;
  const { field, envelope } = interference(TSL, p, {
    sources: [[-0.55, -0.2], [0.55, -0.2]],
    freq: 26, speed: 3.4, decay: 0.8, clock,
  });
  const crest = TSL.smoothstep(0.12, 0.62, field);
  const trough = TSL.smoothstep(-0.12, -0.62, field);
  const nodal = TSL.smoothstep(0.34, 0.02, envelope); // the standing dark lines
  mat.colorNode = terra.ocean.mul(0.22)
    .add(terra.atmo.mul(crest.mul(0.95)))
    .add(brand.blue.mul(trough.mul(0.45)))
    .add(brand.ice.mul(crest.pow(3).mul(0.9)))
    .mul(nodal.mul(-0.75).add(1));
  return { impl: 'native' };
};

export const source = () => `const { field, envelope } =
  interference(posL.xy, { sources: 2, freq: 26, clock });
const nodal = smoothstep(.34, .02, envelope);
// envelope carries no time term, so the dark
// hyperbolae are geometry, not a lucky frame
colorNode = ocean.mul(.22)
  .add(atmo.mul(crest.mul(.95)))
  .add(blue.mul(trough.mul(.45)))
  .add(ice.mul(crest.pow(3).mul(.9)))
  .mul(nodal.mul(-.75).add(1));`;