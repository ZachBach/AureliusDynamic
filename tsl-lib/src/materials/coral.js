/**
 * CORAL — turbulence for the branching mass, a tight worley for the polyp
 * mouths pitting it. Thin living tissue over a white aragonite skeleton
 * scatters forward, so the rim glows warm where the shell is thinnest —
 * fresnel standing in for subsurface transport.
 *
 * @cost    see REGISTRY materials/coral
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { turbulence } from '../noise/turbulence.js';
import { worleyF1F2 } from '../noise/worley.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'CORAL';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const t = turbulence(TSL, TSL.positionLocal.mul(3.4), { octaves: 4 });
  const polyps = worleyF1F2(TSL, TSL.positionLocal.mul(7.5), { impl: 'fallback' });
  const mouth = TSL.smoothstep(0.22, 0.03, polyps.x);
  const scatter = fresnel(TSL, { power: 2 });
  mat.colorNode = cosinePalette(TSL, t.mul(1.3).add(0.15), { preset: 'ember' })
    .mul(t.mul(0.6).add(0.5))
    .add(brand.ice.mul(mouth.mul(0.35)))
    .add(brand.ember.mul(scatter.mul(0.45)));
  return { impl: 'fallback' };
};

export const source = () => `const t = turbulence(posL.mul(3.4));
const polyps = worleyF1F2(posL.mul(7.5),
  { impl: 'fallback' });
const mouth = smoothstep(.22, .03, polyps.x);
colorNode = cosinePalette(t.mul(1.3).add(.15),
  { preset: 'ember' })
  .mul(t.mul(.6).add(.5))
  .add(ice.mul(mouth.mul(.35)))
  .add(ember.mul(fresnel({ power: 2 }).mul(.45)));`;
