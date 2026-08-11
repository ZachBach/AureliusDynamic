/**
 * TOPO MAP — a cartographer's reading of an fbm height field: posterized
 * elevation tints under contour lines drawn where the height crosses a band
 * boundary. The line count and the tint count are the same number, so the
 * lines always land exactly on the colour steps.
 *
 * @cost    see REGISTRY materials/topoMap
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { posterize } from '../ramp/posterize.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'TOPO MAP';

const BANDS = 9;

export const apply = (TSL, mat) => {
  const { brand, terra } = palette(TSL);
  const h = fbm(TSL, TSL.positionLocal.mul(1.9), { octaves: 5 }).mul(0.5).add(0.5);
  const tint = ramp(TSL, posterize(TSL, h, { steps: BANDS }), [
    [0.0, brand.void],
    [0.35, terra.ocean],
    [0.55, terra.land],
    [0.8, brand.gold],
    [1.0, brand.ice],
  ]);
  const rings = h.mul(BANDS).fract();
  const line = TSL.smoothstep(0.09, 0.0, TSL.min(rings, rings.oneMinus()));
  mat.colorNode = tint.mul(0.55).add(brand.ice.mul(line.mul(0.8)));
  return { impl: 'native' };
};

export const source = () => `const h = fbm(posL.mul(1.9), { octaves: 5 })
  .mul(.5).add(.5);
const tint = ramp(posterize(h, { steps: 9 }),
  [[0, void], [.35, ocean], [.55, land],
   [.8, gold], [1, ice]]);
const rings = h.mul(9).fract();  // same 9 → lines on steps
const line = smoothstep(.09, 0,
  min(rings, rings.oneMinus()));
colorNode = tint.mul(.55)
  .add(ice.mul(line.mul(.8)));`;