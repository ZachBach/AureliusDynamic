/**
 * CRYSTAL — worley cells read as gem facets: F1 posterized into flat planes,
 * F2−F1 as the bright seam where two facets meet. Uses the pure-TSL worley
 * fallback by choice, following ice/shield — it benches faster than mx here.
 *
 * @cost    see REGISTRY materials/crystal
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { posterize } from '../ramp/posterize.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'CRYSTAL';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const w = worleyF1F2(TSL, TSL.positionLocal.mul(2.4), { impl: 'fallback' });
  const depth = posterize(TSL, w.x.mul(1.6).clamp(0, 1), { steps: 5 });
  const seam = TSL.smoothstep(0.09, 0.0, w.y.sub(w.x));
  const glaze = fresnel(TSL, { power: 2.5 });
  mat.colorNode = TSL.mix(brand.blue.mul(0.35), brand.cyan, depth)
    .add(brand.ice.mul(seam.mul(0.9)))
    .add(brand.ice.mul(glaze.mul(0.5)));
  return { impl: 'fallback' };
};

export const source = () => `const w = worleyF1F2(posL.mul(2.4),
  { impl: 'fallback' });       // faster than mx here
const depth = posterize(w.x.mul(1.6)
  .clamp(0, 1), { steps: 5 }); // flat facets
const seam = smoothstep(.09, 0, w.y.sub(w.x));
colorNode = mix(blue.mul(.35), cyan, depth)
  .add(ice.mul(seam.mul(.9)))
  .add(ice.mul(fresnel({ power: 2.5 }).mul(.5)));`;
