/**
 * STAINED GLASS — worley cells as leaded panes. Each pane's hue rides its
 * own distance-to-seed through the cosine palette, so the glass varies
 * within a pane the way real cathedral glass does; F2−F1 draws the came.
 * Backlighting is inverted fresnel — brightest where we look straight
 * through, not at the grazing rim.
 *
 * @cost    see REGISTRY materials/stainedGlass
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'STAINED GLASS';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const w = worleyF1F2(TSL, TSL.positionLocal.mul(2.2), { impl: 'fallback' });
  const pane = cosinePalette(TSL, w.x.mul(2.6), { preset: 'aurelius' });
  const came = TSL.smoothstep(0.12, 0.02, w.y.sub(w.x));
  const backlight = fresnel(TSL, { power: 1.6 }).oneMinus();
  mat.colorNode = pane.mul(backlight.mul(0.8).add(0.45))
    .mul(came.oneMinus())
    .add(brand.void.mul(came));
  return { impl: 'fallback' };
};

export const source = () => `const w = worleyF1F2(posL.mul(2.2),
  { impl: 'fallback' });
const pane = cosinePalette(w.x.mul(2.6),
  { preset: 'aurelius' });
const came = smoothstep(.12, .02, w.y.sub(w.x));
const back = fresnel({ power: 1.6 }).oneMinus();
colorNode = pane.mul(back.mul(.8).add(.45))
  .mul(came.oneMinus())
  .add(void.mul(came));         // the lead`;
