/**
 * LEAF VEIN — a hierarchical transport network. A leaf solves the same
 * problem a city does: move fluid everywhere with the least plumbing, which
 * produces a midrib, secondary veins branching off it, and a fine reticulate
 * mesh between them that CLOSES INTO LOOPS. The loops matter — they are what
 * makes a leaf robust to damage, and they are why a purely branching fractal
 * never reads as a leaf. Worley walls supply closed cells at two scales; the
 * midrib is added separately because it is not part of the same statistics.
 *
 * @cost    see REGISTRY materials/leafVein
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { warp } from '../noise/warp.js';
import { fbm } from '../noise/fbm.js';

export const name = 'LEAF VEIN';

export const apply = (TSL, mat) => {
  const { brand, terra, solar } = palette(TSL);
  const p = TSL.positionLocal;
  // veins run away from the midrib, so stretch the domain across it
  const q = warp(TSL, p.mul(TSL.vec3(2.6, 1.05, 2.6)), { amp: 0.30, octaves: 2 });
  // reticulate mesh: CLOSED loops, which is why worley walls and not a fractal
  const coarse = worleyF1F2(TSL, q.mul(1.6), { impl: 'fallback' });
  const fine = worleyF1F2(TSL, q.mul(5.2), { impl: 'fallback' });
  const secondary = TSL.smoothstep(0.16, 0.02, coarse.y.sub(coarse.x));
  const tertiary = TSL.smoothstep(0.09, 0.01, fine.y.sub(fine.x)).mul(0.55);
  // the midrib obeys different statistics — it is added, not sampled
  const midrib = TSL.smoothstep(0.10, 0.0, p.x.add(fbm(TSL, p.mul(1.4), { octaves: 2 }).mul(0.12)).abs());
  const veins = TSL.max(TSL.max(secondary, tertiary), midrib);
  // blade colour: chlorophyll is densest between the veins
  const mottle = fbm(TSL, p.mul(3.1), { octaves: 3 }).mul(0.5).add(0.5);
  const blade = TSL.mix(terra.land.mul(0.55), terra.land.mul(1.15), mottle);
  mat.colorNode = blade.mul(veins.oneMinus().mul(0.55).add(0.45))
    .add(solar.swarmWarm.mul(veins.mul(0.35)))
    .add(brand.ice.mul(midrib.mul(0.18)))
    .sub(brand.void.mul(mottle.oneMinus().mul(0.12)));
  return { impl: 'fallback' };
};

export const source = () => `// a leaf's mesh CLOSES INTO LOOPS — that is what
// makes it damage-tolerant, and why a branching
// fractal never reads as a leaf. Worley walls do.
const coarse = worleyF1F2(q.mul(1.6));
const fine = worleyF1F2(q.mul(5.2));
const secondary = smoothstep(.16, .02, coarse.y.sub(coarse.x));
const tertiary = smoothstep(.09, .01, fine.y.sub(fine.x));
// the midrib obeys different statistics: ADD it
const midrib = smoothstep(.10, 0, posL.x.abs());
const veins = max(max(secondary, tertiary), midrib);
colorNode = blade.mul(veins.oneMinus().mul(.55).add(.45))
  .add(swarmWarm.mul(veins.mul(.35)));`;
