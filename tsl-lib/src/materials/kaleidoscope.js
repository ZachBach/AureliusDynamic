/**
 * KALEIDOSCOPE — the angle is folded into one wedge and then mirrored about
 * the wedge's centre line. That mirror is the entire optical trick of the
 * instrument's two hinged mirrors; without the abs() you get rotation
 * symmetry, which looks like a pinwheel and not like a kaleidoscope.
 *
 * The fold itself now lives in `pattern/polarFold` (promoted 2026-08-16, when
 * SNOWFLAKE wanted the same twelve-sector version of it) — same math, one
 * copy.
 *
 * @cost    see REGISTRY materials/kaleidoscope
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { polarFold } from '../pattern/polarFold.js';
import { truchet } from '../pattern/truchet.js';
import { cosinePalette } from '../ramp/cosinePalette.js';

export const name = 'KALEIDOSCOPE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const { p: q, radius: r } = polarFold(TSL, TSL.uv().sub(0.5).mul(2), {
    sectors: 8, spin: clock.mul(0.08),
  });
  const tiles = truchet(TSL, q, { cells: 4, thickness: 0.07, soft: 0.03 });
  mat.colorNode = cosinePalette(TSL, r.mul(1.4).add(clock.mul(0.05)), { preset: 'aurelius' })
    .mul(tiles.mul(0.9).add(0.15))
    .add(brand.ice.mul(tiles.mul(0.25)));
  return { impl: 'native' };
};

export const source = () => `const { p: q, radius: r } = polarFold(
  uv().sub(.5).mul(2),
  { sectors: 8, spin: clock.mul(.08) });
// inside polarFold: .fract().sub(.5).abs() —
// fold, then MIRROR. Without the abs() it is a
// pinwheel, not a kaleidoscope
const tiles = truchet(q, { cells: 4 });
colorNode = cosinePalette(r.mul(1.4)
  .add(clock.mul(.05)))
  .mul(tiles.mul(.9).add(.15))
  .add(ice.mul(tiles.mul(.25)));`;
