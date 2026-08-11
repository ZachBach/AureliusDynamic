/**
 * BLUEPRINT — two grid frequencies (fine ruling under a heavier major grid)
 * with an SDF part drawn over them as outline only. opSmoothSubtract bores
 * the circle out of the plate with a fillet, so the drawn part is a real
 * boolean solid rather than two shapes stacked.
 *
 * @cost    see REGISTRY materials/blueprint
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { gridLines } from '../pattern/grid.js';
import { sdCircle, sdBox, sdOutline, opSmoothSubtract } from '../pattern/sdf.js';

export const name = 'BLUEPRINT';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const uv = TSL.uv();
  const fine = gridLines(TSL, uv, { cells: 40, thickness: 0.02, soft: 0.012 });
  const major = gridLines(TSL, uv, { cells: 8, thickness: 0.02, soft: 0.01 });
  const p = uv.sub(0.5).mul(2);
  const plate = opSmoothSubtract(TSL, sdCircle(TSL, p, 0.28), sdBox(TSL, p, 0.62, 0.42), 0.05);
  mat.colorNode = brand.blue.mul(0.3)
    .add(brand.ice.mul(fine.mul(0.1)))
    .add(brand.ice.mul(major.mul(0.22)))
    .add(brand.ice.mul(sdOutline(TSL, plate, { width: 0.012 }).mul(1.1)));
  return { impl: 'native' };
};

export const source = () => `const fine = gridLines(uv(), { cells: 40 });
const major = gridLines(uv(), { cells: 8 });
const plate = opSmoothSubtract(   // bored, with a fillet
  sdCircle(p, .28), sdBox(p, .62, .42), .05);
colorNode = blue.mul(.3)
  .add(ice.mul(fine.mul(.1)))
  .add(ice.mul(major.mul(.22)))
  .add(ice.mul(sdOutline(plate,
    { width: .012 }).mul(1.1)));`;
