/**
 * TOON CEL — posterized lambert bands from a fixed key light, gold-on-slate,
 * with a fresnel ink outline and a biased rim.
 *
 * @cost    see REGISTRY materials/toonCel
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { posterize } from '../ramp/posterize.js';
import { fresnel } from '../fresnel/fresnel.js';
import { rimLight } from '../fresnel/rimLight.js';

export const name = 'TOON CEL';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const L = TSL.vec3(0.65, 0.6, 0.47).normalize();
  const shade = TSL.normalWorld.dot(L).mul(0.5).add(0.5);
  const cel = posterize(TSL, shade, { steps: 3 });
  const outline = TSL.smoothstep(0.72, 0.92, fresnel(TSL));
  mat.colorNode = TSL.mix(brand.slate.mul(0.6), brand.gold, cel)
    .mul(outline.oneMinus().mul(0.9).add(0.1))
    .add(rimLight(TSL, { color: brand.ice, power: 3, dir: L, biasAmount: 0.9 }).mul(0.4));
  return { impl: 'native' };
};

export const source = () => `const shade = normal.dot(L).mul(.5).add(.5);
const cel = posterize(shade, { steps: 3 });
const outline = smoothstep(.72, .92, fresnel());
colorNode = mix(slate.mul(.6), gold, cel)
  .mul(outline.oneMinus().mul(.9).add(.1))
  .add(rimLight({ color: ice, dir: L,
    biasAmount: .9 }).mul(.4));`;
