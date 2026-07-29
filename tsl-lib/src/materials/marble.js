/**
 * MARBLE — domain-warped fbm veins through an N-stop ramp, with a polish
 * fresnel. Slate body, mist veining, hairline gold seams.
 *
 * @cost    see REGISTRY materials/marble
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { warp } from '../noise/warp.js';
import { ramp } from '../ramp/ramp.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'MARBLE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.mul(1.9).add(TSL.vec3(clock.mul(0.03), 0, 0));
  const veins = fbm(TSL, warp(TSL, p, { amp: 0.9 }), { octaves: 4 }).mul(0.5).add(0.5);
  mat.colorNode = ramp(TSL, veins, [
    [0.18, brand.slate], [0.48, brand.mist], [0.72, brand.ice], [0.90, brand.gold],
  ]).add(brand.ice.mul(fresnel(TSL, { power: 4 }).mul(0.5)));
  return { impl: 'native' };
};

export const source = () => `const veins = fbm(warp(posL, { amp: .9 }))
  .mul(.5).add(.5);
colorNode = ramp(veins, [
  [.18, slate], [.48, mist],
  [.72, ice], [.90, gold]])
  .add(ice.mul(fresnel({ power: 4 }).mul(.5)));`;
