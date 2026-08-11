/**
 * BARK — ridged fbm with the domain squashed on Y, so the fissures run
 * along the trunk instead of wrapping around it. The anisotropy is the whole
 * trick: the same noise sampled isotropically reads as rock, not wood.
 *
 * @cost    see REGISTRY materials/bark
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'BARK';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  const p = TSL.vec3(
    TSL.positionLocal.x.mul(4.2),
    TSL.positionLocal.y.mul(0.55),
    TSL.positionLocal.z.mul(4.2));
  const ridges = ridgedFbm(TSL, p, { octaves: 4 });
  const grain = fbm(TSL, p.mul(3), { octaves: 2 }).mul(0.5).add(0.5);
  const fissure = TSL.smoothstep(0.75, 0.28, ridges);
  mat.colorNode = ramp(TSL, ridges.mul(grain.mul(0.4).add(0.7)), [
    [0.0, brand.void],
    [0.3, brand.slate],
    [0.62, solar.ember.mul(0.45)],
    [1.0, brand.silver.mul(0.7)],
  ]).mul(fissure.mul(-0.55).add(1));
  return { impl: 'native' };
};

export const source = () => `const p = vec3(posL.x.mul(4.2),
  posL.y.mul(.55),             // squash Y → grain runs
  posL.z.mul(4.2));            //   along the trunk
const ridges = ridgedFbm(p, { octaves: 4 });
const grain = fbm(p.mul(3), { octaves: 2 })
  .mul(.5).add(.5);
colorNode = ramp(ridges.mul(grain.mul(.4).add(.7)),
  [[0, void], [.3, slate],
   [.62, ember.mul(.45)], [1, silver.mul(.7)]])
  .mul(smoothstep(.75, .28, ridges)
    .mul(-.55).add(1));`;
