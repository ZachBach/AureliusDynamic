/**
 * CRACKED CLAY — a dry lakebed. The crack network is worley's F2−F1 cell
 * wall, but a constant wall width gives wallpaper. Real playa cracks widen
 * where the mud dried hardest, so a slow fbm dryness field sets the threshold
 * the wall is cut at: the same lattice reads as hairline fissures in one
 * corner and open canyons in the next. The plates curl at their rims, which
 * is the lighter band just inside each crack.
 *
 * @cost    see REGISTRY materials/crackedClay
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'CRACKED CLAY';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.mul(4.4);
  const cell = worleyF1F2(TSL, p, { impl: 'fallback' });
  const wall = cell.y.sub(cell.x); // 0 exactly on a cell boundary
  const dry = fbm(TSL, TSL.positionLocal.mul(1.1), { octaves: 3 }).mul(0.5).add(0.5);
  const width = dry.mul(0.16).add(0.02); // dryness sets how wide the crack cuts
  const crack = TSL.smoothstep(width, 0, wall);
  const curl = TSL.smoothstep(width.mul(2.6), width, wall); // raised plate rim
  const grit = fbm(TSL, p.mul(6), { octaves: 2 }).mul(0.5).add(0.5);
  mat.colorNode = ramp(TSL, dry, [
    [0.0, brand.slate.mul(0.9)],
    [0.5, brand.gold.mul(0.45)],
    [1.0, brand.gold.mul(0.55)],
  ]).mul(grit.mul(0.25).add(0.8))
    .add(brand.ice.mul(curl.sub(crack).max(0).mul(0.28)))
    .mul(crack.oneMinus().mul(0.88).add(0.12));
  return { impl: 'fallback' };
};

export const source = () => `const wall = cell.y.sub(cell.x);  // F2−F1
const dry = fbm(posL.mul(1.1)).mul(.5).add(.5);
const width = dry.mul(.16).add(.02);
const crack = smoothstep(width, 0, wall);
// one lattice, but dryness sets the cut width —
// hairlines here, canyons there
const curl = smoothstep(width.mul(2.6), width, wall);
colorNode = ramp(dry, [[0, slate.mul(.9)],
    [.5, gold.mul(.45)], [1, gold.mul(.55)]])
  .mul(grit.mul(.25).add(.8))
  .add(ice.mul(curl.sub(crack).max(0).mul(.28)))
  .mul(crack.oneMinus().mul(.88).add(.12));`;
