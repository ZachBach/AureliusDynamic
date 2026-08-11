/**
 * SNAKE SCALES — hexGrid's `dist` term doing double duty: it darkens toward
 * each cell edge so every scale reads convex, and it also offsets the hue so
 * no two scales in a band land on exactly the same colour.
 *
 * @cost    see REGISTRY materials/snakeScales
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { hexGrid } from '../pattern/grid.js';
import { fbm } from '../noise/fbm.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'SNAKE SCALES';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const { edge, dist } = hexGrid(TSL, TSL.positionLocal.xy, { cells: 9, thickness: 0.05, soft: 0.03 });
  const band = fbm(TSL, TSL.positionLocal.mul(1.6), { octaves: 3 }).mul(0.5).add(0.5);
  const hue = cosinePalette(TSL, band.mul(0.8).add(dist.mul(0.3)), { preset: 'aurelius' });
  const dome = TSL.smoothstep(0.5, 0.0, dist);
  mat.colorNode = hue.mul(dome.mul(0.55).add(0.45))
    .mul(edge.oneMinus().mul(0.8).add(0.2))
    .add(brand.ice.mul(fresnel(TSL, { power: 4 }).mul(dome).mul(0.5)));
  return { impl: 'native' };
};

export const source = () => `const { edge, dist } = hexGrid(posL.xy,
  { cells: 9 });
const band = fbm(posL.mul(1.6)).mul(.5).add(.5);
const hue = cosinePalette(
  band.mul(.8).add(dist.mul(.3)));  // dist shifts hue
const dome = smoothstep(.5, 0, dist); // …and domes it
colorNode = hue.mul(dome.mul(.55).add(.45))
  .mul(edge.oneMinus().mul(.8).add(.2))
  .add(ice.mul(fresnel({ power: 4 })
    .mul(dome).mul(.5)));`;
