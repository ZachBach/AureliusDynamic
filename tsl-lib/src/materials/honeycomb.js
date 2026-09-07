/**
 * HONEYCOMB — the optimal partition, and the reason the shape is not a
 * choice. Bees build round cells; surface tension in the warm wax pulls the
 * walls into the configuration with the least perimeter per unit area, and
 * for a plane that is provably the hexagon (Hales, 1999). So the hexagon is
 * physics finishing the bees' work. Two details make it read as wax rather
 * than as a hex grid: the walls have THICKNESS and catch light on their
 * inner faces, and filled cells sit proud of empty ones.
 *
 * @cost    see REGISTRY materials/honeycomb
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { hexGrid } from '../pattern/grid.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'HONEYCOMB';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  const p = TSL.positionLocal;
  const soften = fbm(TSL, p.mul(2.4), { octaves: 2 }).mul(0.05); // hand-built, not CAD
  const { edge, dist } = hexGrid(TSL, p.xy.add(soften), { cells: 5.2, thickness: 0.09, soft: 0.035 });
  // the wall has thickness: an outer crest and an inner face that catches light
  const crest = TSL.smoothstep(0.34, 0.5, dist);
  const innerFace = TSL.smoothstep(0.5, 0.30, dist).mul(edge);
  // which cells are capped with honey — a slow field, so they cluster
  const filled = TSL.smoothstep(0.45, 0.62, fbm(TSL, p.mul(1.6), { octaves: 2 }).mul(0.5).add(0.5));
  const wax = TSL.mix(solar.swarmWarm.mul(0.75), solar.mid, crest);
  const honey = solar.limb.mul(0.85).add(solar.mid.mul(0.4));
  const cellFloor = TSL.mix(brand.slate.mul(0.5), honey, filled);
  const fres = fresnel(TSL, { power: 3 });
  mat.colorNode = TSL.mix(cellFloor, wax, edge)
    .add(solar.hot.mul(innerFace.mul(0.35)))
    .add(solar.hot.mul(filled.mul(crest).mul(edge.oneMinus()).mul(0.25)))
    .add(brand.ice.mul(fres.pow(4).mul(0.2)));
  return { impl: 'native' };
};

export const source = () => `// bees build ROUND cells; surface tension in the
// warm wax pulls them to least-perimeter, which for
// a plane is provably the hexagon (Hales 1999)
const { edge, dist } = hexGrid(posL.xy, { cells: 5.2 });
// the wall has THICKNESS: outer crest, inner face
const crest = smoothstep(.34, .5, dist);
const innerFace = smoothstep(.5, .30, dist).mul(edge);
// capping clusters, so drive it from a slow field
const filled = smoothstep(.45, .62, fbm(posL.mul(1.6)));
colorNode = mix(cellFloor, wax, edge)
  .add(hot.mul(innerFace.mul(.35)));`;
