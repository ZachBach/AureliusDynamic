/**
 * OPAL — play-of-colour is diffraction off stacked silica spheres, so the
 * hue a patch shows depends on the viewing angle, not only on where the
 * patch is. Driving the palette with fresnel as well as with the cell index
 * is what makes it flash as the knot turns instead of sitting still.
 *
 * @cost    see REGISTRY materials/opal
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { fbm } from '../noise/fbm.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'OPAL';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const w = worleyF1F2(TSL, TSL.positionLocal.mul(3.6), { impl: 'fallback' });
  const view = fresnel(TSL, { power: 1 });
  const patch = cosinePalette(TSL, w.x.mul(3.1).add(view.mul(1.4)), { preset: 'aurelius' });
  const milk = fbm(TSL, TSL.positionLocal.mul(1.7), { octaves: 3 }).mul(0.5).add(0.5);
  const play = TSL.smoothstep(0.1, 0.45, w.y.sub(w.x));
  mat.colorNode = brand.ice.mul(milk.mul(0.28))
    .add(patch.mul(play.mul(1.15)))
    .add(brand.ice.mul(view.pow(4).mul(0.4)));
  return { impl: 'fallback' };
};

export const source = () => `const w = worleyF1F2(posL.mul(3.6),
  { impl: 'fallback' });
const view = fresnel({ power: 1 });
const patch = cosinePalette(
  w.x.mul(3.1).add(view.mul(1.4)));  // angle shifts hue
const play = smoothstep(.1, .45, w.y.sub(w.x));
colorNode = ice.mul(milk.mul(.28))
  .add(patch.mul(play.mul(1.15)))
  .add(ice.mul(view.pow(4).mul(.4)));`;
