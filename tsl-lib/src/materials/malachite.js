/**
 * MALACHITE — botryoidal banding. The mineral grows in nested shells around
 * seed points, so the bands are iso-distance contours: a warped worley
 * distance through fract() gives the real structure, and fract()'s hard wrap
 * gives the sharp band boundary the stone actually has.
 *
 * @cost    see REGISTRY materials/malachite
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { warp } from '../noise/warp.js';
import { worleyF1 } from '../noise/worley.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'MALACHITE';

export const apply = (TSL, mat) => {
  const { brand, terra } = palette(TSL);
  const q = warp(TSL, TSL.positionLocal.mul(1.6), { amp: 0.35, octaves: 2 });
  const d = worleyF1(TSL, q, { impl: 'fallback' });
  const bands = d.mul(11).fract();
  mat.colorNode = ramp(TSL, bands, [
    [0.0, brand.void],
    [0.25, terra.land.mul(0.35)],
    [0.55, terra.land],
    [0.8, terra.atmo.mul(0.6)],
    [1.0, brand.ice.mul(0.75)],
  ]).mul(0.9);
  return { impl: 'fallback' };
};

export const source = () => `const q = warp(posL.mul(1.6), { amp: .35 });
const d = worleyF1(q, { impl: 'fallback' });
const bands = d.mul(11).fract();  // iso-distance shells
colorNode = ramp(bands,
  [[0, void], [.25, land.mul(.35)],
   [.55, land], [.8, atmo.mul(.6)],
   [1, ice.mul(.75)]]).mul(.9);`;
