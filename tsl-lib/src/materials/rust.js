/**
 * RUST — oxide blooming across steel. A low-frequency fbm decides where the
 * rust has taken hold, a high-frequency worley pits the surface underneath,
 * and dissolve's edge term draws the active corrosion front between them.
 *
 * @cost    see REGISTRY materials/rust
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { worleyF1 } from '../noise/worley.js';
import { ramp } from '../ramp/ramp.js';
import { dissolve } from '../pattern/dissolve.js';

export const name = 'RUST';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  const patch = fbm(TSL, TSL.positionLocal.mul(2.1), { octaves: 4 }).mul(0.5).add(0.5);
  const pit = worleyF1(TSL, TSL.positionLocal.mul(9), { impl: 'fallback' });
  const bloom = TSL.smoothstep(0.42, 0.72, patch);
  const oxide = ramp(TSL, patch.sub(pit.mul(0.25)), [
    [0.0, brand.slate],
    [0.4, brand.silver],
    [0.62, solar.ember],
    [0.8, solar.limb],
    [1.0, brand.gold],
  ]);
  const { edge } = dissolve(TSL, patch, 0.36, { edgeWidth: 0.12 });
  mat.colorNode = TSL.mix(brand.slate.mul(0.8), oxide, bloom)
    .add(solar.ember.mul(edge.mul(0.6)))
    .mul(pit.mul(0.3).add(0.75));
  return { impl: 'fallback' };
};

export const source = () => `const patch = fbm(posL.mul(2.1))
  .mul(.5).add(.5);            // where rust took hold
const pit = worleyF1(posL.mul(9),
  { impl: 'fallback' });       // surface pitting
const oxide = ramp(patch.sub(pit.mul(.25)),
  [[0, slate], [.4, silver], [.62, ember],
   [.8, limb], [1, gold]]);
const { edge } = dissolve(patch, .36,
  { edgeWidth: .12 });         // corrosion front
colorNode = mix(slate.mul(.8), oxide,
  smoothstep(.42, .72, patch))
  .add(ember.mul(edge.mul(.6)))
  .mul(pit.mul(.3).add(.75));`;