/**
 * NEON TUBES — truchet routing sampled twice at the same cell count: once
 * thin and hard for the discharge core, once thick and soft for the halo it
 * throws onto the wall behind it. Two passes of a class-② node buys a glow
 * that a single blurred pass cannot fake.
 *
 * @cost    see REGISTRY materials/neonTubes
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { truchet } from '../pattern/truchet.js';
import { flicker } from '../pattern/flicker.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'NEON TUBES';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const q = TSL.positionLocal.xy;
  const core = truchet(TSL, q, { cells: 5, thickness: 0.035, soft: 0.012 });
  const halo = truchet(TSL, q, { cells: 5, thickness: 0.12, soft: 0.14 });
  const buzz = flicker(TSL, clock, { rate: 7, depth: 0.12 });
  mat.colorNode = brand.void.mul(0.8)
    .add(brand.blue.mul(halo.mul(0.55)))
    .add(brand.cyan.mul(core.mul(1.5).mul(buzz)))
    .add(brand.ice.mul(core.mul(buzz).mul(0.9)))
    .add(brand.blue.mul(fresnel(TSL, { power: 3 }).mul(0.2)));
  return { impl: 'native' };
};

export const source = () => `const core = truchet(posL.xy,
  { cells: 5, thickness: .035 });  // discharge
const halo = truchet(posL.xy,
  { cells: 5, thickness: .12, soft: .14 });
const buzz = flicker(clock, { rate: 7, depth: .12 });
colorNode = void.mul(.8)
  .add(blue.mul(halo.mul(.55)))
  .add(cyan.mul(core.mul(1.5).mul(buzz)))
  .add(ice.mul(core.mul(buzz).mul(.9)));`;
