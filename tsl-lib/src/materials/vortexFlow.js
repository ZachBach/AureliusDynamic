/**
 * VORTEX FLOW — curl-noise directions folded into moving color bands:
 * deliberately expensive, but a useful reference for the library's
 * divergence-free flow primitive on a real material.
 *
 * @cost    see REGISTRY materials/vortexFlow
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { curl } from '../noise/curl.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'VORTEX FLOW';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const flow = curl(
    TSL,
    TSL.positionLocal.mul(1.15).add(TSL.vec3(clock.mul(0.04), 0, clock.mul(0.025))),
    { octaves: 2, eps: 0.14 },
  );
  const phase = TSL.sin(flow.x.mul(5).add(flow.y.mul(3)).add(flow.z.mul(2)).add(clock.mul(1.5)))
    .mul(0.5)
    .add(0.5);
  const filament = TSL.smoothstep(0.64, 0.9, phase);
  const rim = fresnel(TSL, { power: 3.5 });
  mat.colorNode = TSL.mix(brand.blue, brand.cyan, phase).mul(0.75)
    .add(brand.gold.mul(filament.mul(0.7)))
    .add(brand.ice.mul(rim.mul(0.65)));
  return { impl: 'native' };
};

export const source = () => `const flow = curl(posL.mul(1.15).add(drift), {
  octaves: 2, eps: .14 });
const phase = sin(flow.x.mul(5)
  .add(flow.y.mul(3)).add(flow.z.mul(2))
  .add(t.mul(1.5))).mul(.5).add(.5);
const filament = smoothstep(.64, .9, phase);
colorNode = mix(blue, cyan, phase).mul(.75)
  .add(gold.mul(filament.mul(.7)))
  .add(ice.mul(fresnel({ power: 3.5 }).mul(.65)));`;
