/**
 * KALEIDOSCOPE — the angle is folded into one wedge and then mirrored about
 * the wedge's centre line. That mirror is the entire optical trick of the
 * instrument's two hinged mirrors; without the abs() you get rotation
 * symmetry, which looks like a pinwheel and not like a kaleidoscope.
 *
 * @cost    see REGISTRY materials/kaleidoscope
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { truchet } from '../pattern/truchet.js';
import { cosinePalette } from '../ramp/cosinePalette.js';

export const name = 'KALEIDOSCOPE';

const SECTORS = 8;
const SEG = (Math.PI * 2) / SECTORS;

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.uv().sub(0.5).mul(2);
  const r = p.length();
  const a = TSL.atan(p.y, p.x).add(clock.mul(0.08));
  const folded = a.div(SEG).fract().sub(0.5).abs().mul(SEG);
  const q = TSL.vec2(TSL.cos(folded).mul(r), TSL.sin(folded).mul(r));
  const tiles = truchet(TSL, q, { cells: 4, thickness: 0.07, soft: 0.03 });
  mat.colorNode = cosinePalette(TSL, r.mul(1.4).add(clock.mul(0.05)), { preset: 'aurelius' })
    .mul(tiles.mul(0.9).add(0.15))
    .add(brand.ice.mul(tiles.mul(0.25)));
  return { impl: 'native' };
};

export const source = () => `const a = atan(p.y, p.x).add(clock.mul(.08));
const folded = a.div(SEG).fract()
  .sub(.5).abs().mul(SEG);     // fold, then MIRROR
const q = vec2(cos(folded).mul(r),
  sin(folded).mul(r));
const tiles = truchet(q, { cells: 4 });
colorNode = cosinePalette(r.mul(1.4)
  .add(clock.mul(.05)))
  .mul(tiles.mul(.9).add(.15))
  .add(ice.mul(tiles.mul(.25)));`;
