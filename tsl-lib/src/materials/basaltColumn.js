/**
 * BASALT COLUMN — the Giant's Causeway. Cooling lava contracts, and a
 * contracting sheet has to crack: the pattern that relieves the most stress
 * per unit of new crack surface is hexagonal, which is why the columns are
 * hexagons on three continents and on Mars. The cracks start at the cooling
 * face and propagate INWARD, so the column axis points along the thermal
 * gradient — the hex lattice belongs in the plane perpendicular to it, never
 * on the surface generally. Cross-joints appear where cooling paused, which
 * is why the columns look stacked rather than continuous.
 *
 * @cost    see REGISTRY materials/basaltColumn
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { hexGrid } from '../pattern/grid.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'BASALT COLUMN';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal;
  // the lattice lives PERPENDICULAR to the cooling gradient, so read xz
  const jitter = fbm(TSL, p.mul(1.1), { octaves: 2 }).mul(0.07);
  const { edge, dist } = hexGrid(TSL, p.xz.add(jitter), { cells: 3.6, thickness: 0.05, soft: 0.03 });
  // cross-joints: cooling paused, so the column is stacked, not continuous
  const stack = TSL.smoothstep(0.42, 0.5, p.y.mul(3.1).add(dist.mul(0.6)).fract());
  const crack = TSL.max(edge, stack.mul(0.75));
  // weathering collects in the cracks and lightens the column faces
  const grain = fbm(TSL, p.mul(7.5), { octaves: 3 }).mul(0.5).add(0.5);
  const face = TSL.mix(0.55, 1.0, grain).mul(dist.mul(0.8).add(0.55));
  const fres = fresnel(TSL, { power: 3 });
  mat.colorNode = brand.void.mul(0.9)
    .add(brand.slate.mul(face.mul(1.5)))
    .add(brand.mist.mul(face.mul(grain).mul(0.28)))
    .sub(brand.slate.mul(crack.mul(0.55)))
    .add(brand.silver.mul(fres.pow(3).mul(0.22)));
  return { impl: 'native' };
};

export const source = () => `// contraction cracks at 120deg relieve the most
// stress per unit of crack — hence hexagons, on
// three continents and on Mars
const { edge, dist } = hexGrid(posL.xz, { cells: 3.6 });
// the lattice is PERPENDICULAR to the cooling
// gradient, so it reads xz and never the surface
const stack = smoothstep(.42, .5,
  posL.y.mul(3.1).add(dist.mul(.6)).fract());
colorNode = void.mul(.9)
  .add(slate.mul(face.mul(1.5)))
  .sub(slate.mul(max(edge, stack.mul(.75)).mul(.55)));`;
