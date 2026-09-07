/**
 * LICHEN — not a plant but a partnership: a fungus farming an alga. Crustose
 * species grow radially from a spore and compete for bare rock, so a colony
 * is a disc with a bright ACTIVE MARGIN and a duller, older centre — growth
 * happens only at the rim. Where two colonies meet they stop, leaving a thin
 * line of bare substrate between them, which is why lichen-covered rock reads
 * as a mosaic. Worley gives the competition front for free, and the radial
 * age gradient inside each cell is what makes it read as biology.
 *
 * @cost    see REGISTRY materials/lichen
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { warp } from '../noise/warp.js';
import { fbm } from '../noise/fbm.js';

export const name = 'LICHEN';

export const apply = (TSL, mat) => {
  const { brand, terra, solar } = palette(TSL);
  const p = TSL.positionLocal;
  const q = warp(TSL, p.mul(3.4), { amp: 0.28, octaves: 2 });
  const cell = worleyF1F2(TSL, q, { impl: 'fallback' });
  const border = cell.y.sub(cell.x); // 0 exactly where two colonies met
  // growth happens ONLY at the rim, so age runs outward from the spore
  const age = TSL.smoothstep(0.05, 0.5, cell.x);
  const margin = TSL.smoothstep(0.34, 0.06, border); // the bright active edge
  const bare = TSL.smoothstep(0.035, 0.0, border); // rock, where they stopped
  // patchy coverage — the rock is never fully taken
  const cover = TSL.smoothstep(0.36, 0.62, fbm(TSL, p.mul(1.9), { octaves: 3 }).mul(0.5).add(0.5));
  const thallus = TSL.mix(terra.land.mul(0.75), solar.swarmWarm.mul(0.55), age);
  const rock = TSL.mix(brand.slate, brand.mist.mul(0.6), 0.35);
  const body = TSL.mix(rock.mul(0.7), thallus, cover)
    .add(terra.land.mul(margin.mul(cover).mul(0.55)))
    .sub(brand.void.mul(bare.mul(cover).mul(0.5)));
  // apothecia — the fungal fruiting cups, only on mature centres
  const cups = TSL.smoothstep(0.10, 0.0, worleyF1F2(TSL, q.mul(4.1), { impl: 'fallback' }).x);
  mat.colorNode = body.add(solar.limb.mul(cups.mul(age).mul(cover).mul(0.5)));
  return { impl: 'fallback' };
};

export const source = () => `const cell = worleyF1F2(warp(posL.mul(3.4)));
const border = cell.y.sub(cell.x);  // where two met
// growth happens ONLY at the rim, so age runs
// outward from the spore: bright margin, dull centre
const age = smoothstep(.05, .5, cell.x);
const margin = smoothstep(.34, .06, border);
const bare = smoothstep(.035, 0, border);  // rock
colorNode = mix(rock.mul(.7), thallus, cover)
  .add(land.mul(margin.mul(cover).mul(.55)))
  .sub(void.mul(bare.mul(cover).mul(.5)))
  .add(limb.mul(cups.mul(age).mul(.5)));  // apothecia`;
